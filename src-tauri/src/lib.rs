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
