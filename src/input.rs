use rdev::{listen, Event, EventType, Key};
use std::sync::{Arc, Mutex};

pub fn start_input_listener(w_key_pressed: Arc<Mutex<bool>>) {
    println!("[Input] Starting global input listener...");

    let callback = move |event: Event| {
        match event.event_type {
            EventType::KeyPress(key) => {
                if key == Key::KeyW {
                    println!("[Input] W key PRESSED");
                    *w_key_pressed.lock().unwrap() = true;
                }
            }
            EventType::KeyRelease(key) => {
                if key == Key::KeyW {
                    println!("[Input] W key released");
                    *w_key_pressed.lock().unwrap() = false;
                }
            }
            _ => {}
        }
    };

    // Start listening (blocks this thread)
    if let Err(error) = listen(callback) {
        eprintln!("[Input] Error listening to input events: {:?}", error);
    }
}
