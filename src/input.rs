use anyhow::Result;
use evdev::Device;
use std::path::Path;
use std::sync::Arc;
use tokio::sync::mpsc;
use tracing::{debug, info, warn};

#[derive(Debug, Clone)]
pub enum InputEvent {
    KeyPress(String),
    KeyRelease(String),
    MouseMove { x: i32, y: i32 },
    MouseButton { button: String, pressed: bool },
    MouseWheel { axis: String, delta: i32 },
    GamepadAxis { axis: String, value: f32 },
    GamepadButton { button: String, pressed: bool },
}

fn key_name(code: u16) -> String {
    match code {
        1 => "ESC", 2..=11 => format!("{}", code - 1), 12 => "MINUS",
        13 => "EQUAL", 14 => "BACKSPACE", 15 => "TAB", 16 => "Q",
        17 => "W", 18 => "E", 19 => "R", 20 => "T", 21 => "Y",
        22 => "U", 23 => "I", 24 => "O", 25 => "P", 26 => "LBRACKET",
        27 => "RBRACKET", 28 => "RETURN", 29 => "LCTRL", 30 => "A",
        31 => "S", 32 => "D", 33 => "F", 34 => "G", 35 => "H",
        36 => "J", 37 => "K", 38 => "L", 39 => "SEMICOLON",
        40 => "APOSTROPHE", 41 => "GRAVE", 42 => "LSHIFT", 43 => "BACKSLASH",
        44 => "Z", 45 => "X", 46 => "C", 47 => "V", 48 => "B",
        49 => "N", 50 => "M", 51 => "COMMA", 52 => "DOT", 53 => "SLASH",
        54 => "RSHIFT", 55 => "KPASTERISK", 56 => "LALT", 57 => "SPACE",
        58 => "CAPSLOCK", 59..=68 => format!("F{}", code - 58), 69 => "NUMLOCK",
        70 => "SCROLLLOCK", 100 => "RALT", 102 => "HOME", 103 => "UP",
        104 => "PAGEUP", 105 => "LEFT", 106 => "RIGHT", 107 => "END",
        108 => "DOWN", 109 => "PAGEDOWN", 110 => "INSERT", 111 => "DELETE",
        125 => "LMETA", 126 => "RMETA", _ => &format!("KEY_{}", code),
    }.to_string()
}

fn button_name(code: u16) -> String {
    match code {
        272 => "LEFT", 273 => "RIGHT", 274 => "MIDDLE",
        275 => "SIDE", 276 => "EXTRA", _ => &format!("BTN_{}", code),
    }.to_string()
}

fn axis_name(code: u16) -> String {
    match code {
        0 => "LX", 1 => "LY", 2 => "RX", 3 => "RY", 4 => "Z", 5 => "RZ",
        6 => "THROTTLE", 7 => "RUDDER", 8 => "WHEEL", 9 => "GAS", 10 => "BRAKE",
        16 => "HAT0X", 17 => "HAT0Y", _ => &format!("ABS_{}", code),
    }.to_string()
}

fn normalize_axis(value: i32) -> f32 {
    (value as f32) / 32768.0
}

pub async fn capture_input(
    tx: Arc<tokio::sync::Mutex<mpsc::Sender<InputEvent>>>,
) -> Result<()> {
    info!("Initializing evdev input capture");

    let mut devices = Vec::new();
    let input_dir = "/dev/input";

    if !Path::new(input_dir).exists() {
        warn!("{} does not exist, input capture will be limited", input_dir);
        return Ok(());
    }

    if let Ok(entries) = std::fs::read_dir(input_dir) {
        for entry in entries.flatten() {
            if let Some(name) = entry.file_name().to_str() {
                if name.starts_with("event") {
                    let path = entry.path();
                    match Device::open(&path) {
                        Ok(device) => {
                            info!("Opened input device: {}", path.display());
                            devices.push(device);
                        }
                        Err(e) => {
                            debug!("Failed to open {}: {}", path.display(), e);
                        }
                    }
                }
            }
        }
    }

    info!("Found {} input devices", devices.len());

    if devices.is_empty() {
        warn!("No input devices found. Are you in the 'input' group?");
        warn!("Run: sudo usermod -aG input $USER");
    }

    loop {
        let mut events_found = false;

        for device in &mut devices {
            if let Ok(Some(event)) = device.fetch_events() {
                events_found = true;

                let input_event = match event.event_type() {
                    evdev::EventType::KEY => {
                        let key = key_name(event.code());
                        if event.value() == 1 {
                            InputEvent::KeyPress(key)
                        } else if event.value() == 0 {
                            InputEvent::KeyRelease(key)
                        } else {
                            continue;
                        }
                    }
                    evdev::EventType::REL => match event.code() {
                        0 => InputEvent::MouseMove { x: event.value() as i32, y: 0 },
                        1 => InputEvent::MouseMove { x: 0, y: event.value() as i32 },
                        8 => InputEvent::MouseWheel {
                            axis: "VERTICAL".to_string(),
                            delta: event.value() as i32,
                        },
                        _ => continue,
                    },
                    evdev::EventType::ABS => {
                        let axis = axis_name(event.code());
                        let value = normalize_axis(event.value());
                        InputEvent::GamepadAxis { axis, value }
                    }
                    evdev::EventType::BTN => {
                        let button = button_name(event.code());
                        InputEvent::GamepadButton {
                            button,
                            pressed: event.value() != 0,
                        }
                    }
                    _ => continue,
                };

                if let Ok(tx) = tx.try_lock() {
                    let _ = tx.try_send(input_event);
                }
            }
        }

        if !events_found {
            tokio::time::sleep(tokio::time::Duration::from_millis(10)).await;
        }
    }
}
