//! Tauri adapter for the Pi sidecar.
#![allow(clippy::needless_pass_by_value)]

use std::{env, path::Path, sync::Mutex};

use serde_json::Value;
use tauri::{AppHandle, Emitter, Manager, State};

use crate::pi::{Output, Pi};

const EVENT: &str = "pi://event";

/// Managed Pi sidecar process.
#[derive(Default)]
pub struct PiAgent(Mutex<Option<Pi>>);

/// Start the Pi sidecar in `cwd`.
///
/// # Errors
/// Returns an error if the working directory is invalid, the sidecar cannot be
/// spawned, or its pipes are unavailable.
#[tauri::command]
pub fn pi_start(app: AppHandle, agent: State<'_, PiAgent>, cwd: String) -> Result<(), String> {
    let mut guard = agent.0.lock().map_err(|_| "Pi 状态锁已损坏")?;
    if guard.as_mut().is_some_and(Pi::is_running) {
        return Ok(());
    }
    *guard = None;

    let cwd = Path::new(&cwd);
    if !cwd.is_dir() {
        return Err(format!("工作目录不存在: {}", cwd.display()));
    }
    let binary = env::current_exe()
        .map_err(|error| format!("无法定位 CodePunk: {error}"))?
        .with_file_name(format!("pi{}", env::consts::EXE_SUFFIX));
    let package = app
        .path()
        .resource_dir()
        .map_err(|error| format!("无法定位 Pi 资源: {error}"))?
        .join("pi-runtime");
    *guard = Some(Pi::spawn(&binary, cwd, &package, move |output| {
        let payload = match output {
            Output::Line(line) => line,
            Output::Exit => r#"{"type":"exit"}"#.to_string(),
        };
        let _ = app.emit(EVENT, payload);
    })?);
    Ok(())
}

/// Write one RPC record to Pi.
///
/// # Errors
/// Returns an error when Pi is not running or the record cannot be written.
#[tauri::command]
pub fn pi_rpc(agent: State<'_, PiAgent>, command: Value) -> Result<(), String> {
    let mut guard = agent.0.lock().map_err(|_| "Pi 状态锁已损坏")?;
    guard.as_mut().ok_or("Pi 未启动")?.send(&command)
}

/// Stop the Pi sidecar.
///
/// # Errors
/// Returns an error if the process state lock is poisoned.
#[tauri::command]
pub fn pi_stop(agent: State<'_, PiAgent>) -> Result<(), String> {
    let mut guard = agent.0.lock().map_err(|_| "Pi 状态锁已损坏")?;
    drop(guard.take());
    Ok(())
}
