#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use rdev::{listen, Event, EventType};
use serde::{Deserialize, Serialize};
use std::sync::{Arc, Mutex};
use tauri::State;

#[derive(Debug, Serialize, Deserialize, Clone)]
struct InputEvent {
    event_type: String,
    key: Option<String>,
    mouse_x: Option<i32>,
    mouse_y: Option<i32>,
    button: Option<String>,
}

struct InputState {
    listening: Arc<Mutex<bool>>,
}

#[tauri::command]
fn start_input_listener(window: tauri::Window, state: State<InputState>) {
    let mut listening = state.listening.lock().unwrap();
    if *listening {
        return;
    }
    *listening = true;
    drop(listening);

    let window_clone = window.clone();

    std::thread::spawn(move || {
        if let Err(error) = listen(move |event: Event| {
            let listening = state.listening.lock().unwrap();
            if !*listening {
                return;
            }
            drop(listening);

            let input_event = match event.event_type {
                EventType::KeyPress(key) => InputEvent {
                    event_type: "key_press".to_string(),
                    key: Some(format!("{:?}", key)),
                    mouse_x: None,
                    mouse_y: None,
                    button: None,
                },
                EventType::KeyRelease(key) => InputEvent {
                    event_type: "key_release".to_string(),
                    key: Some(format!("{:?}", key)),
                    mouse_x: None,
                    mouse_y: None,
                    button: None,
                },
                EventType::MouseMove { x, y } => InputEvent {
                    event_type: "mouse_move".to_string(),
                    key: None,
                    mouse_x: Some(x as i32),
                    mouse_y: Some(y as i32),
                    button: None,
                },
                EventType::MousePress(button) => InputEvent {
                    event_type: "mouse_press".to_string(),
                    key: None,
                    mouse_x: None,
                    mouse_y: None,
                    button: Some(format!("{:?}", button)),
                },
                EventType::MouseRelease(button) => InputEvent {
                    event_type: "mouse_release".to_string(),
                    key: None,
                    mouse_x: None,
                    mouse_y: None,
                    button: Some(format!("{:?}", button)),
                },
                EventType::Wheel { delta_x, delta_y } => InputEvent {
                    event_type: "wheel".to_string(),
                    key: Some(format!("dx={},dy={}", delta_x, delta_y)),
                    mouse_x: None,
                    mouse_y: None,
                    button: None,
                },
            };

            let _ = window_clone.emit("input-event", &input_event);
        }) {
            eprintln!("Error listening to input: {:?}", error);
        }
    });
}

#[tauri::command]
fn stop_input_listener(state: State<InputState>) {
    let mut listening = state.listening.lock().unwrap();
    *listening = false;
}

fn main() {
    let input_state = InputState {
        listening: Arc::new(Mutex::new(false)),
    };

    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![start_input_listener, stop_input_listener])
        .manage(input_state)
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
