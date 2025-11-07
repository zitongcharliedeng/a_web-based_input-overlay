mod input;
mod renderer;
mod shaders;

use winit::{
    event::{Event, WindowEvent},
    event_loop::EventLoop,
    window::WindowBuilder,
};
use log::info;
use std::sync::{Arc, Mutex};

#[tokio::main]
async fn main() {
    env_logger::init();

    info!("Starting wgpu input overlay with evdev");

    let event_loop = EventLoop::new().unwrap();

    // Create transparent, always-on-top window
    let window = WindowBuilder::new()
        .with_title("Input Overlay - wgpu")
        .with_inner_size(winit::dpi::LogicalSize::new(800.0, 600.0))
        .with_transparent(true)
        .build(&event_loop)
        .expect("Failed to create window");

    // Set window properties (platform-specific)
    #[cfg(target_os = "linux")]
    {
        use winit::platform::wayland::WindowExtWayland;
        info!("Window created on Linux (Wayland-native)");
    }

    // Initialize wgpu renderer
    let mut renderer = pollster::block_on(renderer::Renderer::new(&window))
        .expect("Failed to initialize renderer");

    // Shared state for input events
    let input_state = Arc::new(Mutex::new(input::InputState::new()));

    // Spawn evdev input listener in background
    let input_state_clone = Arc::clone(&input_state);
    let _input_thread = tokio::spawn(async move {
        input::start_evdev_listener(input_state_clone).await;
    });

    info!("Event loop started");

    // Main event loop
    event_loop
        .run(move |event, target| {
            match event {
                Event::WindowEvent {
                    window_id: _,
                    event: WindowEvent::CloseRequested,
                } => {
                    target.exit();
                }
                Event::WindowEvent {
                    window_id: _,
                    event: WindowEvent::RedrawRequested,
                } => {
                    // Render frame
                    let state = input_state.lock().unwrap();
                    renderer.render(&state).expect("Failed to render");
                }
                Event::AboutToWait => {
                    window.request_redraw();
                }
                _ => {}
            }
        })
        .expect("Event loop error");
}
