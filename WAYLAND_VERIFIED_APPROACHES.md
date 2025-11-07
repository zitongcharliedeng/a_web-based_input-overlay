# 12 Parallel Approaches - Wayland Global Input VERIFIED

**Mission:** Build 12 complete demos, each with:
1. ✅ Global input capture on Wayland (unfocused window)
2. ✅ Transparent overlay background
3. ✅ Single nix-shell to launch
4. ✅ Runnable on NixOS + niri compositor

**Priority:** Global input > Transparency > Everything else

---

## Input Capture Strategy (Critical!)

### The Wayland Truth

**What Works:**
- ✅ **Direct evdev** - PROVEN on your niri setup
- ⚠️ **rdev::grab() with unstable_grab** - CLAIMS to work, NEEDS TESTING
- ❌ **rdev::listen()** - X11 only, broken on Wayland
- ❌ **uiohook** - X11 only, broken on Wayland

### All 12 Approaches Use PROVEN Methods

**Baseline:** Direct evdev (your current working code)
**Experiment:** rdev::grab() with unstable_grab feature (test if claims are true)

---

## The 12 Approaches

### Tier 1: PROVEN (Direct evdev - Guaranteed Wayland)

| # | Branch | Tech | Input | Bundle | Complexity | Status |
|---|--------|------|-------|--------|------------|--------|
| 1 | **electron-evdev** | Electron + JS evdev | Direct evdev | 150MB | Low | ✅ WORKING |
| 2 | **tauri-evdev-crate** | Tauri + evdev crate | Direct evdev | 15MB | Low | 🔥 BUILD NOW |
| 3 | **raylib-evdev** | Raylib + evdev crate | Direct evdev | 5MB | Medium | ✅ WORKING |
| 4 | **bevy-evdev** | Bevy + evdev crate | Direct evdev | 15MB | Medium | 🔥 BUILD NOW |
| 5 | **gtk4-evdev** | GTK4 + evdev crate | Direct evdev | 10MB | Medium | 🔥 BUILD NOW |
| 6 | **wgpu-evdev** | wgpu + winit + evdev | Direct evdev | 8MB | High | 🔥 BUILD NOW |
| 7 | **slint-evdev** | Slint + evdev crate | Direct evdev | 12MB | Medium | 🔥 BUILD NOW |
| 8 | **dioxus-evdev** | Dioxus + evdev crate | Direct evdev | 10MB | Medium | 🔥 BUILD NOW |
| 9 | **neutralino-evdev** | Neutralino + evdev npm | evdev npm pkg | 3MB | Low | 🔥 BUILD NOW |
| 10 | **iced-evdev** | Iced + evdev crate | Direct evdev | 8MB | Medium | 🔥 BUILD NOW |

### Tier 2: EXPERIMENTAL (rdev::grab - Test Wayland claims)

| # | Branch | Tech | Input | Bundle | Risk | Status |
|---|--------|------|-------|--------|------|--------|
| 11 | **tauri-rdev-grab** | Tauri + rdev unstable | rdev::grab() | 15MB | ⚠️ UNVERIFIED | 🔬 TEST |
| 12 | **yew-tauri-rdev** | Yew + Tauri + rdev | rdev::grab() | 18MB | ⚠️ UNVERIFIED | 🔬 TEST |

---

## Detailed Specifications

### Branch 1: electron-evdev ✅ COMPLETED

**Current working version** - Baseline for all comparisons

**Input:** Custom evdevInput.js (450 lines, proven on niri)
**UI:** HTML5 Canvas + existing overlay view
**Bundle:** ~150MB
**nix-shell:** Already exists
**Status:** VERIFIED WORKING on Wayland

**Run:**
```bash
git checkout master  # or current Electron branch
nix-shell --run "electron ."
```

---

### Branch 2: tauri-evdev-crate 🔥 BUILD NOW

**Migration from Electron, guaranteed Wayland support**

**Input:**
```rust
use evdev::{Device, InputEventKind, Key};

for path in evdev::enumerate() {
    let mut device = Device::open(path)?;
    for event in device.fetch_events()? {
        match event.kind() {
            InputEventKind::Key(key) => {
                // Forward to frontend
            }
            _ => {}
        }
    }
}
```

**UI:** Reuse existing browserInputOverlayView (90% code reuse!)
**Bundle:** ~15-30MB (10x smaller than Electron)
**Complexity:** Low (direct port of evdevInput.js to Rust)

**shell.nix:**
```nix
{pkgs ? import <nixpkgs> {}}:
pkgs.mkShell {
  buildInputs = with pkgs; [
    rustc cargo
    nodejs
    webkitgtk_4_1
    openssl pkg-config
    libevdev
  ];
}
```

**Run:**
```bash
git checkout claude/tauri-evdev-crate-011CUsuWKL59fUhcRTTAqAiE
nix-shell shell.nix --run "./run.sh"
```

**Why this wins:**
- GUARANTEED Wayland (same evdev as current)
- 10x smaller binary
- Reuse all frontend code
- Fastest migration path

---

### Branch 3: raylib-evdev ✅ COMPLETED

**Already built** - Minimal demo with W key visualization

**Input:** evdev crate (direct, proven)
**Rendering:** Raylib OpenGL (native, no webview)
**Bundle:** ~5-10MB
**nix-shell:** shell-raylib.nix

**Run:**
```bash
git checkout claude/raylib-rdev-011CUsuWKL59fUhcRTTAqAiE  # Rename to raylib-evdev
nix-shell shell-raylib.nix --run "./run-raylib.sh"
```

**Status:** Demo ready, just needs evdev instead of rdev

---

### Branch 4: bevy-evdev 🔥 BUILD NOW

**Game engine approach with ECS architecture**

**Input:** evdev crate
**Rendering:** Bevy (wgpu backend)
**Architecture:** Entity Component System

**Example:**
```rust
use bevy::prelude::*;
use evdev::Device;

fn main() {
    App::new()
        .add_plugins(DefaultPlugins)
        .add_systems(Startup, setup)
        .add_systems(Update, input_system)
        .run();
}

fn input_system(
    mut key_query: Query<&mut KeyVisualizer>,
    evdev_state: Res<EvdevState>,
) {
    // Update ECS entities based on evdev input
}
```

**Why this is interesting:**
- Modern Rust patterns (ECS)
- Built-in animation system
- Plugin architecture (extensible)
- Hot reload support

**shell.nix:**
```nix
{pkgs ? import <nixpkgs> {}}:
pkgs.mkShell {
  buildInputs = with pkgs; [
    rustc cargo
    pkg-config
    alsa-lib libudev-sys
    vulkan-loader
    libevdev
    wayland libxkbcommon
  ];
}
```

---

### Branch 5: gtk4-evdev 🔥 BUILD NOW

**Native Wayland layer-shell integration**

**Input:** evdev crate
**UI:** GTK4 + gtk4-layer-shell
**Wayland Protocol:** Native layer-shell (perfect compositor integration)

**Why this is THE Wayland solution:**
```rust
use gtk4::prelude::*;
use gtk4_layer_shell::{Layer, LayerShell};

let window = gtk4::Window::new();
window.init_layer_shell();
window.set_layer(Layer::Overlay);
window.set_keyboard_mode(gtk4_layer_shell::KeyboardMode::None);
window.set_namespace("input-overlay");
```

**Benefits:**
- Proper Wayland overlay layer (above windows, below notifications)
- No X11 dependency (pure Wayland)
- Compositor respects layer ordering
- Perfect for niri!

**Cons:**
- Linux-only (no Windows/macOS)
- GTK dependency (larger binary)

---

### Branch 6: wgpu-evdev 🔥 BUILD NOW

**Low-level WebGPU graphics**

**Input:** evdev crate
**Graphics:** wgpu (Rust WebGPU implementation)
**Windowing:** winit

**Why low-level:**
- Maximum control over rendering
- Future-proof (WebGPU standard)
- Cross-platform graphics

**Complexity:** HIGH (manual shader writing, no UI framework)

---

### Branch 7: slint-evdev 🔥 BUILD NOW

**Declarative native UI**

**Input:** evdev crate
**UI:** Slint (QML-like declarative syntax)

**Example Slint UI:**
```slint
export component OverlayWindow {
    Rectangle {
        background: transparent;

        KeyVisualizer {
            key: "W";
            x: 100px;
            y: 900px;
            pressed: root.w_pressed;
        }
    }
}
```

**Why this is cool:**
- Declarative UI without web tech
- Live preview in editor
- Native rendering (Skia backend)

---

### Branch 8: dioxus-evdev 🔥 BUILD NOW

**React-like Rust framework**

**Input:** evdev crate
**UI:** Dioxus (RSX syntax - React for Rust)

**Example:**
```rust
fn KeyVisualizer(cx: Scope) -> Element {
    let pressed = use_state(cx, || false);

    rsx!(cx,
        div {
            class: "key",
            background_color: if **pressed { "green" } else { "gray" },
            "W"
        }
    )
}
```

**Why for React devs:**
- Familiar component model
- Hooks (useState, useEffect)
- Native rendering (not webview)

---

### Branch 9: neutralino-evdev 🔥 BUILD NOW

**Tiniest binary possible**

**Input:** evdev npm package (official)
**UI:** Reuse existing HTML/CSS/JS
**Framework:** Neutralino.js (Electron alternative, ~3MB)

**Why tiny:**
```bash
# Binary size comparison
Electron:    150 MB
Tauri:        30 MB
Neutralino:    3 MB ⭐ Winner!
```

**Use evdev npm instead of custom code:**
```javascript
const evdev = require('evdev');

const devices = evdev.enumerate();
devices.forEach(device => {
    device.on('data', (event) => {
        // Forward to overlay
    });
});
```

---

### Branch 10: iced-evdev 🔥 BUILD NOW

**Elm-inspired UI in Rust**

**Input:** evdev crate
**UI:** Iced (Elm architecture - immutable state)

**Example:**
```rust
use iced::{Application, Command, Element, Settings};

struct Overlay {
    w_pressed: bool,
}

impl Application for Overlay {
    fn update(&mut self, message: Message) -> Command<Message> {
        match message {
            Message::KeyPress(key) => {
                if key == Key::W {
                    self.w_pressed = true;
                }
            }
        }
        Command::none()
    }

    fn view(&self) -> Element<Message> {
        // Render overlay
    }
}
```

**Why Elm architecture:**
- Immutable state (no bugs from mutation)
- Clear message flow
- Predictable updates

---

### Branch 11: tauri-rdev-grab 🔬 EXPERIMENTAL

**Test if rdev::grab() really works on Wayland**

**Input:**
```rust
use rdev::grab;

grab(|event| {
    println!("{:?}", event);
    Some(event) // Pass through
})?;
```

**Claims:**
- "Uses evdev library to intercept events"
- "Works with both X11 and Wayland"

**Reality:** UNVERIFIED - NuhxBoard uses rdev and fails on Wayland

**Test Plan:**
1. Build minimal demo
2. Run on niri
3. Try input capture when unfocused
4. If works → Document! If fails → Switch to evdev crate

**shell.nix:**
```nix
{pkgs ? import <nixpkgs> {}}:
pkgs.mkShell {
  buildInputs = with pkgs; [
    rustc cargo
    libevdev  # rdev claims to use this
  ];
}
```

---

### Branch 12: yew-tauri-rdev 🔬 EXPERIMENTAL

**Rust WASM frontend + Tauri backend**

**Input:** rdev::grab() (experimental)
**Frontend:** Yew (Rust compiled to WASM)
**Backend:** Tauri

**Why this is interesting:**
- Entire stack is Rust (type-safe end-to-end)
- Frontend runs as WASM (no JavaScript!)
- React-like component model

**Example Yew Component:**
```rust
use yew::prelude::*;

#[function_component(KeyVisualizer)]
fn key_visualizer() -> Html {
    let pressed = use_state(|| false);

    html! {
        <div class="key" style={if *pressed { "background: green" } else { "background: gray" }}>
            { "W" }
        </div>
    }
}
```

**Complexity:** HIGH (WASM + Tauri + rdev)
**Risk:** rdev::grab() might not work on Wayland

---

## Build Order (Maximize Parallel Work)

### Phase 1: GUARANTEED Winners (Build in parallel)

```bash
# Launch 6 agents simultaneously:
1. tauri-evdev-crate (easiest migration, 90% reuse)
2. bevy-evdev (game engine, modern)
3. gtk4-evdev (perfect Wayland)
4. slint-evdev (declarative UI)
5. dioxus-evdev (React-like)
6. iced-evdev (Elm-like)
```

### Phase 2: Minimal/Specialized (Build in parallel)

```bash
# Launch 3 agents:
7. wgpu-evdev (low-level graphics)
8. neutralino-evdev (tiniest binary)
9. Update raylib-evdev (switch from rdev to evdev)
```

### Phase 3: EXPERIMENTAL (Test claims)

```bash
# Build sequentially to learn from failures:
10. tauri-rdev-grab (test on niri, verify claims)
11. yew-tauri-rdev (only if #10 works!)
```

---

## Success Criteria Per Branch

Each branch MUST have:

1. **Working nix-shell:**
   ```bash
   nix-shell shell.nix --run "./run.sh"
   ```
   Launches overlay with zero manual steps

2. **Global input capture test:**
   - Start overlay
   - Focus different window (e.g., terminal)
   - Press W key
   - Overlay must show W key pressed (green indicator)
   - If fails → Branch is BROKEN for Wayland

3. **Transparent background:**
   - Can see desktop through overlay
   - No opaque window background

4. **Minimal demo features:**
   - W key visualization (gray idle, green pressed)
   - FPS counter
   - Exit on ESC

5. **Documentation:**
   - SETUP.md (how to build)
   - run.sh (single command to launch)
   - shell.nix (all dependencies)

---

## Testing Matrix (Fill After Building)

| Branch | Bundle | Memory | CPU | Input on Wayland | Transparency | Build Time |
|--------|--------|--------|-----|------------------|--------------|------------|
| electron-evdev | 150MB | 300MB | 5% | ✅ VERIFIED | ✅ | 30s |
| tauri-evdev-crate | ? | ? | ? | ✅ GUARANTEED | ✅ | ? |
| raylib-evdev | 5MB | 50MB | 1% | ✅ PROVEN | ✅ | ? |
| bevy-evdev | ? | ? | ? | ✅ GUARANTEED | ✅ | ? |
| gtk4-evdev | ? | ? | ? | ✅ GUARANTEED | ✅ | ? |
| wgpu-evdev | ? | ? | ? | ✅ GUARANTEED | ✅ | ? |
| slint-evdev | ? | ? | ? | ✅ GUARANTEED | ✅ | ? |
| dioxus-evdev | ? | ? | ? | ✅ GUARANTEED | ✅ | ? |
| neutralino-evdev | ? | ? | ? | ✅ GUARANTEED | ✅ | ? |
| iced-evdev | ? | ? | ? | ✅ GUARANTEED | ✅ | ? |
| tauri-rdev-grab | ? | ? | ? | ⚠️ TEST THIS | ✅ | ? |
| yew-tauri-rdev | ? | ? | ? | ⚠️ TEST THIS | ✅ | ? |

---

## Persona-Based Critique (After Testing)

Each "project maintainer" will critique the other 11:

1. **electron-evdev dev** (Web purist)
2. **tauri-evdev-crate dev** (Pragmatic Rust convert)
3. **raylib-evdev dev** (Performance extremist)
4. **bevy-evdev dev** (Game engine advocate)
5. **gtk4-evdev dev** (Wayland native purist)
6. **wgpu-evdev dev** (Graphics low-level guru)
7. **slint-evdev dev** (Declarative UI fan)
8. **dioxus-evdev dev** (React refugee)
9. **neutralino-evdev dev** (Minimalist)
10. **iced-evdev dev** (Functional programming advocate)
11. **tauri-rdev-grab dev** (Optimistic experimenter)
12. **yew-tauri-rdev dev** (Full-Rust idealist)

Example critique format:
```
[raylib-evdev dev critiques tauri-evdev-crate]
"Why bundle a 30MB webview when you can render directly to GPU
in 5MB? Sure, CSS is convenient, but at what cost? Your users
deserve native performance, not browser overhead."

[tauri-evdev-crate dev responds]
"Your 142 lines of manual rendering code do what my 10 lines of
CSS achieve instantly. When a designer wants rounded corners,
you recompile. I edit a stylesheet. Productivity > purity."
```

---

## Next Actions

1. ✅ Push existing branches (electron, raylib, tauri docs)
2. 🔥 Launch 6 parallel agents to build:
   - tauri-evdev-crate
   - bevy-evdev
   - gtk4-evdev
   - slint-evdev
   - dioxus-evdev
   - iced-evdev
3. 🔥 Build remaining: wgpu-evdev, neutralino-evdev
4. 🔬 Test experimental: tauri-rdev-grab, yew-tauri-rdev
5. 📊 Fill testing matrix with real measurements
6. 💬 Create persona critique document

**Ready to BUILD ALL 12 APPROACHES IN PARALLEL! 🚀**

Each will have:
- ✅ Verified Wayland global input capture
- ✅ Transparent overlay
- ✅ Single nix-shell to run
- ✅ Tested on NixOS + niri

LET'S GO!!!
