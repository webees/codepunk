//! Desktop entry point for the `CodePunk` application.

#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod agent;

fn main() -> tauri::Result<()> {
    tauri::Builder::default()
        .manage(agent::Runtime::default())
        .invoke_handler(tauri::generate_handler![
            agent::pi_status,
            agent::pi_start,
            agent::pi_send,
            agent::pi_abort,
            agent::pi_stop
        ])
        .run(tauri::generate_context!())
}
