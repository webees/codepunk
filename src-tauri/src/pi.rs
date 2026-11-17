//! Pi sidecar process and JSONL transport.
//!
//! This module has no Tauri dependency so the agent runtime stays independent
//! from the desktop shell.

use std::{
    io::{BufRead, BufReader, Write},
    path::Path,
    process::{Child, Command, Stdio},
    thread,
    time::Duration,
};

use serde_json::Value;

/// Output produced by the Pi process.
pub enum Output {
    Line(String),
    Exit,
}

/// A running Pi sidecar.
pub struct Pi(Child);

impl Pi {
    /// Spawn Pi in `cwd`, forwarding stdout lines to `on_output`.
    ///
    /// # Errors
    /// Returns an error if the process cannot be spawned or its stdout is unavailable.
    pub fn spawn(
        binary: &Path,
        cwd: &Path,
        package: &Path,
        on_output: impl Fn(Output) + Send + 'static,
    ) -> Result<Self, String> {
        let mut child = Command::new(binary)
            .args(["--mode", "rpc"])
            .current_dir(cwd)
            .env("PI_PACKAGE_DIR", package)
            .stdin(Stdio::piped())
            .stdout(Stdio::piped())
            .spawn()
            .map_err(|error| format!("无法启动 Pi sidecar: {error}"))?;
        let stdout = child.stdout.take().ok_or("Pi stdout 不可用")?;
        thread::spawn(move || {
            for line in BufReader::new(stdout).lines().map_while(Result::ok) {
                on_output(Output::Line(line));
            }
            on_output(Output::Exit);
        });
        Ok(Self(child))
    }

    /// Send one JSON command to Pi.
    ///
    /// # Errors
    /// Returns an error if Pi is not accepting input.
    pub fn send(&mut self, command: &Value) -> Result<(), String> {
        let line = serde_json::to_string(command).map_err(|error| error.to_string())?;
        writeln!(self.0.stdin.as_mut().ok_or("Pi 已停止")?, "{line}")
            .map_err(|error| error.to_string())
    }

    /// Return whether the process is still running.
    pub fn is_running(&mut self) -> bool {
        matches!(self.0.try_wait(), Ok(None))
    }

    fn stop(&mut self) {
        drop(self.0.stdin.take());
        for _ in 0..20 {
            match self.0.try_wait() {
                Ok(Some(_)) => return,
                Ok(None) => thread::sleep(Duration::from_millis(50)),
                Err(_) => break,
            }
        }
        let _ = self.0.kill();
        let _ = self.0.wait();
    }
}

impl Drop for Pi {
    fn drop(&mut self) {
        self.stop();
    }
}
