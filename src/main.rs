mod input;
mod overlay;

use raylib::prelude::*;
use std::sync::{Arc, Mutex};
use std::thread;

fn main() {
    // Shared state for input
    let w_key_pressed = Arc::new(Mutex::new(false));
    let w_key_clone = Arc::clone(&w_key_pressed);

    // Start input listener thread
    thread::spawn(move || {
        input::start_input_listener(w_key_clone);
    });

    // Initialize Raylib window
    let (mut rl, thread) = raylib::init()
        .size(1920, 1080)
        .title("Input Overlay - Raylib Demo")
        .transparent()
        .undecorated()
        .build();

    // Set window to always on top (platform-specific, best effort)
    unsafe {
        // Note: Raylib doesn't have built-in always-on-top,
        // so we rely on window manager rules
    }

    rl.set_target_fps(60);

    // FPS tracking
    let mut frame_count = 0;
    let mut fps_timer = 0.0;
    let mut current_fps = 60;

    println!("Raylib overlay started!");
    println!("Window: 1920x1080, transparent, undecorated");
    println!("Press W key to test input capture (window can be unfocused)");
    println!("Press ESC to exit");

    // Main render loop
    while !rl.window_should_close() {
        // Update FPS counter
        frame_count += 1;
        fps_timer += rl.get_frame_time();
        if fps_timer >= 1.0 {
            current_fps = frame_count;
            frame_count = 0;
            fps_timer = 0.0;
        }

        // Get W key state
        let w_pressed = *w_key_pressed.lock().unwrap();

        // Render
        let mut d = rl.begin_drawing(&thread);
        overlay::render(&mut d, w_pressed, current_fps);
    }

    println!("Overlay closed");
}
