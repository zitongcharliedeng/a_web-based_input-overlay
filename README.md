# Raylib Input Overlay Demo

A standalone demonstration of a transparent overlay with global input capture using Raylib and rdev.

## Features

- ✅ **Transparent window** - See-through overlay
- ✅ **Always on top** - Stays above other windows
- ✅ **Global input capture** - Captures keyboard events even when other windows are focused
- ✅ **Cross-platform** - Windows, macOS, Linux (X11), and Wayland (untested)

## Tech Stack

- **Raylib** - Cross-platform graphics library for transparent overlay rendering
- **rdev** - Cross-platform input event library with `unstable_grab` feature for global capture

## Platform Requirements

### Linux
You must be a member of the `input` group to access `/dev/input/event*` devices:

```bash
sudo usermod -a -G input $USER
# Log out and log in for the change to take effect
```

### macOS
The app will request Accessibility permissions. Grant access in:
- System Preferences → Security & Privacy → Privacy → Accessibility

### Windows
No special permissions needed - works out of the box.

## Building and Running

```bash
# Build
cargo build --release

# Run
cargo run --release
```

## How It Works

1. **Input Capture**: Uses `rdev::grab()` to intercept keyboard events globally
   - On Linux: Uses evdev (requires `input` group membership)
   - On macOS: Uses Accessibility API
   - on Windows: Uses Windows Hooks API

2. **Transparent Overlay**: Uses Raylib with these flags:
   - `WINDOW_TRANSPARENT` - Enables transparent framebuffer
   - `WINDOW_UNDECORATED` - Removes window frame
   - `WINDOW_TOPMOST` - Always on top

3. **Shared State**: Uses `Arc<Mutex<HashSet>>` to share pressed keys between input thread and render thread

## Testing rdev on Wayland

This demo is a test to verify if `rdev::grab()` actually works on Wayland:

```bash
# On a Wayland system (like your NixOS)
cargo run --release

# Try pressing keys while another window is focused
# If you see the keys appear in the overlay, rdev works on Wayland!
# If you see permission errors, rdev doesn't support Wayland properly
```

## Known Limitations

- Click-through (mouse passthrough) is not currently exposed in raylib-rs bindings
  - Can be added with manual FFI to `SetWindowState(FLAG_WINDOW_MOUSE_PASSTHROUGH)`
- Wayland support via rdev is **unverified** - this demo tests it

## Code Structure

```
src/main.rs
├── Input capture thread (rdev::grab)
├── Raylib window initialization (transparent + topmost)
└── Render loop (displays pressed keys)
```

## Next Steps

If this demo works on Wayland:
- ✅ Use Raylib + rdev for the full overlay project
- ✅ Confirmed cross-platform solution

If this demo fails on Wayland:
- ❌ Use direct evdev on Linux instead of rdev
- ✅ Keep rdev for Windows/macOS
