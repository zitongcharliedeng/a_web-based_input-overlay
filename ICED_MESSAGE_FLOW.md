# Iced Input Overlay: Message Flow & Architecture

## Complete Message Flow Diagram

This diagram shows how input events flow through the entire system from raw kernel events to rendered UI.

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
                         HARDWARE LAYER
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    User presses 'W' key
           │
           ↓
    Physical keyboard device
           │
           ↓
    Linux kernel event driver
           │
           ↓
    /dev/input/event* (raw evdev events)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
                    INPUT LISTENER (RUST THREAD)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    ┌─────────────────────────────────────┐
    │   InputListener (background task)   │
    │                                     │
    │  1. Open /dev/input/event*          │
    │  2. Read raw evdev structure        │
    │  3. Parse event type & code         │
    │  4. Map to InputEvent enum          │
    └────────────┬────────────────────────┘
                 │
    Parses binary evdev event:
    - event_type: EV_KEY (type 1)
    - code: KEY_W (17)
    - value: 1 (pressed)
                 │
                 ↓
    ┌─────────────────────────────────────┐
    │  InputEvent::KeyPress("W")          │
    │                                     │
    │  pub enum InputEvent {              │
    │    KeyPress(String),                │
    │    KeyRelease(String),              │
    │    MouseMove { x, y },              │
    │    // ... more variants             │
    │  }                                  │
    └────────────┬────────────────────────┘

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
                      MESSAGE WRAPPER LAYER
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    InputEvent wraps in Message:
                 │
                 ↓
    ┌─────────────────────────────────────┐
    │  Message::InputEvent(InputEvent)    │
    │                                     │
    │  pub enum Message {                 │
    │    InputEvent(InputEvent),          │
    │    Tick,                            │
    │  }                                  │
    │                                     │
    │  (Type-safe, extensible)            │
    └────────────┬────────────────────────┘

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
                    ELM UPDATE FUNCTION (pure)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    Iced framework calls:
    app.update(Message)
                 │
                 ↓
    ┌──────────────────────────────────────────┐
    │  fn update(&mut self, message: Message)  │
    │           -> Command<Message>            │
    │                                          │
    │  Current state:                          │
    │  {                                       │
    │    key_w_pressed: false,  ← OLD STATE   │
    │    mouse_x: 100,                        │
    │    ...                                   │
    │  }                                       │
    └──────────────┬───────────────────────────┘
                   │
         Pattern match on Message:
                   │
    ┌──────────────┴──────────────┐
    │                             │
    ↓                             ↓
Message::InputEvent           Message::Tick
    │                             │
    ↓                             ↓
Handle specific event         Check timers
    │                             │
    ↓                             ↓
match event {                  if last_key_press
  KeyPress("W") =>               .elapsed() > 500ms
    self.key_w_pressed = true;    self.last_key_press
                                    = None;
  ...
}
    │
    └──────────────┬───────────────────────────┐
                   │                           │
                   ↓                           ↓
            New Model State            Command::none()
            {
              key_w_pressed: true,  ← NEW STATE
              mouse_x: 100,           (CHANGED)
              ...
            }

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
                    ELM VIEW FUNCTION (pure)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    Iced framework calls:
    app.view()
      │
      ↓
    ┌────────────────────────────────────────┐
    │  fn view(&self) -> Element<Message>    │
    │                                        │
    │  Read MODEL state:                     │
    │  if self.key_w_pressed { ... }         │
    │     ↓                                  │
    │     Display green W key                │
    │  else { ... }                          │
    │     ↓                                  │
    │     Display gray W key                 │
    └────────────┬─────────────────────────┘
                 │
    Builds UI tree declaratively:
                 │
                 ↓
    ┌────────────────────────────────────┐
    │  Container [                       │
    │    Column [                        │
    │      Text "Input Overlay",         │
    │      Row [                         │
    │        Button "W" (green),  ← DEPENDS ON STATE
    │        Button "A" (gray),         │
    │        Button "S" (gray),         │
    │        Button "D" (gray),         │
    │      ],                           │
    │      Text "Mouse: (100, 50)",     │
    │    ]                              │
    │  ]                                │
    └────────────┬────────────────────┘
                 │
    Converts to UI description:
                 │
                 ↓
    ┌────────────────────────────────┐
    │  Element<Message> {            │
    │    type: Container,            │
    │    children: [Row, ...],        │
    │    style: {...},               │
    │    bounds: (400, 300),         │
    │  }                             │
    └────────────┬────────────────────┘

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
                      GPU RENDERING LAYER
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    Iced renderer:
    (converts Element tree to GPU commands)
                 │
                 ↓
    ┌────────────────────────────────────┐
    │  Tessellate geometry               │
    │  - W button: rect(60x60, green)    │
    │  - A button: rect(60x60, gray)     │
    │  - Text: "Input Overlay" (large)   │
    │  - Text: "Mouse: (100, 50)" (small)│
    └────────────┬────────────────────────┘
                 │
                 ↓
    ┌────────────────────────────────────┐
    │  GPU rasterization                 │
    │  (hardware-accelerated)            │
    └────────────┬────────────────────────┘
                 │
                 ↓
    ┌────────────────────────────────────┐
    │  Screen framebuffer                │
    │  ┌────────────────────────────────┐│
    │  │                                  ││
    │  │  Input Overlay - Iced + evdev  ││
    │  │  Movement Keys                  ││
    │  │                                  ││
    │  │  [W]  [A]  [S]  [D]            ││  ← W is GREEN (pressed)
    │  │                                  ││
    │  │  Mouse: (100, 50)               ││
    │  │  Left Stick: (0.00, 0.00)       ││
    │  │                                  ││
    │  └────────────────────────────────┘│
    └────────────┬────────────────────────┘
                 │
                 ↓
         Visual displayed to user!

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
                      LOOP: BACK TO START
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    User releases 'W' key
           │
           ↓
    Cycle repeats:
    InputListener → InputEvent → Message → Update → View → Render
```

## State Transition Example

### Scenario: User presses W, moves mouse, then releases W

#### Initial State
```rust
Overlay {
    key_w_pressed: false,
    mouse_x: 100,
    mouse_y: 50,
    last_key_press: None,
}
```

#### Event 1: KeyPress("W")
```
Message: InputEvent(KeyPress("W"))
           ↓
Update function:
  self.key_w_pressed = true;
  self.last_key_press = Some(Instant::now());
           ↓
New State:
Overlay {
    key_w_pressed: true,      ← CHANGED
    mouse_x: 100,
    mouse_y: 50,
    last_key_press: Some(123ms),  ← CHANGED
}
           ↓
View renders W button GREEN (because key_w_pressed == true)
```

#### Event 2: MouseMove { x: 150, y: 75 }
```
Message: InputEvent(MouseMove { x: 150, y: 75 })
           ↓
Update function:
  self.mouse_x = 150;
  self.mouse_y = 75;
           ↓
New State:
Overlay {
    key_w_pressed: true,
    mouse_x: 150,         ← CHANGED
    mouse_y: 75,          ← CHANGED
    last_key_press: Some(123ms),
}
           ↓
View updates Mouse position text
```

#### Event 3: KeyRelease("W")
```
Message: InputEvent(KeyRelease("W"))
           ↓
Update function:
  self.key_w_pressed = false;
           ↓
New State:
Overlay {
    key_w_pressed: false,    ← CHANGED
    mouse_x: 150,
    mouse_y: 75,
    last_key_press: Some(123ms),
}
           ↓
View renders W button GRAY (because key_w_pressed == false)
```

## Why This Architecture is Powerful

### 1. Debuggability

You can log every message and reconstruct the entire application state history:

```
Message 1: InputEvent(KeyPress("W"))      → State 1
Message 2: InputEvent(MouseMove{150,75})  → State 2
Message 3: InputEvent(KeyRelease("W"))    → State 3
```

Replay in any order to test edge cases.

### 2. Testability

Test the Update function independently:

```rust
#[test]
fn test_w_press() {
    let mut model = Overlay::default();
    assert_eq!(model.key_w_pressed, false);

    let _cmd = model.handle_input_event(
        InputEvent::KeyPress("W".to_string())
    );

    assert_eq!(model.key_w_pressed, true);
}
```

No mocking needed. Pure functions.

### 3. Predictability

- Same Model + same Message = always same output
- No hidden state mutations
- No race conditions
- Deterministic behavior

### 4. Performance

- Only View called when Update produces change
- Only affected UI elements re-rendered
- GPU-accelerated rendering
- Efficient event batching

### 5. Extensibility

Add new input type? Easy:

```rust
// Add new variant to InputEvent enum
pub enum InputEvent {
    // ... existing variants
    JoystickButton { button: String, pressed: bool },
}

// Update function handles it
fn handle_input_event(&mut self, event: InputEvent) {
    match event {
        InputEvent::JoystickButton { button, pressed } => {
            // Handle joystick button
        }
        // ... other variants
    }
}

// View updates automatically
```

No threading through props. No callback hell. Just add the variant and handle it.

## Integration Points

### Where evdev Feeds In

```
Background Thread:
  InputListener (in input.rs)
    ↓ (reads /dev/input/event*)
  produces InputEvent
    ↓ (wrapped in Message)
  Iced Subscription
    ↓ (async, non-blocking)
  Application Update (main thread)
    ↓ (pure state transition)
  Application View (main thread)
    ↓ (renders)
  Screen
```

### Subscription Implementation

```rust
fn subscription(&self) -> iced::Subscription<Message> {
    subscription::unfold(
        "input_listener",
        InputListener::new(),  // Create listener
        move |mut listener| async move {
            match listener.read_next_event().await {
                Some(event) => {
                    // Wrap in Message
                    (Message::InputEvent(event), listener)
                }
                None => {
                    // Keep trying
                    (Message::Tick, listener)
                }
            }
        }
    )
}
```

This seamlessly integrates async evdev reading into the Elm Update loop.

## Time-Travel Debugging Capability

Because state is immutable and all changes are explicit:

```
Time    Message                              State
─────────────────────────────────────────────────────────
0       Initial                              {w: false, x: 0}
1       InputEvent(KeyPress("W"))            {w: true, x: 0}
2       InputEvent(MouseMove{50, 0})         {w: true, x: 50}
3       InputEvent(KeyRelease("W"))          {w: false, x: 50}
4       InputEvent(KeyPress("A"))            {w: false, x: 50, a: true}
5       InputEvent(MouseMove{75, 25})        {w: false, x: 75, y: 25, a: true}

You can:
- Jump to any point in time
- Inspect state at that moment
- Replay from there forward
- Test "what if I pressed S instead of A at step 4?"
```

Invaluable for debugging complex interactions.

---

## Summary

The Iced + evdev architecture provides:

1. **Pure Update:** Testable state transitions
2. **Immutable Model:** Thread-safe, debuggable state
3. **Type-Safe Messages:** No silent failures
4. **Declarative View:** UI always matches state
5. **Global Input:** evdev feeds seamlessly via subscriptions
6. **Wayland Native:** Layer-shell for proper overlay behavior

This is production-ready architecture for an input visualization overlay!
