use evdev::{Device, InputEventKind, Key};
use gilrs::{Gilrs, Event as GilrsEvent, EventType, Axis, Button};
use std::time::{SystemTime, UNIX_EPOCH};
use xkbcommon::xkb;
use tauri::{AppHandle, Manager};
use serde::Serialize;

#[derive(Clone, Serialize)]
struct InputEvent {
    r#type: String,
    code: String,
    value: f32,
    timestamp: u64,
}

pub fn start_capture(app: AppHandle) {
    // Start keyboard capture
    let app_keyboard = app.clone();
    tokio::spawn(async move {
        if let Err(e) = keyboard_capture(app_keyboard).await {
            eprintln!("Keyboard capture error: {}", e);
        }
    });

    // Start mouse capture
    let app_mouse = app.clone();
    tokio::spawn(async move {
        if let Err(e) = mouse_capture(app_mouse).await {
            eprintln!("Mouse capture error: {}", e);
        }
    });

    // Start gamepad capture
    let app_gamepad = app.clone();
    tokio::spawn(async move {
        if let Err(e) = gamepad_capture(app_gamepad).await {
            eprintln!("Gamepad capture error: {}", e);
        }
    });
}

async fn keyboard_capture(app: AppHandle) -> Result<(), Box<dyn std::error::Error>> {
    // Find keyboard device
    let keyboard = find_device_by_capability("keyboard")?;
    let mut events = keyboard.into_event_stream()?;

    // Setup xkbcommon for key translation
    let context = xkb::Context::new(xkb::CONTEXT_NO_FLAGS);
    let keymap = xkb::Keymap::new_from_names(
        &context,
        &xkb::RMLVO {
            layout: Some("us"),  // TODO: Auto-detect layout
            ..Default::default()
        },
        xkb::KEYMAP_COMPILE_NO_FLAGS,
    ).ok_or("Failed to create keymap")?;
    let mut state = xkb::State::new(&keymap);

    println!("Keyboard capture started");

    loop {
        let event = events.next_event().await?;

        if let InputEventKind::Key(key) = event.kind() {
            // Translate keycode using xkbcommon
            let xkb_keycode = key as u32 + 8; // evdev offset

            // Update state
            let is_pressed = event.value() > 0;
            if is_pressed {
                state.update_key(xkb_keycode, xkb::KeyDirection::Down);
            } else {
                state.update_key(xkb_keycode, xkb::KeyDirection::Up);
            }

            // Get key name
            let keysym = state.key_get_one_sym(xkb_keycode);
            let key_name = xkb::keysym_get_name(keysym);

            // Convert to DOM code
            let dom_code = evdev_key_to_dom_code(key);

            let input_event = InputEvent {
                r#type: if is_pressed { "KeyDown" } else { "KeyUp" }.to_string(),
                code: dom_code,
                value: event.value() as f32,
                timestamp: timestamp(),
            };

            app.emit_all("input-event", &input_event).ok();
        }
    }
}

async fn mouse_capture(app: AppHandle) -> Result<(), Box<dyn std::error::Error>> {
    // Find mouse device
    let mouse = find_device_by_capability("mouse")?;
    let mut events = mouse.into_event_stream()?;

    println!("Mouse capture started");

    loop {
        let event = events.next_event().await?;

        match event.kind() {
            InputEventKind::RelAxis(axis) => {
                use evdev::RelativeAxisType::*;

                let event_type = match axis {
                    REL_X => Some("MouseMoveX"),
                    REL_Y => Some("MouseMoveY"),
                    REL_WHEEL => Some("MouseWheel"),
                    REL_HWHEEL => Some("MouseWheelH"),
                    _ => None,
                };

                if let Some(event_type) = event_type {
                    let input_event = InputEvent {
                        r#type: event_type.to_string(),
                        code: format!("{:?}", axis),
                        value: event.value() as f32,
                        timestamp: timestamp(),
                    };

                    app.emit_all("input-event", &input_event).ok();
                }
            }
            InputEventKind::Key(button) => {
                // Mouse buttons
                let is_pressed = event.value() > 0;
                let input_event = InputEvent {
                    r#type: if is_pressed { "MouseDown" } else { "MouseUp" }.to_string(),
                    code: format!("Button{}", button as u32 - 272), // BTN_LEFT = 272
                    value: event.value() as f32,
                    timestamp: timestamp(),
                };

                app.emit_all("input-event", &input_event).ok();
            }
            _ => {}
        }
    }
}

async fn gamepad_capture(app: AppHandle) -> Result<(), Box<dyn std::error::Error>> {
    let mut gilrs = Gilrs::new().map_err(|e| format!("Gilrs error: {}", e))?;

    println!("Gamepad capture started");

    loop {
        // Poll for events
        while let Some(GilrsEvent { id, event, .. }) = gilrs.next_event() {
            match event {
                EventType::AxisChanged(axis, value, _) => {
                    let input_event = InputEvent {
                        r#type: "GamepadAxis".to_string(),
                        code: format!("gamepad{}_axis{}", usize::from(id), axis_to_number(axis)),
                        value,
                        timestamp: timestamp(),
                    };
                    app.emit_all("input-event", &input_event).ok();
                }
                EventType::ButtonPressed(button, _) => {
                    let input_event = InputEvent {
                        r#type: "GamepadButtonDown".to_string(),
                        code: format!("gamepad{}_button{}", usize::from(id), button_to_number(button)),
                        value: 1.0,
                        timestamp: timestamp(),
                    };
                    app.emit_all("input-event", &input_event).ok();
                }
                EventType::ButtonReleased(button, _) => {
                    let input_event = InputEvent {
                        r#type: "GamepadButtonUp".to_string(),
                        code: format!("gamepad{}_button{}", usize::from(id), button_to_number(button)),
                        value: 0.0,
                        timestamp: timestamp(),
                    };
                    app.emit_all("input-event", &input_event).ok();
                }
                EventType::Connected => {
                    println!("Gamepad {} connected", usize::from(id));
                }
                EventType::Disconnected => {
                    println!("Gamepad {} disconnected", usize::from(id));
                }
                _ => {}
            }
        }

        // Sleep to avoid busy loop
        tokio::time::sleep(tokio::time::Duration::from_millis(8)).await;
    }
}

fn find_device_by_capability(capability: &str) -> Result<Device, Box<dyn std::error::Error>> {
    for (_, path) in evdev::enumerate() {
        if let Ok(device) = Device::open(&path) {
            if let Some(name) = device.name() {
                let name_lower = name.to_lowercase();
                if name_lower.contains(capability) {
                    println!("Found {} device: {}", capability, name);
                    return Ok(device);
                }
            }
        }
    }
    Err(format!("No {} device found", capability).into())
}

fn evdev_key_to_dom_code(key: Key) -> String {
    match key {
        Key::KEY_A => "KeyA",
        Key::KEY_B => "KeyB",
        Key::KEY_C => "KeyC",
        Key::KEY_D => "KeyD",
        Key::KEY_E => "KeyE",
        Key::KEY_F => "KeyF",
        Key::KEY_G => "KeyG",
        Key::KEY_H => "KeyH",
        Key::KEY_I => "KeyI",
        Key::KEY_J => "KeyJ",
        Key::KEY_K => "KeyK",
        Key::KEY_L => "KeyL",
        Key::KEY_M => "KeyM",
        Key::KEY_N => "KeyN",
        Key::KEY_O => "KeyO",
        Key::KEY_P => "KeyP",
        Key::KEY_Q => "KeyQ",
        Key::KEY_R => "KeyR",
        Key::KEY_S => "KeyS",
        Key::KEY_T => "KeyT",
        Key::KEY_U => "KeyU",
        Key::KEY_V => "KeyV",
        Key::KEY_W => "KeyW",
        Key::KEY_X => "KeyX",
        Key::KEY_Y => "KeyY",
        Key::KEY_Z => "KeyZ",
        Key::KEY_SPACE => "Space",
        Key::KEY_LEFTSHIFT => "ShiftLeft",
        Key::KEY_RIGHTSHIFT => "ShiftRight",
        Key::KEY_LEFTCTRL => "ControlLeft",
        Key::KEY_RIGHTCTRL => "ControlRight",
        Key::KEY_LEFTALT => "AltLeft",
        Key::KEY_RIGHTALT => "AltRight",
        Key::KEY_ENTER => "Enter",
        Key::KEY_ESC => "Escape",
        Key::KEY_TAB => "Tab",
        Key::KEY_BACKSPACE => "Backspace",
        _ => "Unknown",
    }.to_string()
}

fn axis_to_number(axis: Axis) -> u8 {
    match axis {
        Axis::LeftStickX => 0,
        Axis::LeftStickY => 1,
        Axis::RightStickX => 2,
        Axis::RightStickY => 3,
        Axis::LeftZ => 6,        // Left trigger
        Axis::RightZ => 7,       // Right trigger
        _ => 255,
    }
}

fn button_to_number(button: Button) -> u8 {
    match button {
        Button::South => 0,      // A / Cross
        Button::East => 1,       // B / Circle
        Button::West => 2,       // X / Square
        Button::North => 3,      // Y / Triangle
        Button::LeftTrigger => 4,
        Button::RightTrigger => 5,
        Button::LeftTrigger2 => 6,
        Button::RightTrigger2 => 7,
        Button::Select => 8,
        Button::Start => 9,
        Button::LeftThumb => 10,
        Button::RightThumb => 11,
        Button::DPadUp => 12,
        Button::DPadDown => 13,
        Button::DPadLeft => 14,
        Button::DPadRight => 15,
        _ => 255,
    }
}

fn timestamp() -> u64 {
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap()
        .as_millis() as u64
}
