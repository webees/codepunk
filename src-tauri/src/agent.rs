//! Bridge between Tauri and the Pi coding agent's RPC mode.

use std::{
    env,
    io::{BufRead, BufReader, Read, Write},
    path::Path,
    process::{Child, ChildStdin, Command, Stdio},
    sync::Mutex,
    thread,
};

use serde::Serialize;
use serde_json::{Value, json};
use tauri::{AppHandle, Emitter, State};

const EVENT: &str = "pi://event";

/// Shared Pi process state managed by Tauri.
#[derive(Default)]
pub struct Runtime(Mutex<Option<Session>>);

struct Session {
    child: Child,
    stdin: ChildStdin,
}

impl Drop for Session {
    fn drop(&mut self) {
        let _ = self.child.kill();
        let _ = self.child.wait();
    }
}

/// Pi process status.
#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct Status {
    running: bool,
}

fn command() -> Result<Command, String> {
    let name = if cfg!(windows) { "pi.exe" } else { "pi" };
    let directory = env::current_exe()
        .map_err(|error| format!("无法定位 CodePunk 可执行文件: {error}"))?
        .parent()
        .ok_or_else(|| "无法定位 CodePunk 安装目录".to_owned())?
        .to_path_buf();
    Ok(Command::new(directory.join(name)))
}

fn current_status(state: &mut Option<Session>) -> Status {
    if state
        .as_mut()
        .is_some_and(|session| session.child.try_wait().ok().flatten().is_some())
    {
        *state = None;
    }

    Status {
        running: state.is_some(),
    }
}

fn event_from_line(line: &str, stderr: bool) -> Value {
    if stderr {
        return json!({"type": "log", "level": "stderr", "message": line});
    }
    serde_json::from_str(line)
        .unwrap_or_else(|_| json!({"type": "log", "level": "stdout", "message": line}))
}

fn forward<R: Read + Send + 'static>(app: AppHandle, stream: R, stderr: bool) {
    thread::spawn(move || {
        for line in BufReader::new(stream).lines() {
            match line {
                Ok(line) if !line.trim().is_empty() => {
                    let _ = app.emit(EVENT, event_from_line(&line, stderr));
                }
                Ok(_) => {}
                Err(error) => {
                    let _ = app.emit(
                        EVENT,
                        json!({"type": "error", "message": error.to_string()}),
                    );
                    break;
                }
            }
        }
        let channel = if stderr { "stderr" } else { "stdout" };
        let _ = app.emit(EVENT, json!({"type": "exit", "channel": channel}));
    });
}

fn write_record(session: &mut Session, value: &Value) -> std::io::Result<()> {
    serde_json::to_writer(&mut session.stdin, value)?;
    session.stdin.write_all(b"\n")?;
    session.stdin.flush()
}

fn send(state: &State<'_, Runtime>, value: &Value) -> Result<(), String> {
    let mut guard = state.0.lock().map_err(|_| "Pi 状态锁已损坏".to_owned())?;
    let Some(session) = guard.as_mut() else {
        return Err("Pi 尚未启动".to_owned());
    };
    if session
        .child
        .try_wait()
        .map_err(|error| error.to_string())?
        .is_some()
    {
        *guard = None;
        return Err("Pi 已退出".to_owned());
    }
    write_record(session, value).map_err(|error| format!("无法写入 Pi: {error}"))
}

/// Return Pi process status.
///
/// # Errors
///
/// Returns an error when the runtime lock is poisoned.
#[tauri::command]
#[allow(clippy::needless_pass_by_value)]
pub fn pi_status(state: State<'_, Runtime>) -> Result<Status, String> {
    let mut guard = state.0.lock().map_err(|_| "Pi 状态锁已损坏".to_owned())?;
    Ok(current_status(&mut guard))
}

/// Start a Pi RPC session in the requested working directory.
///
/// # Errors
///
/// Returns an error when the sidecar is missing, the directory is invalid, or
/// the process cannot be spawned.
#[tauri::command]
#[allow(clippy::needless_pass_by_value)]
pub fn pi_start(
    app: AppHandle,
    state: State<'_, Runtime>,
    cwd: Option<String>,
) -> Result<Status, String> {
    let mut guard = state.0.lock().map_err(|_| "Pi 状态锁已损坏".to_owned())?;
    let status = current_status(&mut guard);
    if status.running {
        return Ok(status);
    }

    let directory = cwd.unwrap_or_else(|| ".".to_owned());
    if !Path::new(&directory).is_dir() {
        return Err(format!("工作目录不存在: {directory}"));
    }
    let mut child = command()?
        .arg("--mode")
        .arg("rpc")
        .current_dir(&directory)
        .stdin(Stdio::piped())
        .stdout(Stdio::piped())
        .stderr(Stdio::piped())
        .spawn()
        .map_err(|error| format!("无法启动 Pi，请确认 sidecar 已随应用打包: {error}"))?;
    let (Some(stdin), Some(stdout), Some(stderr)) =
        (child.stdin.take(), child.stdout.take(), child.stderr.take())
    else {
        let _ = child.kill();
        let _ = child.wait();
        return Err("无法连接 Pi 的输入输出".to_owned());
    };

    *guard = Some(Session { child, stdin });
    forward(app.clone(), stdout, false);
    forward(app, stderr, true);
    Ok(current_status(&mut guard))
}

/// Send a prompt to the running Pi session.
///
/// # Errors
///
/// Returns an error when Pi is not running or stdin cannot be written.
#[tauri::command]
#[allow(clippy::needless_pass_by_value)]
pub fn pi_send(state: State<'_, Runtime>, message: String) -> Result<(), String> {
    send(&state, &json!({"type": "prompt", "message": message}))
}

/// Abort the active Pi turn.
///
/// # Errors
///
/// Returns an error when Pi is not running or stdin cannot be written.
#[tauri::command]
#[allow(clippy::needless_pass_by_value)]
pub fn pi_abort(state: State<'_, Runtime>) -> Result<(), String> {
    send(&state, &json!({"type": "abort"}))
}

/// Stop the Pi process and release its session.
///
/// # Errors
///
/// Returns an error when the runtime lock is poisoned.
#[tauri::command]
#[allow(clippy::needless_pass_by_value)]
pub fn pi_stop(state: State<'_, Runtime>) -> Result<(), String> {
    let mut guard = state.0.lock().map_err(|_| "Pi 状态锁已损坏".to_owned())?;
    if let Some(mut session) = guard.take() {
        let _ = write_record(&mut session, &json!({"type": "abort"}));
    }
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::event_from_line;

    #[test]
    fn parses_protocol_records() {
        let event = event_from_line(r#"{"type":"agent_settled","aborted":false}"#, false);
        assert_eq!(event["type"], "agent_settled");
        assert_eq!(event["aborted"], false);
    }

    #[test]
    fn wraps_plain_and_stderr_lines() {
        let stdout = event_from_line("not json", false);
        assert_eq!(stdout["type"], "log");
        assert_eq!(stdout["message"], "not json");

        let stderr = event_from_line(r#"{"type":"noise"}"#, true);
        assert_eq!(stderr["type"], "log");
        assert_eq!(stderr["level"], "stderr");
    }
}
