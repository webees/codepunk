//! Desktop entry point for the Codepunk application.

#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

fn main() {
    if let Err(error) = codepunk_lib::run() {
        eprintln!("fatal: {error}");
        std::process::exit(1);
    }
}
