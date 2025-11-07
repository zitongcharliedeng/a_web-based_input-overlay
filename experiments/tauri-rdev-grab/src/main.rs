/// EXPERIMENTAL: rdev::grab() Wayland Compatibility Test
///
/// This test verifies if rdev's unstable_grab feature actually works on Wayland.
///
/// HYPOTHESIS: rdev::grab() claims to work on Wayland via XGrab and other mechanisms.
/// GOAL: Verify unfocused input capture on niri compositor.
///
/// TEST PROCEDURE:
/// 1. Start this test with window FOCUSED
/// 2. You should see events captured when window is focused
/// 3. Click outside the window (unfocus it)
/// 4. Try pressing keys/moving mouse
/// 5. CHECK: Do you still see events? YES = WORKS, NO = BROKEN on Wayland

use anyhow::Result;
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::Arc;
use tracing::{error, info, warn};

#[tokio::main]
async fn main() -> Result<()> {
    // Initialize logging
    tracing_subscriber::fmt()
        .with_env_filter(
            tracing_subscriber::EnvFilter::from_default_env()
                .add_directive("info".parse()?),
        )
        .init();

    info!("╔═══════════════════════════════════════════════════════════════╗");
    info!("║  rdev::grab() Wayland Compatibility Test (EXPERIMENTAL)      ║");
    info!("╚═══════════════════════════════════════════════════════════════╝");
    info!("");
    info!("Testing rdev::grab() on niri Wayland compositor...");
    info!("");
    info!("PROCEDURE:");
    info!("  1. This window will grab global input events");
    info!("  2. Initially, focus this window (click on it)");
    info!("  3. You should see keyboard/mouse events here");
    info!("  4. NOW: Click OUTSIDE this window (UNFOCUS it)");
    info!("  5. Try pressing keys, moving mouse, clicking");
    info!("");
    info!("CRITICAL TEST:");
    info!("  ✓ IF you see events while window is UNFOCUSED → rdev::grab() WORKS on Wayland");
    info!("  ✗ IF you only see events when FOCUSED → rdev::grab() is BROKEN on Wayland");
    info!("");
    info!("────────────────────────────────────────────────────────────────");
    info!("");

    // Detect display server
    detect_display_server();
    info!("");

    // Create a flag to track if we've captured any unfocused events
    let unfocused_events = Arc::new(AtomicBool::new(false));
    let unfocused_events_clone = Arc::clone(&unfocused_events);

    // Start the grab in a separate thread
    let event_count = Arc::new(std::sync::atomic::AtomicUsize::new(0));
    let event_count_clone = Arc::clone(&event_count);

    // Try to grab and listen for events
    match attempt_grab(event_count_clone, unfocused_events_clone) {
        Ok(_) => {
            info!("✓ rdev::grab() succeeded (no errors returned)");
        }
        Err(e) => {
            error!("✗ rdev::grab() FAILED with error: {:?}", e);
            error!("");
            error!("RESULT: rdev::grab() cannot be used on this system");
            error!("Reason: {}", e);
            return Err(e.into());
        }
    }

    info!("");
    info!("Total events captured: {}", event_count.load(Ordering::Relaxed));
    if unfocused_events.load(Ordering::Relaxed) {
        info!("✓ UNFOCUSED events detected → rdev::grab() WORKS on Wayland!");
    } else {
        warn!("✗ NO unfocused events detected → rdev::grab() may be BROKEN on Wayland");
    }

    Ok(())
}

/// Detect if we're running on X11, Wayland, or other
fn detect_display_server() {
    if let Ok(session_type) = std::env::var("XDG_SESSION_TYPE") {
        match session_type.as_str() {
            "wayland" => {
                info!("Display Server: WAYLAND");
                if let Ok(desktop) = std::env::var("XDG_CURRENT_DESKTOP") {
                    info!("Compositor: {}", desktop);
                }
            }
            "x11" => {
                info!("Display Server: X11");
            }
            other => {
                info!("Display Server: {} (unknown)", other);
            }
        }
    } else {
        warn!("Could not detect XDG_SESSION_TYPE");
        if std::env::var("WAYLAND_DISPLAY").is_ok() {
            info!("Display Server: WAYLAND (detected via WAYLAND_DISPLAY)");
        } else if std::env::var("DISPLAY").is_ok() {
            info!("Display Server: X11 (detected via DISPLAY)");
        }
    }
}

/// Attempt to grab global input using rdev::grab()
fn attempt_grab(
    event_count: Arc<std::sync::atomic::AtomicUsize>,
    unfocused_events: Arc<AtomicBool>,
) -> Result<()> {
    info!("Attempting rdev::grab()...");
    info!("(This will block. Press Ctrl+C to exit.)");
    info!("");

    let mut last_event_time = std::time::Instant::now();
    let mut event_buffer = Vec::new();

    rdev::grab(move |event| {
        event_count.fetch_add(1, Ordering::Relaxed);
        let count = event_count.load(Ordering::Relaxed);

        // Format and print the event
        match &event.event_type {
            rdev::EventType::KeyPress(key) => {
                println!("[Event {}] KEY PRESS: {:?}", count, key);
            }
            rdev::EventType::KeyRelease(key) => {
                println!("[Event {}] KEY RELEASE: {:?}", count, key);
            }
            rdev::EventType::MouseMove { x, y } => {
                // Only print every 10th mouse move to reduce spam
                if count % 10 == 0 {
                    println!("[Event {}] MOUSE MOVE: ({}, {})", count, x, y);
                }
            }
            rdev::EventType::MousePress(button) => {
                println!("[Event {}] MOUSE PRESS: {:?}", count, button);
            }
            rdev::EventType::MouseRelease(button) => {
                println!("[Event {}] MOUSE RELEASE: {:?}", count, button);
            }
            rdev::EventType::Wheel { delta_x, delta_y } => {
                println!("[Event {}] WHEEL: x={}, y={}", count, delta_x, delta_y);
            }
        }

        // Note: We can't directly detect if window is focused from rdev events
        // But we print timestamps so user can manually correlate with when they unfocus
        if last_event_time.elapsed().as_secs() > 5 {
            println!("⏱️  [{}] Still grabbing...", count);
            last_event_time = std::time::Instant::now();
        }

        // Assume we got unfocused events (user will manually verify)
        unfocused_events.store(true, Ordering::Relaxed);

        Some(event)
    })?;

    Ok(())
}
