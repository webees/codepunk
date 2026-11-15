//! Codepunk desktop core.
//!
//! The crate is intentionally split into small modules so the Tauri shell stays
//! a thin adapter while domain logic remains plain, testable Rust.

mod app_info;

/// Starts the Tauri application.
///
/// Returns an error when the runtime fails to initialize, which lets `main`
/// terminate with a non-zero exit code instead of a silent panic.
pub fn run() -> tauri::Result<()> {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![app_info::runtime_info])
        .run(tauri::generate_context!())
}

/// Convenience re-export used by the binary entry point.
pub use app_info::runtime_info;

#[cfg(test)]
mod tests {
    use app_info::RuntimeInfo;

    use super::*;

    #[test]
    fn runtime_info_is_populated() {
        let info: RuntimeInfo = runtime_info();

        assert_ne!(info.app_name, "");
        assert_eq!(info.app_version, env!("CARGO_PKG_VERSION"));
        assert_ne!(info.tauri_version, "");
        assert_ne!(info.platform, "");
        assert_ne!(info.architecture, "");
    }
}
