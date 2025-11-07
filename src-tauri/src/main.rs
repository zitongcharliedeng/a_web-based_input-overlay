#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use tauri::Manager;
use serde::Serialize;

#[cfg(target_os = "linux")]
mod input_linux;

#[derive(Clone, Serialize)]
struct InputEvent {
    r#type: String,
    code: String,
    value: f32,
    timestamp: u64,
}

fn main() {
    tauri::Builder::default()
        .setup(|app| {
            let app_handle = app.handle();

            #[cfg(target_os = "linux")]
            {
                println!("Starting Linux input capture...");
                input_linux::start_capture(app_handle.clone());
            }

            #[cfg(not(target_os = "linux"))]
            {
                println!("Non-Linux platform - input capture not implemented yet");
            }

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
