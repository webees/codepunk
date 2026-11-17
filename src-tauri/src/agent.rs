//! Pi sidecar RPC bridge.
#![allow(clippy::needless_pass_by_value)]

use std::{
    env,
    io::{BufRead, BufReader, Write},
    process::{Child, ChildStdin, Command, Stdio},
    sync::Mutex,
    thread,
};

use serde_json::Value;
use tauri::{AppHandle, Emitter, State};

const EVENT: &str = "pi://event";

/// Managed Pi sidecar process.
#[derive(Default)]
pub struct Pi(Mutex<Option<Session>>);

struct Session(Child, ChildStdin);

impl Drop for Session {
    fn drop(&mut self) {
        let _ = self.0.kill();
        let _ = self.0.wait();
    }
}

fn write(session: &mut Session, command: &Value) -> Result<(), String> {
    let line = serde_json::to_string(command).map_err(|error| error.to_string())?;
    writeln!(session.1, "{line}").map_err(|error| error.to_string())
}

/// Start the Pi sidecar in `cwd`.
///
/// # Errors
/// Returns an error if the sidecar cannot be spawned or its pipes are unavailable.
#[tauri::command]
pub fn pi_start(app: AppHandle, pi: State<'_, Pi>, cwd: String) -> Result<(), String> {
    let mut guard = pi.0.lock().map_err(|_| "Pi 状态锁已损坏")?;
    if guard
        .as_mut()
        .is_some_and(|session| matches!(session.0.try_wait(), Ok(None)))
    {
        return Ok(());
    }
    *guard = None;

    let binary = env::current_exe()
        .map_err(|error| format!("无法定位 CodePunk: {error}"))?
        .with_file_name(if cfg!(windows) { "pi.exe" } else { "pi" });
    let mut child = Command::new(binary)
        .args(["--mode", "rpc"])
        .current_dir(cwd)
        .stdin(Stdio::piped())
        .stdout(Stdio::piped())
        .spawn()
        .map_err(|error| format!("无法启动 Pi sidecar: {error}"))?;
    let stdin = child.stdin.take().ok_or("Pi stdin 不可用")?;
    let stdout = child.stdout.take().ok_or("Pi stdout 不可用")?;
    thread::spawn(move || {
        for line in BufReader::new(stdout).lines().map_while(Result::ok) {
            if app.emit(EVENT, line).is_err() {
                break;
            }
        }
        let _ = app.emit(EVENT, r#"{"type":"exit"}"#);
    });
    *guard = Some(Session(child, stdin));
    Ok(())
}

/// Write one RPC record to Pi.
///
/// # Errors
/// Returns an error when Pi is not running or the record cannot be written.
#[tauri::command]
pub fn pi_rpc(pi: State<'_, Pi>, command: Value) -> Result<(), String> {
    let mut guard = pi.0.lock().map_err(|_| "Pi 状态锁已损坏")?;
    write(guard.as_mut().ok_or("Pi 未启动")?, &command)
}

/// Stop the Pi sidecar.
///
/// # Errors
/// Returns an error if the process state lock is poisoned.
#[tauri::command]
pub fn pi_stop(pi: State<'_, Pi>) -> Result<(), String> {
    let mut guard = pi.0.lock().map_err(|_| "Pi 状态锁已损坏")?;
    drop(guard.take());
    Ok(())
}
