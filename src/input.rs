use anyhow::{anyhow, Result};
use evdev::{Device, EventType};
use std::thread;
use std::time::Duration;

pub async fn start_capture() -> Result<()> {
    tokio::task::spawn_blocking(move || {
        if let Err(e) = capture_evdev_events() {
            eprintln!("[evdev] Error: {}", e);
        }
    });
    Ok(())
}

fn capture_evdev_events() -> Result<()> {
    println!("[evdev] Starting global input capture...");

    let mut devices = Vec::new();
    for entry in std::fs::read_dir("/dev/input")? {
        let entry = entry?;
        if let Some(name) = entry.file_name().to_str() {
            if name.starts_with("event") {
                if let Ok(device) = Device::open(entry.path()) {
                    if let Ok(name) = device.name() {
                        println!("[evdev] Opened: {}", name);
                        devices.push(device);
                    }
                }
            }
        }
    }

    if devices.is_empty() {
        return Err(anyhow!("No input devices. Run: sudo usermod -aG input $USER"));
    }

    println!("[evdev] Found {} devices", devices.len());

    loop {
        for device in &devices {
            if let Ok(events) = device.fetch_events() {
                for event in events {
                    match event.event_type() {
                        EventType::KEY => {
                            if let Some(key) = key_to_string(event.code()) {
                                let state = if event.value() != 0 { "DOWN" } else { "UP" };
                                println!("Key {}: {}", key, state);
                            }
                        }
                        EventType::ABSOLUTE => {
                            if let Some(axis) = axis_to_string(event.code()) {
                                let value = (event.value() as f32 / 127.0).clamp(-1.0, 1.0);
                                if value.abs() > 0.1 {
                                    println!("Axis {}: {:.2}", axis, value);
                                }
                            }
                        }
                        _ => {}
                    }
                }
            }
        }
        thread::sleep(Duration::from_millis(1));
    }
}

fn key_to_string(code: u16) -> Option<String> {
    match code {
        17 => Some("W"), 30 => Some("A"), 31 => Some("S"), 32 => Some("D"),
        57 => Some("SPACE"), 42 => Some("SHIFT"), 29 => Some("CTRL"),
        _ => None,
    }.map(|s| s.to_string())
}

fn axis_to_string(code: u16) -> Option<String> {
    match code {
        0x00 => Some("ABS_X"), 0x01 => Some("ABS_Y"),
        0x03 => Some("ABS_RX"), 0x04 => Some("ABS_RY"),
        _ => None,
    }.map(|s| s.to_string())
}
