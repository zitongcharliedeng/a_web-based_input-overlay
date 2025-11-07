use raylib::prelude::*;
use rdev::{grab, Event, EventType, Key};
use std::collections::HashSet;
use std::sync::{Arc, Mutex};

const WINDOW_WIDTH: i32 = 400;
const WINDOW_HEIGHT: i32 = 300;

fn main() {
    // Shared state for pressed keys
    let pressed_keys = Arc::new(Mutex::new(HashSet::new()));
    let keys_clone = pressed_keys.clone();

    // Start global input capture in separate thread
    std::thread::spawn(move || {
        println!("Starting global input capture...");
        println!("NOTE: On Linux, you must be in the 'input' group:");
        println!("  sudo usermod -a -G input $USER");
        println!("  Then log out and log in.");

        let callback = move |event: Event| -> Option<Event> {
            match event.event_type {
                EventType::KeyPress(key) => {
                    let key_str = format!("{:?}", key);
                    keys_clone.lock().unwrap().insert(key_str.clone());
                    println!("Key pressed: {}", key_str);
                }
                EventType::KeyRelease(key) => {
                    let key_str = format!("{:?}", key);
                    keys_clone.lock().unwrap().remove(&key_str);
                    println!("Key released: {}", key_str);
                }
                _ => {}
            }
            // Return Some(event) to pass the event through
            // Return None to consume the event
            Some(event)
        };

        if let Err(error) = grab(callback) {
            eprintln!("ERROR starting input capture: {:?}", error);
            eprintln!("\nPossible causes:");
            eprintln!("  - Not in 'input' group (Linux)");
            eprintln!("  - No accessibility permissions (macOS)");
            eprintln!("  - Wayland compositor doesn't support evdev grab");
            std::process::exit(1);
        }
    });

    // Create transparent, click-through window with Raylib
    let (mut rl, thread) = raylib::init()
        .size(WINDOW_WIDTH, WINDOW_HEIGHT)
        .title("Input Overlay Demo")
        .build();

    // Set window configuration flags for overlay
    rl.set_window_state(ConfigFlags::WINDOW_TRANSPARENT);
    rl.set_window_state(ConfigFlags::WINDOW_UNDECORATED);
    rl.set_window_state(ConfigFlags::WINDOW_TOPMOST);

    // NOTE: Click-through (WINDOW_MOUSE_PASSTHROUGH) requires WINDOW_UNDECORATED
    // Raylib currently doesn't expose this flag in Rust bindings
    // You can add it manually if needed by modifying raylib-rs or using FFI

    rl.set_target_fps(60);

    // Main render loop
    while !rl.window_should_close() {
        let keys = pressed_keys.lock().unwrap();

        let mut d = rl.begin_drawing(&thread);

        // Clear with transparent background
        d.clear_background(Color::BLANK);

        // Draw semi-transparent background panel
        d.draw_rectangle(10, 10, WINDOW_WIDTH - 20, WINDOW_HEIGHT - 20,
                         Color::new(30, 30, 30, 180));

        // Draw title
        d.draw_text("Global Input Overlay", 20, 20, 20, Color::WHITE);
        d.draw_text("(Press keys while focused elsewhere)", 20, 45, 12, Color::LIGHTGRAY);

        // Draw pressed keys
        let mut y_offset = 80;
        if keys.is_empty() {
            d.draw_text("No keys pressed", 20, y_offset, 16, Color::GRAY);
        } else {
            d.draw_text(&format!("{} keys pressed:", keys.len()), 20, y_offset, 14, Color::YELLOW);
            y_offset += 25;

            for (i, key) in keys.iter().enumerate() {
                if y_offset > WINDOW_HEIGHT - 40 {
                    d.draw_text("...", 20, y_offset, 14, Color::GRAY);
                    break;
                }

                // Draw key with background
                let key_text = key.as_str();
                d.draw_rectangle(20, y_offset - 2, 360, 22, Color::new(60, 120, 200, 150));
                d.draw_text(key_text, 25, y_offset, 16, Color::WHITE);

                y_offset += 25;
            }
        }

        // Draw instructions
        d.draw_text("ESC to close", 20, WINDOW_HEIGHT - 30, 12, Color::DARKGRAY);
    }

    println!("Overlay closed.");
}
