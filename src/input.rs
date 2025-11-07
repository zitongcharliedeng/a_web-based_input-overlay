use evdev::Device;
use log::{info, warn, error};
use std::sync::{Arc, Mutex};

#[derive(Debug, Clone)]
pub struct InputState {
    pub w_pressed: bool,
    pub a_pressed: bool,
    pub s_pressed: bool,
    pub d_pressed: bool,
    pub mouse_x: f32,
    pub mouse_y: f32,
    pub mouse_buttons: u32,
}

impl InputState {
    pub fn new() -> Self {
        Self {
            w_pressed: false,
            a_pressed: false,
            s_pressed: false,
            d_pressed: false,
            mouse_x: 0.0,
            mouse_y: 0.0,
            mouse_buttons: 0,
        }
    }
}

pub async fn start_evdev_listener(state: Arc<Mutex<InputState>>) {
    info!("Starting evdev input listener");

    // Find keyboard devices
    let devices = match find_input_devices() {
        Ok(devs) => devs,
        Err(e) => {
            error!("Failed to enumerate input devices: {}", e);
            return;
        }
    };

    info!("Found {} input devices", devices.len());

    for device_path in devices {
        let state_clone = Arc::clone(&state);
        tokio::spawn(async move {
            if let Err(e) = handle_device(&device_path, state_clone).await {
                warn!("Error handling device {}: {}", device_path.display(), e);
            }
        });
    }
}

async fn handle_device(
    device_path: &std::path::Path,
    state: Arc<Mutex<InputState>>,
) -> Result<(), Box<dyn std::error::Error>> {
    let mut device = Device::open(device_path)?;
    info!("Opened device: {:?}", device.name()?);

    // Grab exclusive access
    device.grab()?;

    loop {
        let events = device.fetch_events()?;

        for event in events {
            match event.event_type() {
                evdev::EventType::KEY => {
                    let code = event.code();
                    let value = event.value();

                    let key_name = format_key(code);

                    match code {
                        evdev::Key::KEY_W.0 => {
                            let mut s = state.lock().unwrap();
                            s.w_pressed = value != 0;
                            info!("W key: {}", if value != 0 { "PRESSED" } else { "RELEASED" });
                        }
                        evdev::Key::KEY_A.0 => {
                            let mut s = state.lock().unwrap();
                            s.a_pressed = value != 0;
                        }
                        evdev::Key::KEY_S.0 => {
                            let mut s = state.lock().unwrap();
                            s.s_pressed = value != 0;
                        }
                        evdev::Key::KEY_D.0 => {
                            let mut s = state.lock().unwrap();
                            s.d_pressed = value != 0;
                        }
                        _ => {}
                    }
                }
                evdev::EventType::REL => {
                    // Handle relative motion (mouse movement)
                    let code = event.code();
                    let value = event.value() as f32;

                    match code {
                        evdev::RelativeAxis::REL_X.0 => {
                            let mut s = state.lock().unwrap();
                            s.mouse_x += value;
                        }
                        evdev::RelativeAxis::REL_Y.0 => {
                            let mut s = state.lock().unwrap();
                            s.mouse_y += value;
                        }
                        _ => {}
                    }
                }
                evdev::EventType::ABS => {
                    // Handle absolute motion (gamepad, absolute position)
                }
                _ => {}
            }
        }

        tokio::time::sleep(tokio::time::Duration::from_millis(1)).await;
    }
}

fn find_input_devices() -> Result<Vec<std::path::PathBuf>, Box<dyn std::error::Error>> {
    let mut devices = Vec::new();

    let input_dir = std::path::Path::new("/dev/input");
    if !input_dir.exists() {
        return Err("No /dev/input directory found".into());
    }

    for entry in std::fs::read_dir(input_dir)? {
        let entry = entry?;
        let path = entry.path();

        // Only look for event* files
        if let Some(file_name) = path.file_name() {
            if let Some(name) = file_name.to_str() {
                if name.starts_with("event") {
                    // Try to open and check if it's a keyboard/mouse
                    if let Ok(device) = Device::open(&path) {
                        if let Ok(name) = device.name() {
                            if should_include_device(&name) {
                                info!("Including device: {} ({})", name, path.display());
                                devices.push(path);
                            }
                        }
                    }
                }
            }
        }
    }

    Ok(devices)
}

fn should_include_device(name: &str) -> bool {
    let lower = name.to_lowercase();
    lower.contains("keyboard")
        || lower.contains("mouse")
        || lower.contains("input")
        || lower.contains("wacom")
}

fn format_key(code: u16) -> String {
    match code {
        evdev::Key::KEY_W.0 => "W".to_string(),
        evdev::Key::KEY_A.0 => "A".to_string(),
        evdev::Key::KEY_S.0 => "S".to_string(),
        evdev::Key::KEY_D.0 => "D".to_string(),
        evdev::Key::KEY_SPACE.0 => "SPACE".to_string(),
        evdev::Key::KEY_ESC.0 => "ESC".to_string(),
        _ => format!("KEY({:x})", code),
    }
}
