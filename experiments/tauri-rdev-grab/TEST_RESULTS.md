# rdev::grab() Wayland Compatibility Test Results

## Purpose

Test whether rdev's `unstable_grab` feature works on Wayland, specifically on the niri compositor.

**Hypothesis:** rdev claims to support Wayland via XGrab and other mechanisms, but actual functionality is unverified.

**Goal:** Determine if rdev::grab() can capture input globally (unfocused) on Wayland.

---

## Test Environment

### System Information
- **OS:** NixOS
- **Kernel:** [Check with `uname -r`]
- **Compositor:** niri (Wayland)
- **Session Type:** wayland (check `$XDG_SESSION_TYPE`)

### Rust Toolchain
- **Rust Version:** [Check with `rustc --version`]
- **rdev Version:** 0.5 with unstable_grab feature
- **Cargo:** [Check with `cargo --version`]

---

## Test Procedure

### Prerequisites
1. User must be in `input` group:
   ```bash
   sudo usermod -aG input $USER
   # Log out and back in
   groups  # Verify 'input' is listed
   ```

2. niri compositor must be running (verify):
   ```bash
   echo $XDG_SESSION_TYPE  # Should output: wayland
   echo $XDG_CURRENT_DESKTOP  # Should contain: niri
   ```

### Execution Steps

1. **Build the test:**
   ```bash
   cd experiments/tauri-rdev-grab/
   ./run.sh
   ```

2. **Run the test:**
   - The test will start and begin listening for input events
   - Initially, this window will be FOCUSED (in foreground)
   - You should see keyboard/mouse events being printed

3. **Critical Test - Unfocused Input:**
   - Click OUTSIDE this window to UNFOCUS it
   - Move the window to the side if needed to access desktop
   - Press keys (W, A, S, D, Space, etc.)
   - Move mouse around
   - Click mouse buttons
   - Scroll wheel

4. **Observe Results:**
   - **WORKS (✓):** You see events printed even when window is UNFOCUSED
   - **BROKEN (✗):** Events STOP appearing when window loses focus

---

## Results

### Status: [PENDING / WORKS / BROKEN]

### Date Tested: [YYYY-MM-DD]
### Tested By: [User/System]

### Observations

#### Window Focused (Expected to Capture Events)
```
[Test output from when window is focused]
```

**Status:** [ ] Events captured ✓ / [ ] Events NOT captured ✗

#### Window Unfocused (Critical Test)
```
[Test output from when window is UNFOCUSED]
```

**Status:** [ ] Events captured (WORKS ✓) / [ ] Events stopped (BROKEN ✗)

### Detailed Results

| Aspect | Result | Notes |
|--------|--------|-------|
| **Binary compiled?** | [ ] Yes [ ] No [ ] Error | [Error message if applicable] |
| **grab() function called?** | [ ] Yes [ ] No | [Error message if No] |
| **Events captured when focused?** | [ ] Yes [ ] No | [Examples of events] |
| **Events captured when UNFOCUSED?** | [ ] Yes [ ] No | **CRITICAL** |
| **Permission errors?** | [ ] Yes [ ] No | [Error message if Yes] |
| **Device access errors?** | [ ] Yes [ ] No | [Error message if Yes] |

---

## Analysis

### Hypothesis Outcome

**rdev::grab() Wayland Support: [VERIFIED / UNVERIFIED / DISPROVEN]**

#### If WORKS (✓)
```
Conclusion: rdev::grab() successfully captures input on Wayland!

Implications:
- Could be used as fallback for Windows/macOS versions
- evdev may not be necessary if rdev works
- Cross-platform approach becomes viable
- Consider using rdev instead of evdev for this project

Recommendation:
- Investigate why it works (XGrab? Wayland protocol?)
- Document this finding for community
- Test on other compositors (GNOME, KDE, Hyprland)
- Consider integrating into main project
```

#### If BROKEN (✗)
```
Conclusion: rdev::grab() DOES NOT work on Wayland

Implications:
- rdev's Wayland claims are unverified/false
- Direct evdev access is necessary on Wayland
- Windows/macOS fallbacks needed anyway (uiohook-napi)
- rdev approach should NOT be used for unfocused input

Recommendation:
- Continue with evdev for Wayland (proven working)
- Document that rdev is NOT Wayland-compatible
- Add note to project that rdev claims are misleading
- Focus on evdev + fallback strategy
```

---

## Comparison: rdev vs evdev

### rdev::grab() Claims

From rdev documentation/community:
- "Wayland support via unstable_grab feature"
- "Should work on modern compositors"
- "XGrab integration"

### Actual Test Result

- **Works on niri:** [ ] Yes [ ] No
- **Works when unfocused:** [ ] Yes [ ] No

### evdev (Current Implementation)

From `browserInputListeners/evdevInput.js`:
- Direct access to `/dev/input/event*`
- **Confirmed working on niri (unfocused):** ✓ Yes
- **Requires input group:** ✓ Yes (same as rdev)
- **Captures all events globally:** ✓ Yes
- **Stable/production-ready:** ✓ Yes

---

## Technical Notes

### What This Tests

`rdev::grab()` function signature:
```rust
pub fn grab<F>(callback: F) -> Result<()>
where
    F: FnMut(Event) -> Option<Event> + 'static,
```

- Blocking call that registers a global event handler
- Returns `Ok(())` if successful, `Err` if initialization fails
- Callback receives events even from other windows (if working correctly)

### Expected Behavior if Working

1. Function returns `Ok()` immediately
2. All keyboard events captured globally
3. All mouse events captured globally
4. Events flow continuously while window is UNFOCUSED
5. No dependency on window focus state

### Expected Behavior if Broken

1. Function returns `Ok()` but events stop when unfocused
2. OR function returns `Err` with initialization failure
3. Fallback would be to use platform-specific methods

---

## Error Handling

### Common Errors

#### Permission Denied
```
Error: PermissionDenied
Reason: User not in 'input' group

Solution:
  sudo usermod -aG input $USER
  # Log out and back in
```

#### Device Not Found
```
Error: No input devices found
Reason: /dev/input/eventX files inaccessible

Solution:
  Check: ls -la /dev/input/event*
  Should have: crw-rw----+ 1 root input
```

#### Wayland Not Detected
```
Error: Not running on Wayland
Reason: XDG_SESSION_TYPE != wayland

Solution:
  Check: echo $XDG_SESSION_TYPE
  Ensure niri is running as Wayland session
```

---

## Platform Coverage

After this test, plan to verify rdev on:

- [ ] NixOS + niri (WAYLAND) - **THIS TEST**
- [ ] NixOS + GNOME (WAYLAND)
- [ ] NixOS + KDE Plasma (WAYLAND)
- [ ] X11-only system (if available)
- [ ] Windows (rdev has Windows implementation)
- [ ] macOS (rdev has macOS implementation)

---

## Follow-up Actions

### If rdev Works
1. Consider using rdev as primary input method
2. Test on other platforms to confirm cross-platform viability
3. Update project architecture to use rdev
4. Document why evdev can be replaced

### If rdev Broken
1. Document findings for rdev maintainers
2. Confirm evdev continues to work
3. Update project README with findings
4. Note that rdev "Wayland support" is misleading
5. Plan cross-platform strategy:
   - Linux Wayland: evdev
   - Linux X11: rdev or evdev
   - Windows: uiohook-napi
   - macOS: uiohook-napi

---

## References

### Related Resources
- [rdev Repository](https://github.com/enigo-rs/rdev)
- [rdev unstable_grab PR](https://github.com/enigo-rs/rdev/pull/...)
- [evdev Implementation](https://github.com/enigo-rs/rdev/blob/main/src/linux_grabber.rs)
- [Project evdevInput.js](../../browserInputListeners/evdevInput.js)
- [Wayland Input Capture Docs](../../docs/wayland-input-capture.md)

### Community Discussions
- [rdev Wayland Support Issue](https://github.com/enigo-rs/rdev/issues/...)
- [Linux Input Subsystem](https://www.kernel.org/doc/html/latest/input/input.html)

---

## Conclusion

[To be filled after test execution]

**Summary:**
[Brief summary of results and implications]

**Recommendation:**
[Recommended action based on results]

**Date Completed:** [YYYY-MM-DD]
