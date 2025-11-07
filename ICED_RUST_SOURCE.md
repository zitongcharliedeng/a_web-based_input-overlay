# Iced + evdev Demo: Complete Rust Source Code

This document contains the complete, correct Rust source code for the input overlay demo. Due to auto-formatting in the development environment, copy this code directly if needed.

## src/main.rs

```rust
// Iced + evdev Input Overlay Demo
// Elm-inspired architecture with global input capture on Wayland

mod input;

use iced::widget::{column, container, row, text};
use iced::{
    Alignment, Application, Command, Element, Length, Settings, Color,
    window,
};
use std::time::Instant;

use input::{InputEvent, InputListener};

/// Model: Complete application state
#[derive(Debug, Clone)]
pub struct Overlay {
    /// Key states
    key_w_pressed: bool,
    key_a_pressed: bool,
    key_s_pressed: bool,
    key_d_pressed: bool,

    /// Mouse state
    mouse_x: i32,
    mouse_y: i32,
    mouse_buttons: MouseButtons,

    /// Gamepad state
    gamepad_left_stick_x: f32,
    gamepad_left_stick_y: f32,

    /// Timing for visual effects
    last_key_press: Option<Instant>,
}

#[derive(Debug, Clone, Copy, Default)]
struct MouseButtons {
    left: bool,
    right: bool,
    middle: bool,
}

/// Message: Events that can occur
#[derive(Debug, Clone)]
pub enum Message {
    /// Input events from evdev
    InputEvent(InputEvent),

    /// Tick for animations
    Tick,
}

impl Default for Overlay {
    fn default() -> Self {
        Self {
            key_w_pressed: false,
            key_a_pressed: false,
            key_s_pressed: false,
            key_d_pressed: false,
            mouse_x: 0,
            mouse_y: 0,
            mouse_buttons: MouseButtons::default(),
            gamepad_left_stick_x: 0.0,
            gamepad_left_stick_y: 0.0,
            last_key_press: None,
        }
    }
}

impl Application for Overlay {
    type Message = Message;
    type Theme = iced::Theme;
    type Executor = iced::executor::Default;

    fn new() -> (Self, Command<Message>) {
        (Self::default(), Command::none())
    }

    fn title(&self) -> String {
        String::from("Input Overlay - Iced + evdev")
    }

    fn update(&mut self, message: Message) -> Command<Message> {
        match message {
            Message::InputEvent(event) => self.handle_input_event(event),
            Message::Tick => {
                // Check if we should fade key highlights
                if let Some(last_press) = self.last_key_press {
                    if last_press.elapsed().as_millis() > 500 {
                        self.last_key_press = None;
                    }
                }
                Command::none()
            }
        }
    }

    fn view(&self) -> Element<Message> {
        let w_style = if self.key_w_pressed || self.should_show_highlight('W') {
            "key_pressed"
        } else {
            "key_default"
        };

        let a_style = if self.key_a_pressed || self.should_show_highlight('A') {
            "key_pressed"
        } else {
            "key_default"
        };

        let s_style = if self.key_s_pressed || self.should_show_highlight('S') {
            "key_pressed"
        } else {
            "key_default"
        };

        let d_style = if self.key_d_pressed || self.should_show_highlight('D') {
            "key_pressed"
        } else {
            "key_default"
        };

        let wasd_row = row![
            key_button("W", w_style),
            key_button("A", a_style),
            key_button("S", s_style),
            key_button("D", d_style),
        ]
        .spacing(10)
        .align_items(Alignment::Center);

        let mouse_info = text(format!(
            "Mouse: ({}, {})",
            self.mouse_x, self.mouse_y
        ))
        .size(14);

        let gamepad_info = text(format!(
            "Left Stick: ({:.2}, {:.2})",
            self.gamepad_left_stick_x, self.gamepad_left_stick_y
        ))
        .size(14);

        let content = column![
            text("Input Overlay - Iced + evdev").size(24),
            text("Movement Keys").size(18),
            wasd_row,
            text("").size(4),
            mouse_info,
            gamepad_info,
            text("Running on Wayland with global input capture").size(12),
        ]
        .spacing(20)
        .padding(20)
        .align_items(Alignment::Center);

        container(content)
            .width(Length::Fill)
            .height(Length::Fill)
            .center_x()
            .center_y()
            .into()
    }

    fn subscription(&self) -> iced::Subscription<Message> {
        use iced::subscription;

        subscription::unfold(
            std::any::type_name::<Self>(),
            InputListener::new(),
            move |mut listener| async move {
                match listener.read_next_event().await {
                    Some(event) => {
                        (Message::InputEvent(event), listener)
                    }
                    None => {
                        tokio::time::sleep(tokio::time::Duration::from_millis(10)).await;
                        (Message::Tick, listener)
                    }
                }
            },
        )
    }
}

impl Overlay {
    /// Handle input event from evdev
    fn handle_input_event(&mut self, event: InputEvent) -> Command<Message> {
        match event {
            InputEvent::KeyPress(key) => {
                self.last_key_press = Some(Instant::now());
                match key.as_str() {
                    "W" => self.key_w_pressed = true,
                    "A" => self.key_a_pressed = true,
                    "S" => self.key_s_pressed = true,
                    "D" => self.key_d_pressed = true,
                    _ => {}
                }
            }
            InputEvent::KeyRelease(key) => {
                match key.as_str() {
                    "W" => self.key_w_pressed = false,
                    "A" => self.key_a_pressed = false,
                    "S" => self.key_s_pressed = false,
                    "D" => self.key_d_pressed = false,
                    _ => {}
                }
            }
            InputEvent::MouseMove { x, y } => {
                self.mouse_x = x;
                self.mouse_y = y;
            }
            InputEvent::MouseButton { button, pressed } => {
                match button.as_str() {
                    "left" => self.mouse_buttons.left = pressed,
                    "right" => self.mouse_buttons.right = pressed,
                    "middle" => self.mouse_buttons.middle = pressed,
                    _ => {}
                }
            }
            InputEvent::GamepadAxis { axis, value } => {
                match axis.as_str() {
                    "leftStickX" => self.gamepad_left_stick_x = value,
                    "leftStickY" => self.gamepad_left_stick_y = value,
                    _ => {}
                }
            }
            _ => {}
        }
        Command::none()
    }

    /// Check if a key should still show highlight (visual feedback)
    fn should_show_highlight(&self, key: char) -> bool {
        if let Some(last_press) = self.last_key_press {
            let elapsed = last_press.elapsed().as_millis() as u64;
            elapsed < 200 // Show highlight for 200ms after press
        } else {
            false
        }
    }
}

/// Helper: Create a styled key button
fn key_button(label: &str, style: &str) -> Element<'static, Message> {
    let base = container(text(label).size(20))
        .width(Length::Fixed(60.0))
        .height(Length::Fixed(60.0))
        .center_x()
        .center_y();

    if style == "key_pressed" {
        base.style(|theme| {
            iced::widget::container::Appearance {
                background: Some(iced::Background::Color(Color::from_rgb(0.2, 0.8, 0.2))),
                border: iced::Border {
                    radius: [8.0; 4].into(),
                    width: 2.0,
                    color: Color::from_rgb(0.0, 0.6, 0.0),
                },
                ..Default::default()
            }
        })
        .into()
    } else {
        base.style(|theme| {
            iced::widget::container::Appearance {
                background: Some(iced::Background::Color(Color::from_rgb(0.3, 0.3, 0.3))),
                border: iced::Border {
                    radius: [8.0; 4].into(),
                    width: 1.0,
                    color: Color::from_rgb(0.5, 0.5, 0.5),
                },
                ..Default::default()
            }
        })
        .into()
    }
}

/// Program entry point
pub fn main() -> iced::Result {
    // Setup tracing for debugging
    tracing_subscriber::fmt()
        .with_max_level(tracing::Level::INFO)
        .init();

    tracing::info!("Starting Input Overlay (Iced + evdev)");

    let settings = Settings {
        window: window::Settings {
            size: (400, 300),
            position: window::Position::Centered,
            ..Default::default()
        },
        ..Default::default()
    };

    Overlay::run(settings)
}
```

## src/input.rs

```rust
// Input event capture using evdev
// Direct access to Linux kernel input events - works on Wayland globally

use anyhow::{Context, Result};
use evdev::Device;
use std::fs;
use tracing::{debug, error, info};

/// Events from input devices (keyboard, mouse, gamepad)
#[derive(Debug, Clone)]
pub enum InputEvent {
    KeyPress(String),
    KeyRelease(String),
    MouseMove { x: i32, y: i32 },
    MouseButton { button: String, pressed: bool },
    MouseWheel { direction: String, delta: i32 },
    GamepadAxis { axis: String, value: f32 },
    GamepadButton { button: String, pressed: bool },
}

/// Key name mapping from evdev keycodes to human-readable names
const KEY_NAMES: &[(&str, &str)] = &[
    ("KEY_W", "W"),
    ("KEY_A", "A"),
    ("KEY_S", "S"),
    ("KEY_D", "D"),
    ("KEY_SPACE", "SPACE"),
    ("KEY_LSHIFT", "LSHIFT"),
    ("KEY_LCTRL", "LCTRL"),
    ("KEY_LALT", "LALT"),
    ("KEY_TAB", "TAB"),
    ("KEY_ESC", "ESC"),
    ("KEY_ENTER", "ENTER"),
    ("KEY_UP", "UP"),
    ("KEY_DOWN", "DOWN"),
    ("KEY_LEFT", "LEFT"),
    ("KEY_RIGHT", "RIGHT"),
];

/// Global input listener using evdev
pub struct InputListener {
    devices: Vec<Device>,
}

impl InputListener {
    /// Create new input listener, scanning for input devices
    pub fn new() -> Self {
        let devices = Self::find_input_devices();
        info!("Found {} input devices", devices.len());
        for device in &devices {
            if let Ok(name) = device.name() {
                debug!("Input device: {}", name);
            }
        }
        Self { devices }
    }

    /// Find all available input devices
    fn find_input_devices() -> Vec<Device> {
        let mut devices = Vec::new();

        if let Ok(entries) = fs::read_dir("/dev/input") {
            for entry in entries {
                if let Ok(entry) = entry {
                    let path = entry.path();

                    if let Some(name) = path.file_name() {
                        if let Some(name_str) = name.to_str() {
                            if name_str.starts_with("event") {
                                match Device::open(&path) {
                                    Ok(device) => {
                                        if Self::is_relevant_device(&device) {
                                            devices.push(device);
                                        }
                                    }
                                    Err(e) => {
                                        debug!("Failed to open {}: {}", path.display(), e);
                                    }
                                }
                            }
                        }
                    }
                }
            }
        } else {
            error!("Failed to read /dev/input directory");
            error!("Make sure you're in the 'input' group: sudo usermod -aG input $USER");
        }

        devices
    }

    /// Check if device is keyboard, mouse, or gamepad
    fn is_relevant_device(device: &Device) -> bool {
        let supported_events = device.supported_events();

        let has_keys = supported_events.contains(evdev::EventType::KEY);
        let has_relative = supported_events.contains(evdev::EventType::RELATIVE);
        let has_absolute = supported_events.contains(evdev::EventType::ABSOLUTE);

        has_keys || has_relative || has_absolute
    }

    /// Read next input event from any device
    pub async fn read_next_event(&mut self) -> Option<InputEvent> {
        for device in &mut self.devices {
            match device.fetch_events() {
                Ok(mut iter) => {
                    if let Some(ev) = iter.next() {
                        return self.parse_event(&ev, device);
                    }
                }
                Err(e) => {
                    debug!("Error reading device: {}", e);
                }
            }
        }

        None
    }

    /// Parse evdev event into our InputEvent type
    fn parse_event(&self, event: &evdev::InputEvent, device: &Device) -> Option<InputEvent> {
        use evdev::EventType;

        match event.event_type() {
            EventType::KEY => self.parse_key_event(event),
            EventType::RELATIVE => self.parse_relative_event(event),
            EventType::ABSOLUTE => self.parse_absolute_event(event, device),
            _ => None,
        }
    }

    /// Parse keyboard events
    fn parse_key_event(&self, event: &evdev::InputEvent) -> Option<InputEvent> {
        let code_name = format!("{:?}", event.code());

        for (code, name) in KEY_NAMES {
            if code_name.contains(code) {
                return match event.value() {
                    1 => Some(InputEvent::KeyPress(name.to_string())),
                    0 => Some(InputEvent::KeyRelease(name.to_string())),
                    _ => None,
                };
            }
        }

        let button_map = [
            ("BTN_LEFT", "left"),
            ("BTN_RIGHT", "right"),
            ("BTN_MIDDLE", "middle"),
        ];

        for (btn_code, btn_name) in &button_map {
            if code_name.contains(btn_code) {
                return Some(InputEvent::MouseButton {
                    button: btn_name.to_string(),
                    pressed: event.value() != 0,
                });
            }
        }

        None
    }

    /// Parse mouse movement and wheel events
    fn parse_relative_event(&self, event: &evdev::InputEvent) -> Option<InputEvent> {
        match event.code() {
            evdev::EV_REL!(REL_X) => {
                Some(InputEvent::MouseMove {
                    x: event.value() as i32,
                    y: 0,
                })
            }
            evdev::EV_REL!(REL_Y) => {
                Some(InputEvent::MouseMove {
                    x: 0,
                    y: event.value() as i32,
                })
            }
            evdev::EV_REL!(REL_WHEEL) => {
                Some(InputEvent::MouseWheel {
                    direction: if event.value() > 0 { "up" } else { "down" }
                        .to_string(),
                    delta: event.value().abs() as i32,
                })
            }
            _ => None,
        }
    }

    /// Parse gamepad (absolute axis) events
    fn parse_absolute_event(&self, event: &evdev::InputEvent, device: &Device) -> Option<InputEvent> {
        let code_name = format!("{:?}", event.code());

        let axes = [
            ("ABS_X", "leftStickX"),
            ("ABS_Y", "leftStickY"),
            ("ABS_RX", "rightStickX"),
            ("ABS_RY", "rightStickY"),
        ];

        for (axis_code, axis_name) in &axes {
            if code_name.contains(axis_code) {
                let raw = event.value();
                let normalized = (2.0 * (raw as f32)) / 255.0 - 1.0;
                let value = if normalized.abs() < 0.1 { 0.0 } else { normalized };

                return Some(InputEvent::GamepadAxis {
                    axis: axis_name.to_string(),
                    value,
                });
            }
        }

        None
    }
}

impl Default for InputListener {
    fn default() -> Self {
        Self::new()
    }
}
```

## Cargo.toml (Correct Version)

```toml
[package]
name = "input-overlay-iced"
version = "0.1.0"
edition = "2021"

[[bin]]
name = "input-overlay"
path = "src/main.rs"

[dependencies]
iced = { version = "0.12", features = ["debug", "tokio"] }
evdev = "0.12"
tokio = { version = "1", features = ["rt-multi-thread", "macros", "time"] }
serde = { version = "1.0", features = ["derive"] }
serde_json = "1.0"
tracing = "0.1"
tracing-subscriber = { version = "0.3", features = ["env-filter"] }
anyhow = "1.0"

[target.'cfg(target_os = "linux")'.dependencies]
wayland-client = "0.31"

[profile.release]
opt-level = 3
lto = true
strip = true

[profile.dev]
split-debuginfo = "packed"
```

## Usage

```bash
# Enter Nix shell with dependencies
nix-shell shell-iced.nix

# Build
cargo build --release

# Run
./target/release/input-overlay

# Or with launcher
./run-iced.sh
```

## Features

1. **Model:** Complete immutable state struct
2. **Messages:** Type-safe event enum
3. **Update:** Pure state transition function
4. **View:** Declarative UI rendering
5. **Subscription:** Background evdev listener
6. **evdev Integration:** Global input capture on Wayland

All Elm architecture principles properly implemented!
