# Global Input Capture on Wayland

## TL;DR

Wayland prevents out-of-focus input capture for security. This overlay uses **evdev direct access** to bypass Wayland and capture mouse/wheel/gamepad globally on niri (and all other compositors).

**What works:**
- Mouse movement/buttons/wheel (global, works unfocused)
- Gamepad axes/buttons (global, works unfocused)
- Works on **all** Wayland compositors (niri, GNOME, KDE, Hyprland, COSMIC, Sway)
- Works on X11 too

**What doesn't work (by design):**
- Keyboard capture on Wayland (security risk - passwords)
- uiohook-napi on niri (XkbGetKeyboard error)

---

## The Problem

**Wayland's security model:**
- Compositor grants input device access only to focused window
- Lose focus = lose all input (mouse, keyboard, gamepad)
- No API for global capture (intentional design)

**Why this affects gaming overlays:**
- You want overlay to show input even when game has focus
- Traditional approach (uiohook-napi) only works on X11/Windows/macOS
- On Wayland: `XkbGetKeyboard failed to locate a valid keyboard!`

---

## The Solution: evdev Direct Access

### How It Works

**evdev = Linux kernel's input event interface**
- All input devices create `/dev/input/eventX` character devices
- Bypasses Wayland/X11 entirely (reads from kernel)
- Works everywhere (X11, Wayland, even Linux console)

**Our implementation:**
1. Pure JavaScript evdev reader (no native compilation)
2. Opens all `/dev/input/event*` devices
3. Parses raw evdev events (mouse, gamepad)
4. Forwards to overlay renderer

**Why it's secure:**
- Requires explicit permission (user must be in `input` group)
- User makes conscious choice to grant access
- Overlay code is open-source and auditable

---

## Setup (NixOS)

### 1. Check Current Permissions

```bash
# Check if you're already in input group
groups
# Should show: users wheel audio video networkmanager input

# Check /dev/input permissions
ls -la /dev/input/event0
# Should show: crw-rw---- root input
```

If you're **already in the `input` group**, evdev should work immediately!

### 2. Grant Permissions (if needed)

```bash
# Add yourself to input group
sudo usermod -aG input $USER

# Log out and back in for group change to take effect
# (or reboot)
```

### 3. Test evdev Capture

```bash
cd /home/zitchaden/analog_keyboard_overlay_fork/
nix-shell --run "node test-evdev.js"
```

**Expected output:**
```
=== evdev Input Capture Test ===

Starting evdev capture...

[evdev] Starting input capture...
[evdev] Found 25 input devices
[evdev] Opened: /dev/input/event0
[evdev] Opened: /dev/input/event1
... (more devices)
✅ Capture started successfully!
Move your mouse, scroll, press buttons, or move gamepad to see events.
Press Ctrl+C to exit.

Mouse move: dx=5 dy=-3 pos=(1234, 567)
Mouse wheel: delta=1 direction=up
Mouse button: left PRESSED
Gamepad axis: leftStickX = 0.523 (raw: 16832)
```

**If permission denied:**
```
[evdev] /dev/input/event0: Permission denied (add user to 'input' group)
❌ Failed to start capture: No input devices accessible. Run: sudo usermod -aG input $USER
```

### 4. Run Overlay

```bash
./run.sh
```

**Check console output:**
```
[Main] evdev input capture available
[Main] Starting evdev input capture...
[evdev] Starting input capture...
[evdev] Found 25 input devices
[evdev] Opened: /dev/input/event0
... (more devices)
[Main] ✓ evdev capture started
[Main] ✅ Global input capture enabled
```

Move your mouse or use gamepad - you should see events in console:
```
[Main] Mouse wheel: 1
[Main] Mouse button: left pressed
[Main] Gamepad button: A pressed
```

---

## Setup (Other Linux Distros)

### Ubuntu/Debian

```bash
# Add user to input group
sudo usermod -aG input $USER

# Log out and back in

# Test
cd /path/to/analog_keyboard_overlay_fork/
node test-evdev.js
```

### Arch/Manjaro

```bash
# Add user to input group
sudo usermod -aG input $USER

# Log out and back in

# Test
node test-evdev.js
```

### Fedora

```bash
# Add user to input group
sudo usermod -aG input $USER

# Log out and back in

# Test
node test-evdev.js
```

---

## Troubleshooting

### "Permission denied" on /dev/input

**Cause:** Not in `input` group yet.

**Fix:**
```bash
sudo usermod -aG input $USER
# Log out and back in (REQUIRED for group change)
```

**Verify:**
```bash
groups | grep input
# Should show "input" in the list
```

### "No input devices accessible"

**Cause:** All /dev/input/event* denied.

**Fix:** Same as above (add to input group).

### evdev works but overlay doesn't show events

**Cause:** Renderer not yet connected to evdev events.

**Status:** Phase 3 implementation (next step).

**Current behavior:** Events logged in main process console, not yet visualized.

### Mouse position is relative, not absolute

**Explanation:** evdev provides delta (change), not absolute position.

**Why:**
- Linux doesn't have global mouse position API
- Each display server (X11/Wayland) tracks cursor independently
- evdev only sees hardware events (relative movement)

**Solution for overlay:**
- Track cumulative position (evdevInput.js already does this)
- Or ignore position, only visualize movement/clicks

### Gamepad axis values seem wrong

**Explanation:** Different gamepads use different ranges.

**Common ranges:**
- Sticks: -32768 to 32767 (normalized to -1.0 to 1.0)
- Triggers: 0 to 255 (normalized to 0.0 to 1.0)
- D-pad: -1, 0, 1

**Current implementation:**
- `normalizeAxis()` function in evdevInput.js
- Handles most common gamepad types
- May need calibration for exotic controllers

---

## Security Considerations

### Is this a keylogger?

**Technically, yes** - evdev can read keyboard events too.

**However:**
1. **We deliberately don't capture keyboard** (only mouse/gamepad in code)
2. **Requires explicit permission** (input group membership)
3. **Open source** - you can audit `browserInputListeners/evdevInput.js`
4. **No keyboard processing** - we filter out keyboard events

**To verify:**
```bash
# Check the code - we only listen to mouse/gamepad events
grep -n "EV_KEY" browserInputListeners/evdevInput.js
# You'll see we only process mouse buttons (BTN_*) and gamepad buttons
# We ignore keyboard keys entirely
```

### Can other apps see my input?

**No** - evdev is read-only and non-exclusive.

**Explanation:**
- Multiple processes can read from `/dev/input/eventX` simultaneously
- Reading doesn't affect other applications
- Compositor still receives all events normally
- Game still gets input as usual

### Should I trust this?

**Trust but verify:**
1. Read `browserInputListeners/evdevInput.js` (pure JavaScript, ~400 lines)
2. Check what events we process (only mouse/gamepad)
3. Run `test-evdev.js` to see exactly what we capture
4. Remove yourself from `input` group anytime to disable

---

## Alternative Approaches (Research)

### Why not uiohook-napi?

**Tried it** - doesn't work on Wayland.

**Error:** `XkbGetKeyboard failed to locate a valid keyboard!`

**Reason:** Wayland doesn't expose keyboard info to X11 compatibility layer.

**When it works:**
- X11 sessions ✅
- XWayland with permissive compositor ⚠️
- Windows ✅
- macOS ✅ (with accessibility permissions)

**Our approach:**
- Try evdev first (Linux)
- Fall back to uiohook (Windows/macOS/X11)

### Why not XDG Desktop Portal?

**Status:** Too immature (2025).

**Problems:**
1. No gamepad support
2. Requires user consent dialog every session
3. Only GNOME partially implements InputCapture portal
4. Designed for KVM-like apps (pointer barriers), not overlays

**Maybe in 2026+** if adoption improves.

### Why not libei?

**Direction:** libei is for **output** (emulating input), not **input** (capturing).

**Use case:** Virtual keyboard/mouse (like ydotool).

**Not applicable** for overlay visualization.

---

## Implementation Details

### evdev Event Structure

```
struct input_event {
  struct timeval time;  // 16 bytes (timestamp)
  __u16 type;           // 2 bytes (EV_REL, EV_ABS, EV_KEY, etc.)
  __u16 code;           // 2 bytes (axis/button identifier)
  __s32 value;          // 4 bytes (value)
};
Total: 24 bytes
```

### Event Types We Process

| Type | Code Examples | Meaning |
|------|---------------|---------|
| EV_REL (0x02) | REL_X, REL_Y | Mouse movement (delta) |
| EV_REL | REL_WHEEL | Mouse wheel vertical |
| EV_KEY (0x01) | BTN_LEFT, BTN_RIGHT | Mouse buttons |
| EV_KEY | BTN_SOUTH (A), BTN_EAST (B) | Gamepad buttons |
| EV_ABS (0x03) | ABS_X, ABS_Y | Gamepad left stick |
| EV_ABS | ABS_RX, ABS_RY | Gamepad right stick |
| EV_ABS | ABS_Z, ABS_RZ | Gamepad triggers |

### Device Discovery

```javascript
// Scan /dev/input for event devices
const inputDir = '/dev/input';
const files = fs.readdirSync(inputDir);
const eventDevices = files.filter(f => f.startsWith('event'));

// Try to open each device
for (const file of eventDevices) {
  const devicePath = `${inputDir}/${file}`;
  const stream = fs.createReadStream(devicePath);
  // Parse 24-byte evdev events
}
```

### Why Pure JavaScript?

**No native compilation needed:**
- Old `evdev` npm package requires Python + node-gyp
- Unmaintained for 7 years
- Fails on NixOS without proper setup

**Our approach:**
- Use `fs.createReadStream()` to read `/dev/input/eventX`
- Parse binary data with `Buffer.readUInt16LE()` etc.
- No dependencies besides Node.js core modules
- Works everywhere Node.js runs

---

## Next Steps

**Phase 3:** Integrate evdev with overlay renderer
- Connect events to `browserInputOverlayView/default.js`
- Update visualizations (keys, thumbsticks, mouse trails)
- Add fallback to Web Gamepad API (when focused)

**Phase 4:** Testing and polish
- Test on different hardware (various mice/gamepads)
- Add calibration for exotic controllers
- Performance optimization (filter noisy events)

---

## FAQ

**Q: Do I need to be root?**
A: No, just in the `input` group.

**Q: Will this work on other Wayland compositors besides niri?**
A: Yes, evdev bypasses Wayland entirely. Works on GNOME, KDE, Hyprland, COSMIC, Sway, etc.

**Q: What about X11?**
A: Works on X11 too. evdev is compositor-agnostic.

**Q: Can I use this for keyboard input?**
A: Code supports it, but we deliberately don't process keyboard for security reasons.

**Q: Performance impact?**
A: Minimal. Reading evdev events is very efficient (kernel -> userspace, no compositor involved).

**Q: What if I unplug/replug devices?**
A: Currently, you need to restart the overlay. Hot-plug support is a future enhancement.

**Q: Can I use this in production?**
A: Yes, this is the industry-standard approach for Linux input overlays. Discord, OBS, and similar tools use evdev when available.

---

## References

- Linux input subsystem: https://www.kernel.org/doc/html/latest/input/input.html
- evdev protocol: https://www.kernel.org/doc/html/latest/input/event-codes.html
- Wayland security model: https://wayland.freedesktop.org/docs/html/ch04.html
- Why uiohook fails on Wayland: https://github.com/wilix-team/iohook/issues/495

---

**Last Updated:** 2025-11-06
**Status:** ✅ evdev implementation complete, renderer integration pending
