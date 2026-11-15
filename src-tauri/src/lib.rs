//! Codepunk desktop core.

use serde::Serialize;

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct RuntimeInfo {
    app_version: &'static str,
    tauri_version: &'static str,
    platform: &'static str,
    architecture: &'static str,
}

/// Returns metadata about the running desktop process.
#[tauri::command]
fn runtime_info() -> RuntimeInfo {
    RuntimeInfo {
        app_version: env!("CARGO_PKG_VERSION"),
        tauri_version: tauri::VERSION,
        platform: std::env::consts::OS,
        architecture: std::env::consts::ARCH,
    }
}

/// Starts the Tauri application.
///
/// # Errors
///
/// Returns a [`tauri::Error`] when the application runtime cannot start.
pub fn run() -> tauri::Result<()> {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![runtime_info])
        .run(tauri::generate_context!())
}

#[cfg(test)]
mod tests {
    use super::runtime_info;

    #[test]
    fn reports_compile_time_constants() {
        let info = runtime_info();

        assert_eq!(info.app_version, env!("CARGO_PKG_VERSION"));
        assert_eq!(info.platform, std::env::consts::OS);
        assert_eq!(info.architecture, std::env::consts::ARCH);
    }
}
