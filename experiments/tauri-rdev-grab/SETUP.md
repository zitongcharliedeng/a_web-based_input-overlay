# Setup Guide: rdev::grab() Wayland Test

## Prerequisites

### System Requirements

1. **Linux with Wayland**
   ```bash
   # Check if you're on Wayland:
   echo $XDG_SESSION_TYPE
   # Should output: wayland
   ```

2. **Rust Toolchain** (version 1.70+)
   ```bash
   rustc --version
   cargo --version
   ```

3. **Input Group Membership** (CRITICAL)
   ```bash
   groups
   # Should list "input" group

   # If not, add yourself:
   sudo usermod -aG input $USER

   # Then log out completely and log back in
   # Check again:
   groups  # Should now include "input"
   ```

4. **Device Access Verification**
   ```bash
   ls -la /dev/input/event*
   # Should show: crw-rw----+ 1 root input
   # (with your username having rw permissions)
   ```

---

## Installation Steps

### Option A: Using NixOS (Recommended)

1. **Enter development environment:**
   ```bash
   cd experiments/tauri-rdev-grab/
   nix-shell shell.nix
   ```

2. **Build the test:**
   ```bash
   cargo build
   ```

3. **Run the test:**
   ```bash
   ./run.sh
   # or manually:
   RUST_LOG=info cargo run
   ```

### Option B: Manual Rust Installation

1. **Install Rust** (if not already installed):
   ```bash
   curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
   source $HOME/.cargo/env
   ```

2. **Install system dependencies:**
   ```bash
   # Ubuntu/Debian:
   sudo apt-get install pkg-config libevdev-dev libinput-dev libwayland-dev libxkbcommon-dev

   # Fedora:
   sudo dnf install pkg-config libevdev-devel libinput-devel wayland-devel libxkbcommon-devel

   # Arch:
   sudo pacman -S pkg-config libevdev libinput wayland libxkbcommon

   # NixOS: Use nix-shell (see Option A)
   ```

3. **Build and run:**
   ```bash
   cd experiments/tauri-rdev-grab/
   cargo build --release
   RUST_LOG=info ./target/release/tauri-rdev-test
   ```

---

## Pre-Test Checklist

Before running the test, verify:

- [ ] `echo $XDG_SESSION_TYPE` outputs `wayland`
- [ ] `groups` includes `input`
- [ ] `ls /dev/input/event*` shows devices
- [ ] `rustc --version` shows 1.70+
- [ ] `cargo --version` shows 1.70+

**If any check fails, the test will error.** Fix prerequisites first.

---

## Running the Test

### Quick Start

```bash
cd experiments/tauri-rdev-grab/
./run.sh
```

This will:
1. Enter nix-shell (if on NixOS)
2. Build the project
3. Run with INFO-level logging

### With Debug Logging

```bash
RUST_LOG=debug ./run.sh
```

More verbose output for troubleshooting.

### Manual Build & Run

```bash
cargo build                    # Debug build
RUST_LOG=info cargo run       # Run with logging

# or for optimized release:
cargo build --release
RUST_LOG=info cargo run --release
```

---

## Test Execution

Once started, the test will:

1. **Detect your display server:**
   ```
   Display Server: WAYLAND
   Compositor: niri
   ```

2. **Attempt to call rdev::grab():**
   ```
   Attempting rdev::grab()...
   (This will block. Press Ctrl+C to exit.)
   ```

3. **Start printing events:**
   ```
   [Event 1] KEY PRESS: KeyW
   [Event 2] MOUSE MOVE: (1234, 567)
   [Event 3] KEY RELEASE: KeyW
   ...
   ```

### Critical Test Phase

**⚠️ This is where the actual test happens:**

1. Window is focused and capturing events (expected)
2. **Click OUTSIDE the window to unfocus it**
3. Press keys while window is UNFOCUSED:
   - W, A, S, D
   - Space
   - Arrow keys
   - Try a character key like "E"
4. Move mouse around
5. Click mouse buttons
6. Scroll wheel

**Check the output:**
- **✓ WORKS:** Events continue printing even when window is unfocused
- **✗ BROKEN:** Events stop printing immediately after you unfocus

---

## Interpreting Results

### Output Examples

#### If Working (Events Continue While Unfocused)

```
[Event 1] KEY PRESS: KeyW            ← You typed this
[Event 2] KEY RELEASE: KeyW
[Event 3] MOUSE MOVE: (1280, 720)    ← You moved mouse
[Event 4] KEY PRESS: Space            ← All while window is UNFOCUSED
[Event 5] MOUSE WHEEL: 1              ← Still working!
...
```

**Conclusion:** ✓ rdev::grab() WORKS on Wayland!

#### If Broken (Events Stop on Unfocus)

```
[Event 1] KEY PRESS: KeyW            ← Window focused
[Event 2] KEY RELEASE: KeyW
[Event 3] MOUSE MOVE: (1280, 720)

← Window unfocused here - no events below ←

(nothing)
(no output)
(events stopped)
```

**Conclusion:** ✗ rdev::grab() BROKEN on Wayland

#### If Error (Can't Even Start)

```
ERROR: rdev::grab() FAILED with error: Permission denied
Reason: User not in 'input' group
```

**Solution:** Run `sudo usermod -aG input $USER` and log out/in

---

## Logging Configuration

### Log Levels

```bash
# INFO (default) - Basic info
RUST_LOG=info ./run.sh

# DEBUG - More details
RUST_LOG=debug ./run.sh

# TRACE - Everything (very noisy)
RUST_LOG=trace ./run.sh

# Specific module
RUST_LOG=tauri_rdev_grab_test=debug ./run.sh
```

### Filtering Output

```bash
# Only show errors
RUST_LOG=error ./run.sh | grep ERROR

# Show events and skip mouse moves (too spammy)
./run.sh | grep -v "MOUSE MOVE"

# Count total events
./run.sh | grep -c "Event"
```

---

## Troubleshooting

### Problem: "Permission denied"

```
Error: Permission denied reading /dev/input/event0
```

**Solution:**
```bash
# Check group membership:
groups
# Should include: input

# If not, add yourself:
sudo usermod -aG input $USER

# IMPORTANT: Log out completely and log back in
# (Just opening a new terminal window won't work)

# Verify:
groups  # Should now list "input"
```

### Problem: "No input devices found"

```
Error: No input devices found
```

**Check:**
```bash
ls -la /dev/input/event*

# Should show:
# crw-rw----+ 1 root input ... event0
# crw-rw----+ 1 root input ... event1
# etc.
```

**If /dev/input is empty:**
- Your system has no input devices (very unusual)
- Check if running in VM without input passthrough

### Problem: "XDG_SESSION_TYPE is not wayland"

```
Display Server: X11 (not Wayland)
```

**Solution:**
```bash
# Switch to Wayland session
# At login screen, select "Wayland" option
# Then log in

# Verify:
echo $XDG_SESSION_TYPE  # Should now be: wayland
```

### Problem: "Build fails with missing libraries"

```
error: linker `cc` not found
```

**Solution for NixOS:**
```bash
nix-shell shell.nix
# Then build inside nix-shell
cargo build
```

**Solution for other distros:**
```bash
# Install build tools:
# Ubuntu: sudo apt-get install build-essential pkg-config
# Fedora: sudo dnf groupinstall "Development Tools"
# Arch: sudo pacman -S base-devel
```

### Problem: "cargo: command not found"

```bash
# Install Rust:
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
source $HOME/.cargo/env

# Verify:
cargo --version
```

---

## Expected Output Timeline

### Good Test Session

```
[Start]
╔═══════════════════════════════════════════════════════════════╗
║  rdev::grab() Wayland Compatibility Test (EXPERIMENTAL)      ║
╚═══════════════════════════════════════════════════════════════╝

Testing rdev::grab() on niri Wayland compositor...

Display Server: WAYLAND
Compositor: niri

Attempting rdev::grab()...

[Event 1] KEY PRESS: KeyW
[Event 2] KEY RELEASE: KeyW
[Event 3] MOUSE MOVE: (1280, 720)
← Window UNFOCUSED here ←
[Event 4] KEY PRESS: KeyS
[Event 5] KEY RELEASE: KeyS
[Event 6] MOUSE MOVE: (1200, 750)

← Ctrl+C pressed to exit ←

Total events captured: 47
✓ UNFOCUSED events detected → rdev::grab() WORKS on Wayland!

[End - Test Passed]
```

### Bad Test Session

```
[Start]
╔═══════════════════════════════════════════════════════════════╗
║  rdev::grab() Wayland Compatibility Test (EXPERIMENTAL)      ║
╚═══════════════════════════════════════════════════════════════╝

Testing rdev::grab() on niri Wayland compositor...

Display Server: WAYLAND
Compositor: niri

Attempting rdev::grab()...

[Event 1] KEY PRESS: KeyW
[Event 2] KEY RELEASE: KeyW

← Window UNFOCUSED - no events below ←

⏱️  [2] Still grabbing...
⏱️  [2] Still grabbing...

← Ctrl+C pressed ←

Total events captured: 2
✗ NO UNFOCUSED events detected → rdev::grab() may be BROKEN on Wayland

[End - Test Failed]
```

---

## Recording Results

After testing, document findings:

1. **Open `TEST_RESULTS.md`**
2. **Fill in:**
   - Date tested
   - System info (NixOS, niri, etc.)
   - Exact behavior observed
   - WORKS or BROKEN result
3. **Commit to git:**
   ```bash
   git add TEST_RESULTS.md
   git commit -m "test: rdev::grab() Wayland test results - [WORKS|BROKEN]"
   ```

---

## Next Steps

### If Test WORKS (✓)

1. Document the discovery
2. Create integration layer for main project
3. Test on:
   - Other Wayland compositors
   - Windows (if available)
   - macOS (if available)
4. Evaluate switching project to use rdev

### If Test BROKEN (✗)

1. Document findings (helps rdev maintainers)
2. Continue using evdev (already proven)
3. Plan Windows/macOS support with uiohook-napi
4. Update project architecture docs

---

## Getting Help

### If Something Fails

1. **Check prerequisites:**
   - [ ] On Wayland (`XDG_SESSION_TYPE=wayland`)
   - [ ] In input group (`groups` lists input)
   - [ ] Rust installed (`cargo --version`)

2. **Check error message:**
   - Permission denied → Fix input group membership
   - No devices found → Check /dev/input exists
   - Build failed → Install dependencies

3. **Collect debug info:**
   ```bash
   # This will help diagnose issues:
   echo "=== System Info ==="
   uname -a
   echo "=== Session ==="
   echo $XDG_SESSION_TYPE
   echo $XDG_CURRENT_DESKTOP
   echo "=== User Groups ==="
   groups
   echo "=== Input Devices ==="
   ls -la /dev/input/event*
   echo "=== Rust Version ==="
   rustc --version
   cargo --version
   ```

4. **Run with debug logging:**
   ```bash
   RUST_LOG=debug ./run.sh 2>&1 | tee test-debug.log
   ```

5. **Share the output** with the project team

---

## Security Notes

### Why This Requires `input` Group?

rdev::grab() (and direct evdev) need to read from `/dev/input/event*` files, which contain raw input data. These are restricted to:
- root (UID 0)
- Members of `input` group

**This is intentional and secure:**
- Only explicitly-added users can access
- Not a kernel/system vulnerability
- Same permission model as `sudo` or `docker`
- Standard across all Linux input tools

### Privacy Consideration

Once you run this test:
- It will capture ALL keyboard and mouse input
- Even passwords you type (if you focus another window)
- This is why you should only run it when expected
- Same applies to any global keyboard hook tool

---

## References

- [Linux Input Subsystem Docs](https://www.kernel.org/doc/html/latest/input/input.html)
- [rdev GitHub Repository](https://github.com/enigo-rs/rdev)
- [Project main README](../../README.md)
- [Wayland Input Capture Guide](../../docs/wayland-input-capture.md)

---

**Last Updated:** 2025-11-07
**For:** Experimental rdev::grab() Wayland compatibility testing
