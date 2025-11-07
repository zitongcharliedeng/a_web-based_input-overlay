# Iced + evdev Input Overlay: Elm Architecture Deep Dive

## Overview

This document explains the **Elm architecture** implementation in the Iced GUI framework, demonstrating how **immutable state management** creates predictable, maintainable applications.

## The Elm Architecture (Model-View-Update)

Elm established three core principles for GUI applications:

```
User Input/Events
       ↓
   Update (pure function)
       ↓
    Model (immutable state)
       ↓
     View (render UI)
       ↓
   Display to user
```

### Three Key Components

#### 1. Model: Immutable State

The **Model** represents the entire application state in a single immutable data structure.

```rust
#[derive(Debug, Clone)]
pub struct Overlay {
    // Key states (true = pressed)
    key_w_pressed: bool,
    key_a_pressed: bool,
    key_s_pressed: bool,
    key_d_pressed: bool,

    // Mouse state
    mouse_x: i32,
    mouse_y: i32,
    mouse_buttons: MouseButtons,

    // Gamepad state
    gamepad_left_stick_x: f32,
    gamepad_left_stick_y: f32,

    // Timing for visual effects
    last_key_press: Option<Instant>,
}
```

**Key insight:** The Model is `Clone` and immutable. We never mutate it directly. Instead, we create new Models with changed values.

#### 2. Message: Events

**Messages** represent all possible events that can occur in the system. They're enums describing *what happened*.

```rust
#[derive(Debug, Clone)]
pub enum Message {
    // Input events from evdev
    InputEvent(InputEvent),

    // Tick for animations
    Tick,
}

pub enum InputEvent {
    KeyPress(String),
    KeyRelease(String),
    MouseMove { x: i32, y: i32 },
    MouseButton { button: String, pressed: bool },
    GamepadAxis { axis: String, value: f32 },
    // ... more events
}
```

**Why Messages?**
- Explicit about what happened (no magic globals)
- Serializable/loggable (for debugging)
- Type-safe (compiler ensures all events handled)
- Decoupled from UI (can test independently)

#### 3. Update: Pure Function

The **Update** function is a pure function: `fn update(model: Model, msg: Message) -> (Model, Command)`.

```rust
impl Application for Overlay {
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
            _ => {}
        }
        Command::none()
    }
}
```

**Why this pattern?**
- **Pure function:** Same input always produces same output
- **Testable:** No hidden side effects
- **Predictable:** Can trace exactly how state changed
- **Time-travel debugging:** Can replay all messages to reconstruct history

#### 4. View: Rendering

The **View** function converts Model to UI (pure rendering).

```rust
impl Application for Overlay {
    fn view(&self) -> Element<Message> {
        let w_style = if self.key_w_pressed {
            "key_pressed"
        } else {
            "key_default"
        };

        let wasd_row = row![
            key_button("W", w_style),
            key_button("A", "key_default"),
            key_button("S", "key_default"),
            key_button("D", "key_default"),
        ]
        .spacing(10);

        let content = column![
            text("Input Overlay - Iced + evdev").size(24),
            wasd_row,
        ]
        .spacing(20)
        .padding(20);

        container(content)
            .width(Length::Fill)
            .height(Length::Fill)
            .center_x()
            .center_y()
            .into()
    }
}
```

**Why this pattern?**
- **Declarative:** Describe what UI should look like
- **Efficient:** Only called when needed (after update)
- **No side effects:** Just produces UI description
- **Composable:** Build complex UIs from simple widgets

## Message Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         Event Sources                            │
├──────────────────────┬──────────────────┬──────────────────────┤
│   Input Listener     │   Subscriptions  │   User Interactions  │
│   (evdev events)     │   (timer ticks)  │   (UI clicks)        │
└──────────────────┬───┴──────────┬───────┴────────────┬──────────┘
                   │              │                    │
                   └──────────────┼────────────────────┘
                                  ↓
                         ┌─────────────────┐
                         │    Message      │
                         │ (event wrapper) │
                         └────────┬────────┘
                                  ↓
                    ┌──────────────────────────┐
                    │   Update Function        │
                    │   (pure, testable)       │
                    │                          │
                    │  fn(Model, Msg) -> Cmd  │
                    └────────────┬─────────────┘
                                  ↓
                    ┌──────────────────────────┐
                    │   New Model              │
                    │   (immutable state)      │
                    └────────────┬─────────────┘
                                  ↓
                    ┌──────────────────────────┐
                    │   View Function          │
                    │   (pure rendering)       │
                    │                          │
                    │  fn(Model) -> Element   │
                    └────────────┬─────────────┘
                                  ↓
                         ┌─────────────────┐
                         │   UI Elements   │
                         │   (description) │
                         └────────┬────────┘
                                  ↓
                         ┌─────────────────┐
                         │   Render to     │
                         │   Screen        │
                         └─────────────────┘
```

## Immutable State Benefits

### 1. Predictability

```rust
// Before update
let model = Overlay {
    key_w_pressed: false,
    mouse_x: 100,
    // ...
};

// After W press message
let model = model.with_w_pressed(true);

// We KNOW model is unchanged - all changes explicit
// Can never have hidden mutations
```

### 2. Time-Travel Debugging

Replay all messages to reconstruct exact state at any point:

```
Initial State: { w_pressed: false, mouse_x: 0 }
  ↓ Message: KeyPress("W")
State: { w_pressed: true, mouse_x: 0 }
  ↓ Message: MouseMove { x: 50 }
State: { w_pressed: true, mouse_x: 50 }
  ↓ Message: KeyRelease("W")
State: { w_pressed: false, mouse_x: 50 }
```

### 3. Easy Undo/Redo

Keep history of all states and messages:

```rust
struct AppWithHistory {
    states: Vec<Overlay>,
    messages: Vec<Message>,
    current_index: usize,
}

impl AppWithHistory {
    fn undo(&mut self) {
        if self.current_index > 0 {
            self.current_index -= 1;
        }
    }

    fn redo(&mut self) {
        if self.current_index < self.states.len() - 1 {
            self.current_index += 1;
        }
    }
}
```

### 4. Fearless Refactoring

Changes to rendering don't affect state logic. Changes to state don't break rendering:

```rust
// Can refactor View without touching Update
// Update logic is independent of UI implementation
// Compiler ensures consistency
```

### 5. Concurrency Safety

Immutable data + pure functions = trivially thread-safe:

```rust
// Safe to send to other threads
let model_clone = model.clone();
std::thread::spawn(move || {
    process_input(&model_clone);  // No race conditions possible
});
```

## evdev Integration with Elm Architecture

The input system feeds events into the Message pipeline:

```
┌────────────────────┐
│  InputListener     │
│  (background task) │
│                    │
│  - Reads evdev     │
│  - Emits InputEvent│
└────────┬───────────┘
         │
         │ Creates Message
         ↓
┌────────────────────┐
│ Message enum       │
│ variant:           │
│ InputEvent(...)    │
└────────┬───────────┘
         │
         │ Sent to Update
         ↓
┌────────────────────┐
│ Update Function    │
│                    │
│ Handles each msg   │
│ Returns Command    │
└────────┬───────────┘
         │
         │ Produces
         ↓
┌────────────────────┐
│ New Model State    │
│                    │
│ key_w_pressed:true │
│ mouse_x: 123       │
└────────┬───────────┘
         │
         │ Sent to View
         ↓
┌────────────────────┐
│ View Function      │
│                    │
│ Renders WASD keys  │
│ Shows mouse pos    │
└────────────────────┘
```

## Comparison: Elm vs Traditional OOP

### Traditional OOP (Problematic)

```rust
impl Overlay {
    fn handle_key_press(&mut self, key: &str) {
        self.key_w_pressed = true;  // Direct mutation
        self.update_display();       // Implicit side effect
        self.save_state();           // Another side effect
    }

    fn handle_mouse_move(&mut self, x: i32, y: i32) {
        self.mouse_x = x;            // Mutation
        self.apply_smoothing();      // Side effect
        self.check_bounds();         // Side effect
    }
}
```

**Problems:**
- Hidden state mutations
- Implicit side effects
- Difficult to test
- Hard to reason about
- Race conditions in async code

### Elm Architecture (Clean)

```rust
impl Application for Overlay {
    fn update(&mut self, message: Message) -> Command<Message> {
        match message {
            Message::InputEvent(InputEvent::KeyPress(key)) => {
                self.key_w_pressed = true;  // Explicit
                Command::none()              // No hidden side effects
            }
            Message::InputEvent(InputEvent::MouseMove { x, y }) => {
                self.mouse_x = x;
                self.mouse_y = y;
                Command::none()
            }
        }
    }
}
```

**Benefits:**
- Explicit state changes
- No hidden side effects
- Testable logic
- Easy to reason about
- Concurrent-safe

## Code Organization

### File Structure

```
src/
├── main.rs           # Application entry, Elm Model/Update/View
└── input.rs          # evdev integration (produces Messages)
```

### Dependency Flow

```
main.rs (Elm Model + Update + View)
   ↑
   │ Produces Events
   │
input.rs (evdev listener)
```

**Note:** input.rs doesn't depend on main.rs. It's a pure event producer.

## Running the Demo

```bash
# Enter NixOS shell with Iced dependencies
nix-shell shell-iced.nix

# Build the project
cargo build --release

# Run the overlay
cargo run --release

# Or use the launcher script
./run-iced.sh
```

## Key Features of This Implementation

1. **Pure Update Function:** State transitions are deterministic
2. **Type-Safe Messages:** Compiler ensures all events handled
3. **Immutable Model:** Clone semantics for safety
4. **Composition:** Build complex UIs from simple primitives
5. **Global Input Capture:** evdev feeds into Message pipeline
6. **Wayland Native:** Layer-shell support for proper overlay behavior

## Advanced Patterns

### Commands: Async Effects

Sometimes Update needs to produce side effects (like playing a sound). Use Commands:

```rust
impl Application for Overlay {
    fn update(&mut self, message: Message) -> Command<Message> {
        match message {
            Message::PlaySound => {
                // Return a command instead of executing directly
                return Command::perform(
                    async { play_sound().await },
                    |_| Message::SoundFinished
                );
            }
        }
        Command::none()
    }
}
```

### Subscriptions: Ongoing Events

For continuous input (like animation ticks), use Subscriptions:

```rust
impl Application for Overlay {
    fn subscription(&self) -> iced::Subscription<Message> {
        use iced::subscription;

        subscription::unfold(
            "input_listener",
            InputListener::new(),
            |mut listener| async move {
                match listener.read_next_event().await {
                    Some(event) => (Message::InputEvent(event), listener),
                    None => (Message::Tick, listener),
                }
            }
        )
    }
}
```

## Conclusion

The Elm architecture provides:
- **Predictable state management** through immutability
- **Testable logic** via pure functions
- **Type safety** through Rust's compiler
- **Scalability** without hidden bugs
- **Developer experience** through clarity

Combined with evdev for global input capture, we get a robust, maintainable input overlay system that works reliably on Wayland.

---

**References:**
- [Elm Architecture](https://guide.elm-lang.org/architecture/)
- [Iced Documentation](https://docs.rs/iced/)
- [evdev Crate](https://docs.rs/evdev/)
