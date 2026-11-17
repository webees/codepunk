//! Desktop entry point for the `CodePunk` application.

#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod agent;
mod pi;

fn main() -> tauri::Result<()> {
    tauri::Builder::default()
        .manage(agent::PiAgent::default())
        .invoke_handler(tauri::generate_handler![
            agent::pi_start,
            agent::pi_rpc,
            agent::pi_stop
        ])
        .run(tauri::generate_context!())
}
