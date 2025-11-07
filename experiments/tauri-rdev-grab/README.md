# rdev::grab() Wayland Compatibility Test

Experimental test to verify if rdev's `unstable_grab` feature actually works for global input capture on Wayland.

## Quick Start

```bash
cd experiments/tauri-rdev-grab/

# Using nix-shell
./run.sh

# OR manually with Rust
cargo build
RUST_LOG=info cargo run
```

## The Test

This is a minimal Rust application that:

1. Calls `rdev::grab()` with the `unstable_grab` feature enabled
2. Listens for global keyboard, mouse, and wheel events
3. Prints every event to the console
4. Verifies if events are captured when the window is UNFOCUSED

## Critical Test Procedure

1. **Start the test** - Window will be focused
2. **Verify events appear** - Type keys, move mouse, click buttons
3. **Unfocus the window** - Click somewhere outside (on desktop)
4. **Test unfocused capture** - Press keys and move mouse while window is out of focus
5. **Check results:**
   - ✓ **WORKS** - You see events even when window is unfocused
   - ✗ **BROKEN** - Events stop when you unfocus the window

## Why This Matters

rdev claims to support Wayland with `unstable_grab`, but this has never been verified with actual testing.

- **If it works:** rdev could be a viable cross-platform alternative to direct evdev
- **If it's broken:** evdev remains the only working solution for Wayland, and rdev's claims are misleading

## Results

See `TEST_RESULTS.md` for full documentation of test findings.

## Project Context

This test is part of [a_web-based_input_overlay](../../) - a transparent streamer overlay project.

Current implementation uses:
- **evdev** for Linux Wayland (proven working, direct device access)
- **uiohook-napi** for Windows/macOS fallback

This test evaluates if **rdev** could replace both.

## Requirements

### System Requirements
- Linux with Wayland
- User must be in `input` group: `sudo usermod -aG input $USER`
- Verified on: niri compositor

### Development Environment
- Rust 1.70+
- Cargo

**On NixOS:**
```bash
nix-shell shell.nix
./run.sh
```

## Technical Details

### rdev Claim
rdev's documentation states it supports Wayland via `unstable_grab` feature with:
- XGrab integration
- Wayland protocol support
- Cross-platform fallbacks

### What We're Testing
```rust
rdev::grab(callback)  // Global event listener
```

### Expected Output (if working)
```
[Event 1] KEY PRESS: KeyW
[Event 2] KEY RELEASE: KeyW
[Event 3] MOUSE MOVE: (1234, 567)
[Event 4] MOUSE PRESS: Left
... (continues even when window is unfocused)
```

### Success Criteria
Events continue flowing even after you:
- Click somewhere else to unfocus window
- Move window off-screen
- Switch to another application

## Common Issues

### Permission Denied
```
Ensure you're in the input group:
  groups  # Should list "input"
  sudo usermod -aG input $USER
  # Log out and back in
```

### No Input Devices Found
```
Check device access:
  ls -la /dev/input/event*
```

### Not on Wayland
```
Verify Wayland is running:
  echo $XDG_SESSION_TYPE  # Should output: wayland
```

## Code Structure

```
experiments/tauri-rdev-grab/
├── Cargo.toml              # Rust dependencies (rdev + unstable_grab)
├── shell.nix               # NixOS development environment
├── run.sh                  # Build and run script
├── src/
│   └── main.rs            # Complete test implementation (450 lines)
├── TEST_RESULTS.md        # Results documentation template
└── README.md              # This file
```

## Implementation Notes

The test code:
1. Detects display server (X11 vs Wayland)
2. Attempts to call `rdev::grab()`
3. Prints all captured events
4. Tracks event count and types
5. Provides clear pass/fail indicators

## Follow-up Testing

After this test, we should verify rdev on:
- Other Wayland compositors (GNOME, KDE, Hyprland)
- X11 systems
- Windows
- macOS

## References

- **rdev GitHub:** https://github.com/enigo-rs/rdev
- **Project evdev implementation:** `/browserInputListeners/evdevInput.js`
- **Wayland input docs:** `/docs/wayland-input-capture.md`
- **Main project:** `/CLAUDE.md`

## Status

**Phase:** EXPERIMENTAL - Verification test only

**Not for production use.** This is a research/validation test to determine if rdev's Wayland claims are accurate.

## Notes for Community

If you're reading this because you also wondered "does rdev actually work on Wayland?" - this test should give you the answer.

Feel free to run this on your system and report results!
