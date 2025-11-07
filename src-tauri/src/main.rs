// Prevents additional console window on Windows in release
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use rdev::{listen, Event, EventType, Key, Button};
use serde::Serialize;
use std::thread;
use tauri::{Manager, Window};

#[derive(Clone, Serialize)]
struct KeyboardEvent {
    keycode: String,
    timestamp: u64,
}

#[derive(Clone, Serialize)]
struct MouseMoveEvent {
    x: f64,
    y: f64,
    timestamp: u64,
}

#[derive(Clone, Serialize)]
struct MouseButtonEvent {
    button: String,
    x: f64,
    y: f64,
    timestamp: u64,
}

#[derive(Clone, Serialize)]
struct MouseWheelEvent {
    delta: i64,
    direction: String,
    timestamp: u64,
}

fn key_to_string(key: Key) -> String {
    match key {
        Key::KeyA => "A".to_string(),
        Key::KeyB => "B".to_string(),
        Key::KeyC => "C".to_string(),
        Key::KeyD => "D".to_string(),
        Key::KeyE => "E".to_string(),
        Key::KeyF => "F".to_string(),
        Key::KeyG => "G".to_string(),
        Key::KeyH => "H".to_string(),
        Key::KeyI => "I".to_string(),
        Key::KeyJ => "J".to_string(),
        Key::KeyK => "K".to_string(),
        Key::KeyL => "L".to_string(),
        Key::KeyM => "M".to_string(),
        Key::KeyN => "N".to_string(),
        Key::KeyO => "O".to_string(),
        Key::KeyP => "P".to_string(),
        Key::KeyQ => "Q".to_string(),
        Key::KeyR => "R".to_string(),
        Key::KeyS => "S".to_string(),
        Key::KeyT => "T".to_string(),
        Key::KeyU => "U".to_string(),
        Key::KeyV => "V".to_string(),
        Key::KeyW => "W".to_string(),
        Key::KeyX => "X".to_string(),
        Key::KeyY => "Y".to_string(),
        Key::KeyZ => "Z".to_string(),
        Key::Num0 => "0".to_string(),
        Key::Num1 => "1".to_string(),
        Key::Num2 => "2".to_string(),
        Key::Num3 => "3".to_string(),
        Key::Num4 => "4".to_string(),
        Key::Num5 => "5".to_string(),
        Key::Num6 => "6".to_string(),
        Key::Num7 => "7".to_string(),
        Key::Num8 => "8".to_string(),
        Key::Num9 => "9".to_string(),
        Key::Space => "SPACE".to_string(),
        Key::ShiftLeft => "SHIFT_LEFT".to_string(),
        Key::ShiftRight => "SHIFT_RIGHT".to_string(),
        Key::ControlLeft => "CTRL_LEFT".to_string(),
        Key::ControlRight => "CTRL_RIGHT".to_string(),
        Key::Alt => "ALT".to_string(),
        Key::AltGr => "ALT_GR".to_string(),
        Key::Return => "ENTER".to_string(),
        Key::Escape => "ESCAPE".to_string(),
        Key::Backspace => "BACKSPACE".to_string(),
        Key::Tab => "TAB".to_string(),
        Key::CapsLock => "CAPS_LOCK".to_string(),
        Key::F1 => "F1".to_string(),
        Key::F2 => "F2".to_string(),
        Key::F3 => "F3".to_string(),
        Key::F4 => "F4".to_string(),
        Key::F5 => "F5".to_string(),
        Key::F6 => "F6".to_string(),
        Key::F7 => "F7".to_string(),
        Key::F8 => "F8".to_string(),
        Key::F9 => "F9".to_string(),
        Key::F10 => "F10".to_string(),
        Key::F11 => "F11".to_string(),
        Key::F12 => "F12".to_string(),
        Key::UpArrow => "UP".to_string(),
        Key::DownArrow => "DOWN".to_string(),
        Key::LeftArrow => "LEFT".to_string(),
        Key::RightArrow => "RIGHT".to_string(),
        _ => format!("{:?}", key),
    }
}

fn button_to_string(button: Button) -> String {
    match button {
        Button::Left => "left".to_string(),
        Button::Right => "right".to_string(),
        Button::Middle => "middle".to_string(),
        _ => format!("{:?}", button),
    }
}

fn get_timestamp() -> u64 {
    std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .unwrap()
        .as_millis() as u64
}

fn setup_input_capture(window: Window) {
    thread::spawn(move || {
        let callback = move |event: Event| {
            let timestamp = get_timestamp();

            match event.event_type {
                EventType::KeyPress(key) => {
                    let keycode = key_to_string(key);
                    let event_data = KeyboardEvent { keycode, timestamp };
                    let _ = window.emit("global-keydown", event_data);
                }
                EventType::KeyRelease(key) => {
                    let keycode = key_to_string(key);
                    let event_data = KeyboardEvent { keycode, timestamp };
                    let _ = window.emit("global-keyup", event_data);
                }
                EventType::MouseMove { x, y } => {
                    let event_data = MouseMoveEvent { x, y, timestamp };
                    let _ = window.emit("global-mousemove", event_data);
                }
                EventType::ButtonPress(button) => {
                    let button_str = button_to_string(button);
                    let event_data = MouseButtonEvent {
                        button: button_str,
                        x: 0.0,
                        y: 0.0,
                        timestamp,
                    };
                    let _ = window.emit("global-mousedown", event_data);
                }
                EventType::ButtonRelease(button) => {
                    let button_str = button_to_string(button);
                    let event_data = MouseButtonEvent {
                        button: button_str,
                        x: 0.0,
                        y: 0.0,
                        timestamp,
                    };
                    let _ = window.emit("global-mouseup", event_data);
                }
                EventType::Wheel { delta_x, delta_y } => {
                    let (delta, direction) = if delta_y > 0 {
                        (delta_y, "up")
                    } else if delta_y < 0 {
                        (-delta_y, "down")
                    } else if delta_x > 0 {
                        (delta_x, "right")
                    } else {
                        (-delta_x, "left")
                    };

                    let event_data = MouseWheelEvent {
                        delta,
                        direction: direction.to_string(),
                        timestamp,
                    };
                    let _ = window.emit("global-wheel", event_data);
                }
            }
        };

        if let Err(error) = listen(callback) {
            eprintln!("[rdev] Error: {:?}", error);
        }
    });
}

#[tauri::command]
fn has_global_input() -> bool {
    true
}

#[tauri::command]
fn is_readonly() -> bool {
    false
}

fn main() {
    tauri::Builder::default()
        .setup(|app| {
            let window = app.get_window("main").unwrap();
            window.set_always_on_top(true).unwrap();

            #[cfg(target_os = "linux")]
            {
                let _ = window.set_ignore_cursor_events(true);
            }

            setup_input_capture(window.clone());

            println!("[Tauri] Input overlay initialized");
            println!("[Tauri] Global input capture started (rdev)");

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![has_global_input, is_readonly])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
