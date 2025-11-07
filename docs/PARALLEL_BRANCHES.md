# Parallel Branch Testing Strategy

**Goal:** Trial 8 different architectures for web-based input overlay with global input capture on Wayland Linux (NixOS + niri)

**Budget:** 1000 USD Claude Code credits
**Timeline:** Aggressive parallel development
**Target Platform:** Primary = NixOS + Wayland, Secondary = Windows/macOS/X11

---

## Branch Comparison Matrix

| Branch | Tech Stack | Input | Rendering | Code Reuse | Bundle Size | Complexity | Wayland | Priority |
|--------|------------|-------|-----------|------------|-------------|------------|---------|----------|
| **raylib-rdev** | Raylib + Rust | rdev | Native (OpenGL) | 0% | ~5MB | High | ✅ Excellent | 🔥 HIGH |
| **tauri-rdev** | Tauri + Web | rdev | Webview | 90% | ~30MB | Low | ✅ Good | 🔥🔥 HIGHEST |
| **bevy-rdev** | Bevy + Rust | rdev | Native (wgpu) | 0% | ~15MB | Medium | ✅ Excellent | 🔥 HIGH |
| **gtk4-layer-shell** | GTK4 + Rust | rdev/evdev | Native (GTK) | 0% | ~10MB | Medium | ✅ Perfect | 🟡 MEDIUM |
| **wgpu-winit-rdev** | wgpu + winit | rdev | Native (WebGPU) | 0% | ~8MB | High | ✅ Excellent | 🟢 LOW |
| **slint-rdev** | Slint + Rust | rdev | Native | 0% | ~12MB | Medium | ✅ Good | 🟡 MEDIUM |
| **neutralino-evdev** | Neutralino.js | evdev | Webview | 95% | ~3MB | Low | ⚠️ Untested | 🟢 LOW |
| **dioxus-rdev** | Dioxus + Rust | rdev | Native | 30% | ~10MB | Medium | ✅ Good | 🟡 MEDIUM |

---

## Detailed Branch Specifications

### Branch 1: `claude/raylib-rdev` 🔥 HIGH PRIORITY

**Tech Stack:**
- **Rendering:** Raylib (C library with Rust bindings)
- **Input:** rdev (Rust global input capture)
- **Language:** Pure Rust
- **Windowing:** Raylib's GLFW backend

**Pros:**
- Maximum performance (native OpenGL rendering)
- Tiny binary size (~5MB)
- Built-in transparency support
- Excellent Wayland support via GLFW
- Battle-tested for game overlays
- Hot reload via cargo watch

**Cons:**
- Total rewrite (0% code reuse from existing web version)
- Manual UI implementation (no HTML/CSS)
- Learning curve for Raylib API

**Use Case:** Ultimate performance, willing to rebuild UI in Rust

**NixOS Dependencies:**
```nix
{ pkgs ? import <nixpkgs> {} }:
pkgs.mkShell {
  buildInputs = with pkgs; [
    rustc cargo
    raylib
    libGL libGLU
    xorg.libX11 xorg.libXi xorg.libXcursor xorg.libXrandr xorg.libXinerama
    wayland wayland-protocols libxkbcommon
  ];
}
```

**Demo Features:**
- Transparent overlay window (always-on-top)
- Keyboard visualization (W/A/S/D keys)
- Gamepad thumbstick rendering
- Mouse trails
- 60 FPS target

---

### Branch 2: `claude/tauri-rdev` 🔥🔥 HIGHEST PRIORITY

**Tech Stack:**
- **Framework:** Tauri 2.0
- **Backend:** Rust + rdev
- **Frontend:** Existing HTML/CSS/JS/TS (reuse browserInputOverlayView)
- **Webview:** WRY (Tauri's webview library)

**Pros:**
- **90% code reuse** from existing Electron app
- Smaller binary than Electron (~30MB vs 200MB)
- Faster startup than Electron
- Native Rust backend (replace main.js with main.rs)
- IPC security built-in
- Excellent Wayland support

**Cons:**
- Webview quirks (compositor-dependent)
- Slightly heavier than pure native
- Rust + JS/TS hybrid maintenance

**Use Case:** Migrate from Electron, keep existing overlay architecture

**Migration Path:**
1. Keep: `browserInputOverlayView/` (entire overlay view)
2. Keep: `browserInputListeners/` (can optionally port to Rust)
3. Replace: `main.js` → `src-tauri/main.rs` (Rust backend)
4. Replace: `preload.js` → Tauri IPC commands
5. Add: rdev integration in Rust backend

**NixOS Dependencies:**
```nix
{ pkgs ? import <nixpkgs> {} }:
pkgs.mkShell {
  buildInputs = with pkgs; [
    rustc cargo
    nodejs
    webkitgtk_4_1
    openssl pkg-config
    libsoup_3
    wayland wayland-protocols
  ];
}
```

**Demo Features:**
- Exact same overlay UI as current Electron version
- rdev backend replaces evdev
- Cross-platform (Windows/macOS/Linux)
- Transparent window with always-on-top

---

### Branch 3: `claude/bevy-rdev` 🔥 HIGH PRIORITY

**Tech Stack:**
- **Engine:** Bevy 0.14 (Rust game engine)
- **Input:** rdev (global capture) + Bevy input system
- **Rendering:** wgpu (WebGPU backend)
- **Architecture:** Entity Component System (ECS)

**Pros:**
- Game engine features (transform hierarchy, animations, sprites)
- Hot reload with bevy_dylib
- Plugin architecture (modular features)
- Excellent performance
- Built-in transparency support
- Active community and ecosystem

**Cons:**
- Heavier than Raylib (~15MB binary)
- ECS learning curve
- Slower compile times
- Total rewrite

**Use Case:** Want game engine features, willing to learn ECS

**Architecture:**
```rust
// ECS approach
struct KeyVisualizer(Entity); // Component
struct ThumbstickVisualizer { position: Vec2 }

fn update_key_visualizer(
    mut query: Query<&mut KeyVisualizer>,
    input: Res<RdevInputState>,
) {
    // Update based on global input
}
```

**NixOS Dependencies:**
```nix
{ pkgs ? import <nixpkgs> {} }:
pkgs.mkShell {
  buildInputs = with pkgs; [
    rustc cargo
    pkg-config
    alsa-lib libudev-sys
    vulkan-loader vulkan-headers
    xorg.libX11 xorg.libXcursor xorg.libXi xorg.libXrandr
    wayland wayland-protocols libxkbcommon
  ];
}
```

---

### Branch 4: `claude/gtk4-layer-shell` 🟡 MEDIUM PRIORITY

**Tech Stack:**
- **UI:** GTK4 (Rust bindings)
- **Wayland Protocol:** gtk4-layer-shell (native layer-shell overlay)
- **Input:** rdev or evdev
- **Language:** Rust

**Pros:**
- **Native Wayland protocol** (layer-shell)
- Perfect compositor integration (designed for overlays)
- No X11 dependency (pure Wayland)
- Proper always-on-top (window manager respects it)
- GTK theming support

**Cons:**
- **Linux-only** (Wayland-specific)
- GTK dependency (larger binary)
- No Windows/macOS support
- Manual UI building (no web tech)

**Use Case:** Wayland-first approach, don't care about Windows/macOS

**Layer Shell Benefits:**
- Proper z-ordering (above windows, below notifications)
- Screen-edge anchoring
- No click-through hacks (proper overlay layer)
- Compositor-aware (works on all Wayland compositors)

**NixOS Dependencies:**
```nix
{ pkgs ? import <nixpkgs> {} }:
pkgs.mkShell {
  buildInputs = with pkgs; [
    rustc cargo
    gtk4 gtk4-layer-shell
    pkg-config
    wayland wayland-protocols
  ];
}
```

---

### Branch 5: `claude/wgpu-winit-rdev` 🟢 LOW PRIORITY

**Tech Stack:**
- **Graphics:** wgpu (Rust WebGPU implementation)
- **Windowing:** winit (cross-platform window creation)
- **Input:** rdev
- **Language:** Rust

**Pros:**
- Modern graphics API (WebGPU standard)
- Maximum control over rendering
- Cross-platform (Windows/macOS/Linux)
- Future-proof (WebGPU is the future)
- Excellent Wayland support

**Cons:**
- Very low-level (no UI framework)
- Manual shader writing
- High complexity
- Slow development

**Use Case:** Want cutting-edge graphics, willing to build everything from scratch

**NixOS Dependencies:**
```nix
{ pkgs ? import <nixpkgs> {} }:
pkgs.mkShell {
  buildInputs = with pkgs; [
    rustc cargo
    vulkan-loader vulkan-headers
    xorg.libX11 xorg.libXcursor xorg.libXi xorg.libXrandr
    wayland wayland-protocols libxkbcommon
  ];
}
```

---

### Branch 6: `claude/slint-rdev` 🟡 MEDIUM PRIORITY

**Tech Stack:**
- **UI Framework:** Slint (declarative native UI)
- **Input:** rdev
- **Language:** Rust + Slint markup
- **Rendering:** Native (Skia or Qt backend)

**Pros:**
- Declarative UI (QML-like syntax)
- Native rendering (no webview)
- Good tooling (LSP, live preview)
- Cross-platform
- Modern API

**Cons:**
- Younger ecosystem
- Smaller community
- Less examples than GTK/Qt
- Learning curve for Slint markup

**Use Case:** Want declarative UI without web technologies

**Example Slint UI:**
```slint
export component OverlayWindow {
    Rectangle {
        background: transparent;
        KeyVisualizer { key: "W", pressed: root.w_pressed }
        ThumbstickVisualizer { position: root.stick_pos }
    }
}
```

**NixOS Dependencies:**
```nix
{ pkgs ? import <nixpkgs> {} }:
pkgs.mkShell {
  buildInputs = with pkgs; [
    rustc cargo
    fontconfig freetype
    xorg.libX11 xorg.libXcursor xorg.libXi
    wayland wayland-protocols libxkbcommon
  ];
}
```

---

### Branch 7: `claude/neutralino-evdev` 🟢 LOW PRIORITY

**Tech Stack:**
- **Framework:** Neutralino.js (lightweight Electron alternative)
- **Backend:** C++ (Neutralino core) + Node.js extension for evdev
- **Frontend:** Existing HTML/CSS/JS/TS
- **Webview:** Native webview (WebKitGTK on Linux)

**Pros:**
- **Tiny binary** (~3MB vs Electron's 200MB)
- 95% code reuse from existing app
- Familiar web technologies
- Fast startup

**Cons:**
- Smaller community than Electron/Tauri
- Less mature ecosystem
- evdev integration requires custom extension
- Wayland support untested

**Use Case:** Want smallest possible binary, keep web tech

**NixOS Dependencies:**
```nix
{ pkgs ? import <nixpkgs> {} }:
pkgs.mkShell {
  buildInputs = with pkgs; [
    nodejs
    webkitgtk_4_1
    pkg-config
  ];
}
```

---

### Branch 8: `claude/dioxus-rdev` 🟡 MEDIUM PRIORITY

**Tech Stack:**
- **Framework:** Dioxus (Rust React-like framework)
- **Renderer:** Desktop (native rendering, not webview)
- **Input:** rdev
- **Language:** Rust + RSX (React-like syntax)

**Pros:**
- React-like component model (familiar DX)
- Native rendering (no webview overhead)
- Hot reload support
- Can reuse React-style thinking (~30% conceptual reuse)
- Cross-platform

**Cons:**
- Still maturing (young framework)
- Fewer examples than React
- Smaller ecosystem
- Desktop renderer is experimental

**Use Case:** Love React, want native performance

**Example Dioxus Component:**
```rust
fn KeyVisualizer(cx: Scope) -> Element {
    let key_pressed = use_state(cx, || false);

    rsx!(cx,
        rect {
            class: "key",
            background_color: if **key_pressed { "green" } else { "gray" },
            "W"
        }
    )
}
```

**NixOS Dependencies:**
```nix
{ pkgs ? import <nixpkgs> {} }:
pkgs.mkShell {
  buildInputs = with pkgs; [
    rustc cargo
    pkg-config
    webkitgtk_4_1
    wayland wayland-protocols libxkbcommon
  ];
}
```

---

## Testing Methodology

### Phase 1: Setup (All Branches in Parallel)
1. Create git branches
2. Initialize each project structure
3. Create shell.nix for NixOS dependencies
4. Set up build systems (Cargo.toml, etc.)

### Phase 2: Minimal Demo (Per Branch)
**Deliverable:** Simple overlay window showing:
- Transparent background (always-on-top)
- Single key visualization (W key press/release)
- Single gamepad axis (left stick X)
- FPS counter

**Acceptance Criteria:**
- Runs on NixOS + niri (Wayland)
- Works when window is unfocused (global input)
- Maintains 60 FPS
- Can be launched via `nix-shell --run "cargo run"` or similar

### Phase 3: Feature Parity Test
Implement same features across all branches:
- Keyboard: W/A/S/D visualization (analog if available)
- Gamepad: Both thumbsticks + triggers
- Mouse: Position tracking + velocity trails
- UI: Opacity slider (test UI capabilities)

### Phase 4: Performance Comparison
Measure:
- Binary size (stripped release build)
- Memory usage (RSS during operation)
- CPU usage (% during idle and active input)
- Frame time (average, 99th percentile)
- Startup time (launch to first frame)

### Phase 5: Developer Experience
Rate:
- Compile time (clean build, incremental build)
- Hot reload speed
- Debugging experience
- Code clarity
- Documentation quality

---

## Recommendations

### Top 3 Priorities (Based on Your Goals)

**1. tauri-rdev (HIGHEST)**
- Reuse 90% of existing code
- Modern Rust backend
- Cross-platform proven
- Good Wayland support
- **Start here**

**2. raylib-rdev (HIGH)**
- Maximum performance
- Smallest binary
- Best for learning native overlay development
- **Second branch to explore**

**3. bevy-rdev (HIGH)**
- Game engine features
- ECS architecture (future-proof)
- Great for complex overlays with animations
- **Third branch for comparison**

### Wildcards Worth Exploring

**gtk4-layer-shell (MEDIUM)**
- Perfect Wayland integration
- If you only care about Linux, this is ideal
- Proper layer-shell protocol

**slint-rdev (MEDIUM)**
- Declarative UI without web tech
- Good middle ground between native and web

### Skip Unless You Have Extra Time

**wgpu-winit-rdev (LOW)** - Too low-level, slow development
**neutralino-evdev (LOW)** - Immature ecosystem, risky
**dioxus-rdev (LOW)** - Framework too young, desktop renderer experimental

---

## Next Steps

1. **Create all 8 branches** (git branch structure)
2. **Set up shell.nix** for each branch
3. **Implement minimal demos in parallel** (use multiple Claude sessions!)
4. **Run performance tests** on NixOS + niri
5. **Document findings** in comparison matrix
6. **Choose winner** based on data

**Time Estimate:** 2-4 days for all 8 minimal demos with aggressive parallelization

---

## rdev Deep Dive

### Why rdev is King

**Cross-Platform Input Capture:**
```rust
use rdev::{listen, Event, EventType};

fn callback(event: Event) {
    match event.event_type {
        EventType::KeyPress(key) => println!("Key pressed: {:?}", key),
        EventType::MouseMove { x, y } => println!("Mouse: {}, {}", x, y),
        EventType::ButtonPress(button) => println!("Button: {:?}", button),
        EventType::Wheel { delta_x, delta_y } => println!("Scroll: {}, {}", delta_x, delta_y),
        _ => {}
    }
}

// This works globally even when window is unfocused!
listen(callback).unwrap();
```

**Platform Implementation:**
- **Linux:** Uses evdev + X11 fallback
- **Windows:** Uses SetWindowsHookEx (native hooks)
- **macOS:** Uses CGEvent tap (Quartz Event Services)

**Why It Works on Wayland:**
- rdev uses evdev directly on Linux (same as your current approach!)
- Requires `input` group membership (same permission model)
- Falls back to X11 on non-Wayland systems

**Comparison to Current evdev Implementation:**
| Feature | Your evdev.js | rdev (Rust) |
|---------|---------------|-------------|
| Platform | Linux only | Windows/Mac/Linux |
| Language | JavaScript | Rust |
| Maintenance | You maintain | Community maintains |
| Features | Keyboard/Mouse/Gamepad | Keyboard/Mouse (no gamepad) |
| Event Simulation | No | Yes |

**Verdict:** rdev is perfect for keyboard/mouse, but you'll still need separate gamepad library (gilrs or SDL2)

---

## Comparison Summary

### Best Overall: tauri-rdev
- Reuse existing code
- Modern stack
- Proven technology
- Cross-platform
- **Recommended winner**

### Best Performance: raylib-rdev
- Smallest binary
- Fastest rendering
- Most direct control
- **Runner-up**

### Best for Wayland: gtk4-layer-shell
- Native protocol
- Proper layer integration
- Linux-perfect
- **Wayland champion**

### Best for Learning: bevy-rdev
- Modern Rust patterns
- ECS architecture
- Extensible design
- **Future-proof choice**

---

*Ready to start building all 8 branches in parallel!*
