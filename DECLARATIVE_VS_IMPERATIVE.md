# Declarative vs Imperative: Slint vs Traditional UI Frameworks

## Quick Summary

| Aspect | Declarative (Slint) | Imperative (GTK/Iced) |
|--------|-------------------|---------------------|
| **Philosophy** | "What should appear" | "How to make it appear" |
| **Code style** | UI as data structure | UI as procedural steps |
| **State sync** | Automatic | Manual |
| **Re-render** | Dependency tracking | Manual callbacks |
| **Performance** | GPU-optimized | Varies |
| **Learning curve** | Moderate (CSS-like) | Steep (many APIs) |

---

## Example 1: Rendering a Button

### Declarative (Slint)

```slint
export component KeyButton {
    in property <bool> pressed;
    in property <string> label;

    Rectangle {
        width: 60px;
        height: 60px;
        background: pressed ? #00ff00 : #333333;
        border-radius: 8px;
        border-width: 2px;
        border-color: pressed ? #00dd00 : #666666;

        Text {
            text: label;
            font-size: 24px;
            color: pressed ? #000000 : #ffffff;
        }
    }
}

// Usage:
KeyButton { pressed: w-pressed; label: "W"; }
```

**Characteristics:**
- Describes what button LOOKS LIKE
- Declarative syntax (almost CSS)
- Compiler generates rendering code
- Automatic re-evaluation when `pressed` changes
- **6 lines of "actual" code**

### Imperative (GTK)

```rust
fn create_key_button(label: &str) -> gtk::Button {
    let button = gtk::Button::new();
    button.set_label(label);
    button.set_size_request(60, 60);

    // Manual styling
    let css_provider = gtk::CssProvider::new();
    css_provider.load_from_data(
        format!(r#"
            button {{
                background-color: #333333;
                color: #ffffff;
                border-radius: 8px;
                border: 2px solid #666666;
                font-size: 24px;
            }}
            button:active {{
                background-color: #00ff00;
                color: #000000;
                border-color: #00dd00;
            }}
        "#).as_bytes()
    ).unwrap();

    let context = button.style_context();
    context.add_provider(
        &css_provider,
        gtk::STYLE_PROVIDER_PRIORITY_APPLICATION
    );

    // Manual state tracking
    let is_pressed = std::rc::Rc::new(std::cell::RefCell::new(false));
    let is_pressed_clone = is_pressed.clone();

    button.connect_pressed(move |btn| {
        *is_pressed_clone.borrow_mut() = true;
        btn.add_css_class("active");
    });

    button.connect_released(move |btn| {
        *is_pressed.borrow_mut() = false;
        btn.remove_css_class("active");
    });

    button
}
```

**Characteristics:**
- Describes "how to build" button step-by-step
- Mixing CSS and Rust code
- Manual state tracking with RefCell
- Manual event connections
- Manual class toggling
- **30+ lines of boilerplate**

---

## Example 2: Responding to Input State

### Declarative (Slint)

```slint
export component WASDADisplay {
    in property <bool> w-pressed;
    in property <bool> a-pressed;
    in property <bool> s-pressed;
    in property <bool> d-pressed;

    HorizontalLayout {
        spacing: 8px;

        Rectangle {
            background: w-pressed ? #00ff00 : #333333;
            Text { text: "W"; }
        }

        Rectangle {
            background: a-pressed ? #00ff00 : #333333;
            Text { text: "A"; }
        }

        Rectangle {
            background: s-pressed ? #00ff00 : #333333;
            Text { text: "S"; }
        }

        Rectangle {
            background: d-pressed ? #00ff00 : #333333;
            Text { text: "D"; }
        }
    }
}

// From Rust:
ui.set_w_pressed(true);  // UI automatically updates
```

**Key insight:** Slint sees the binding `w-pressed ? #00ff00 : #333333` and tracks it automatically.

When state changes:
1. Property notified: `w_pressed = true`
2. All dependent expressions re-evaluated
3. Only changed pixels re-rendered
4. **No manual callbacks needed**

### Imperative (Iced)

```rust
#[derive(Default)]
pub struct KeyDisplay {
    w_pressed: bool,
    a_pressed: bool,
    s_pressed: bool,
    d_pressed: bool,
}

#[derive(Debug, Clone)]
pub enum Message {
    WPressed,
    WReleased,
    APressed,
    AReleased,
    SPressed,
    SReleased,
    DPressed,
    DReleased,
}

impl Sandbox for KeyDisplay {
    type Message = Message;

    fn update(&mut self, message: Message) {
        match message {
            Message::WPressed => self.w_pressed = true,
            Message::WReleased => self.w_pressed = false,
            Message::APressed => self.a_pressed = true,
            Message::AReleased => self.a_pressed = false,
            Message::SPressed => self.s_pressed = true,
            Message::SReleased => self.s_pressed = false,
            Message::DPressed => self.d_pressed = true,
            Message::DReleased => self.d_pressed = false,
        }
    }

    fn view(&self) -> Element<Message> {
        let w_btn = button(
            text("W").size(20)
        )
        .width(Length::Fixed(60.0))
        .height(Length::Fixed(60.0))
        .style(if self.w_pressed {
            iced::theme::Button::Success
        } else {
            iced::theme::Button::Secondary
        });

        let a_btn = button(text("A")).style(if self.a_pressed {
            iced::theme::Button::Success
        } else {
            iced::theme::Button::Secondary
        });

        let s_btn = button(text("S")).style(if self.s_pressed {
            iced::theme::Button::Success
        } else {
            iced::theme::Button::Secondary
        });

        let d_btn = button(text("D")).style(if self.d_pressed {
            iced::theme::Button::Success
        } else {
            iced::theme::Button::Secondary
        });

        row![w_btn, a_btn, s_btn, d_btn]
            .spacing(8)
            .into()
    }
}
```

**Key differences:**
- Explicit `Message` enum for each state transition
- Manual `match` in `update` function
- UI must be rebuilt each frame in `view()`
- Color selection must be manual for each button
- **50+ lines of boilerplate**

---

## Example 3: Displaying Mouse Position

### Declarative (Slint)

```slint
export component MouseDisplay {
    in property <int> mouse-x;
    in property <int> mouse-y;

    Text {
        text: "Mouse: " + mouse-x + ", " + mouse-y;
        color: #00ff00;
    }
}

// From Rust:
ui.set_mouse_x(100);
ui.set_mouse_y(200);
```

**What happens automatically:**
1. Slint sees string interpolation: `"Mouse: " + mouse-x + ", " + mouse-y`
2. Registers dependency: `mouse-x` and `mouse-y` affect text
3. When either changes, text is recomputed
4. If text differs from rendered, GPU re-renders
5. **No manual invalidation needed**

### Imperative (GTK)

```rust
let label = gtk::Label::new(Some("Mouse: 0, 0"));

// Manual state tracking
let mouse_x = std::rc::Rc::new(std::cell::RefCell::new(0));
let mouse_y = std::rc::Rc::new(std::cell::RefCell::new(0));

// Update function (called from input handler)
fn update_mouse_display(
    label: &gtk::Label,
    x: i32,
    y: i32,
    mouse_x: &Rc<RefCell<i32>>,
    mouse_y: &Rc<RefCell<i32>>,
) {
    *mouse_x.borrow_mut() = x;
    *mouse_y.borrow_mut() = y;
    
    // MUST manually update label
    label.set_text(&format!(
        "Mouse: {}, {}",
        *mouse_x.borrow(),
        *mouse_y.borrow()
    ));
}

// From event handler:
update_mouse_display(&label, 100, 200, &mouse_x, &mouse_y);
```

**Manual steps:**
1. Update state variables manually
2. Call update function
3. Format string manually
4. Call `set_text()` on label
5. **All synchronization manual**

---

## Conceptual Differences

### Declarative: Reactive Programming

```
┌─────────────────────────────────────┐
│  "What should the UI show?"         │
│                                     │
│  background: pressed ? green : gray │
│  text: "Position: " + x + ", " + y  │
│  visible: mouse-in-bounds           │
└──────────────────┬──────────────────┘
                   │
                   ↓
        Dependency Graph (compiler-built)
                   │
       ┌───────────┼───────────┐
       ↓           ↓           ↓
    pressed       x         mouse-in-bounds
       │           │           │
       └───────────┼───────────┘
                   │
         Changes trigger re-evaluation
                   │
                   ↓
         GPU renders new frame
```

**Key property:** Changes propagate automatically through dependency graph.

### Imperative: Callback Programming

```
┌──────────────────────────────────┐
│  "How do I make the UI appear?"  │
│                                  │
│  1. Create button                │
│  2. Set color to gray            │
│  3. Create label                 │
│  4. Set text to "Position..."    │
└──────────────────┬───────────────┘
                   │
                   ↓
         Register Event Listeners
                   │
         ┌─────────┼─────────┐
         ↓         ↓         ↓
     onPressed onMouseMove onFocus
         │         │         │
         └─────────┼─────────┘
                   │
         Manual callback code
                   │
         ┌─────────┼─────────┐
         ↓         ↓         ↓
     setColor   setText  setVisible
         │         │         │
         └─────────┼─────────┘
                   │
                   ↓
         GPU renders new frame
```

**Key difference:** Each state change requires explicit callback code.

---

## Performance Implications

### Declarative (Slint)

**Compilation phase:**
- Analyzes all bindings
- Builds dependency graph
- Generates optimal native code
- **Smart caching: only re-render changed parts**

**Runtime:**
- Property changed → Check dependents
- Re-evaluate only affected expressions
- Batch GPU updates
- Result: 60fps at minimal CPU cost

### Imperative (GTK/Iced)

**Compilation phase:**
- No analysis possible
- Generates generic widget code
- No optimization

**Runtime:**
- Event triggers callback
- Programmer manually updates UI
- Full re-render possible
- Result: Depends on programmer's optimization skills

**Benchmark (hypothetical):**
- Slint: 60fps, 2% CPU updating 100 keys
- GTK: 60fps, 15% CPU (rebuilding entire tree each frame)
- Iced: 60fps, 10% CPU (better, but still more than Slint)

---

## When to Use Each

### Use Declarative (Slint)

✅ Overlays and HUDs (input visualization, FPS counters)  
✅ Dashboards with many real-time updates  
✅ Graphics-heavy UI (Canvas, animations)  
✅ Resource-constrained systems  
✅ Prototyping (quick iteration)  
✅ Minimal dependencies desired  

### Use Imperative (GTK, Iced, Qt)

✅ Complex workflows (Blender, GIMP)  
✅ Highly dynamic UI (draggable windows, docking)  
✅ Accessibility requirements (built-in features)  
✅ Extensive widget library needed  
✅ Existing GTK ecosystem integration  
✅ Native look-and-feel needed  

---

## Code Metrics

| Metric | Declarative | Imperative |
|--------|------------|-----------|
| **Code to render 4 keys** | 10 lines | 30+ lines |
| **Lines per state variable** | 0.5 | 2-3 |
| **Boilerplate** | None | 50% of code |
| **Dependency tracking** | Automatic | Manual |
| **Render optimization** | Compiler | Programmer |
| **Learning curve** | Moderate | Steep |

---

## Conclusion

**Declarative (Slint) excels at:**
- Responsive, real-time UIs
- Input visualization (perfect for overlays)
- Minimal code footprint
- Automatic optimization

**Imperative (GTK/Iced) excels at:**
- Complex, stateful applications
- Native platform integration
- Maximum flexibility
- Rich widget library

**For this input overlay project:** Declarative is the clear winner.
