//! Desktop entry point for the Codepunk application.

#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

fn main() -> tauri::Result<()> {
    codepunk_lib::run()
}
