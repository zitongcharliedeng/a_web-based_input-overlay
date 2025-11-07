# Input Capture: rdev::grab() vs evdev (Direct)

## Overview

This document compares two approaches to global input capture on Linux Wayland:

1. **rdev::grab()** (this test) - Library abstraction with unstable Wayland support
2. **evdev** (current implementation) - Direct device file access

---

## Architecture Comparison

### rdev::grab() Approach

```
Physical Input (keyboard/mouse)
         ↓
  Linux Kernel (input events)
         ↓
/dev/input/eventX (character devices)
         ↓
rdev library (wraps device reading)
         ↓
rdev::grab(callback) [BLOCKING CALL]
         ↓
Your callback receives Event structs
```

**Pros:**
- Single library dependency
- Cross-platform interface (Windows/macOS/Linux)
- High-level API (just implement callback)
- No manual event parsing

**Cons:**
- Blocks entire thread (callback is blocking)
- Wayland support unverified (this test!)
- Library maintainer dependent
- Added abstraction layer

### Direct evdev Approach (Current)

```
Physical Input (keyboard/mouse)
         ↓
  Linux Kernel (input events)
         ↓
/dev/input/eventX (character devices)
         ↓
evdevInput.js (pure JS implementation)
         ↓
fs.createReadStream + EventEmitter
         ↓
Your event listeners
```

**Pros:**
- No library abstraction needed
- Proven working on Wayland (✓ tested)
- Fully asynchronous (non-blocking)
- Direct hardware access (most reliable)
- Can customize event parsing

**Cons:**
- Platform-specific (Linux-only)
- Manual event parsing (24-byte struct)
- Lower-level code (more error-prone)
- Requires `/dev/input` access (input group)

---

## Permission Model

### Both Approaches Require `input` Group

```bash
# Before using either method:
sudo usermod -aG input $USER
# Log out and back in

# Verify:
groups  # Should include "input"

# Check device permissions:
ls -la /dev/input/event*
# Should show: crw-rw----+ 1 root input
```

**This is intentional and standard.** All global input capture tools on Linux require it:
- OBS Studio
- Input Leap
- AntiMicroX
- Key Mapper
- Espanso
- rdev itself
- Direct evdev access

**It's not a security bypass** - the admin explicitly grants the permission.

---

## Performance Comparison

### rdev::grab()

| Metric | Characteristic |
|--------|---|
| **Blocking** | Yes - callback blocks event loop |
| **Latency** | ~1-5ms (library overhead) |
| **CPU Usage** | Low (depends on callback) |
| **Memory** | Minimal (abstraction layer) |
| **Event Frequency** | Handles 1000s/sec (HID rate) |

### Direct evdev

| Metric | Characteristic |
|--------|---|
| **Blocking** | No - fully asynchronous |
| **Latency** | <1ms (direct file read) |
| **CPU Usage** | Low (raw stream parsing) |
| **Memory** | Minimal (just JS event parsing) |
| **Event Frequency** | Handles 1000s/sec (HID rate) |

**Verdict:** Functionally equivalent if both work.

---

## Wayland Compatibility

### rdev::grab() Claims

From rdev documentation/community discussions:
- "Works on Wayland via unstable_grab"
- "Uses XGrab protocol fallback"
- "Modern compositors supported"

**Reality:** Unknown (this test determines the truth!)

### Direct evdev Status

From `browserInputListeners/evdevInput.js`:
- **VERIFIED working on niri (Wayland)** ✓
- Direct `/dev/input/event*` access
- No display server dependency
- Captures all input globally

**Proven:** Yes, confirmed through testing and deployment

---

## Cross-Platform Viability

### rdev::grab() Cross-Platform

**If Wayland grab works:**

| Platform | Support | Backend |
|----------|---------|---------|
| Linux Wayland | ✓ (to be verified) | unstable_grab |
| Linux X11 | ✓ Likely | XGrab |
| Windows | ✓ Confirmed | Native API |
| macOS | ✓ Likely | CGEvent |

Could be single library for all platforms!

### evdev (Current) Cross-Platform

| Platform | Support | Approach |
|----------|---------|---------|
| Linux Wayland | ✓ Yes | Direct evdev |
| Linux X11 | ✓ Yes | Direct evdev |
| Windows | ✗ No | Need fallback (uiohook-napi) |
| macOS | ✗ No | Need fallback (uiohook-napi) |

Currently requires platform-specific code.

---

## Code Complexity

### rdev::grab() Implementation

```rust
// Very simple:
rdev::grab(|event| {
    match event.event_type {
        rdev::EventType::KeyPress(key) => { /* ... */ }
        rdev::EventType::MouseMove { x, y } => { /* ... */ }
        // ...
    }
    Some(event) // Pass through
})?;
```

**Lines:** ~50 for basic integration
**Complexity:** Minimal

### Direct evdev Implementation

```javascript
// More involved:
const inputDevice = fs.createReadStream('/dev/input/event0');
const buffer = Buffer.alloc(24);

inputDevice.on('data', (chunk) => {
  // Parse 24-byte timeval + type + code + value
  const type = chunk.readUInt16LE(16);
  const code = chunk.readUInt16LE(18);
  const value = chunk.readInt32LE(20);

  // Convert to human-readable event
  switch (type) {
    case EV_KEY: { /* ... */ }
    case EV_REL: { /* ... */ }
    case EV_ABS: { /* ... */ }
  }
});
```

**Lines:** ~450 (full evdevInput.js)
**Complexity:** Medium (event struct parsing)

---

## Decision Matrix

### If rdev::grab() WORKS on Wayland

| Criterion | rdev | evdev |
|-----------|------|-------|
| **Cross-platform** | ✓ (single lib) | ✗ (needs fallback) |
| **Code simplicity** | ✓ (5-10 lines) | ✗ (450+ lines) |
| **Community** | ✓ (maintained crate) | ✓ (our code) |
| **Proven Wayland** | ✓ (if test passes) | ✓ (yes) |
| **Maintenance** | ✓ (upstream) | ✓ (we own it) |

**Recommendation:** Switch to rdev, remove evdev (simpler, cross-platform)

### If rdev::grab() BROKEN on Wayland

| Criterion | rdev | evdev |
|-----------|------|-------|
| **Wayland support** | ✗ (broken) | ✓ (yes) |
| **Reliability** | ✗ (unverified) | ✓ (proven) |
| **Feature complete** | ? (unknown) | ✓ (yes) |
| **Maintenance** | ? (possibly dead) | ✓ (we own it) |

**Recommendation:** Keep evdev, use rdev for Windows/macOS fallback only

---

## Industry Standards

### Who Uses What?

**Direct Device Access:**
- OBS Studio → libinput (Wayland), X11 extensions
- Input Leap → evdev directly
- AntiMicroX → SDL2 → evdev
- Key Mapper → evdev directly
- Espanso → evdev directly

**Wrapped Libraries:**
- enigo (general-purpose) → platform-specific backends
- rdev (our test subject)

**Pattern:** High-performance tools use direct access. Wrappers add overhead.

---

## Timeline

### Current State
- **evdev:** Production-ready, proven working
- **rdev:** Unknown (this test will verify)

### Test Results Outcomes

**Scenario A: rdev::grab() Works**
1. Document findings
2. Create wrapper integration layer
3. Test on Windows/macOS
4. Evaluate switch cost vs benefit
5. Potentially migrate (4-6 weeks of work)

**Scenario B: rdev::grab() Broken**
1. Document findings (for rdev maintainers)
2. Continue with evdev (no changes)
3. Plan Windows/macOS fallback (uiohook-napi)
4. Document cross-platform strategy
5. Proceed with current timeline

---

## This Test's Purpose

We're running this test to answer definitively:

> **"Does rdev::grab() actually capture input globally on Wayland, or is this an unsupported claim?"**

This determines our long-term architecture:
- Single library, or
- Hybrid approach with fallbacks

---

## References

- [rdev GitHub](https://github.com/enigo-rs/rdev)
- [evdev Linux API](https://www.kernel.org/doc/html/latest/input/input.html)
- [Project's evdevInput.js](../../browserInputListeners/evdevInput.js)
- [OBS Studio (industry reference)](https://github.com/obsproject/obs-studio)

---

## Questions Answered

**Q: Why test rdev if evdev already works?**
A: To determine if we can simplify cross-platform support (Windows/macOS) with a single library.

**Q: What if rdev doesn't work?**
A: Continue with evdev (proven) + uiohook-napi fallback (standard approach).

**Q: Why not just use rdev from the start?**
A: Because "Wayland support" is a claim, not proven reality. This test verifies it.

**Q: Can both run simultaneously?**
A: Theoretically yes, but redundant. We'd pick one based on test results.

**Q: What about X11?**
A: Both should work. This test focuses on Wayland (the "hard" case).
