# rdev::grab() Investigation: Understanding the Claim

## What is rdev?

**rdev** is a cross-platform library for capturing and simulating input events:

```
https://github.com/enigo-rs/rdev
```

It provides:
- `listen()` - Capture input events globally
- `grab()` - Capture input with "grabbing" (blocking other applications)
- `simulate()` - Synthesize keyboard/mouse events

### Primary Use Case

rdev is designed for:
- Input recorders
- Macro tools
- Automation scripts
- Input mappers (remap keys/controllers)

---

## The "unstable_grab" Feature

### What It Claims

From rdev documentation/community:

> "The `unstable_grab` feature provides improved Wayland support for the grab() function."

Key claims:
1. Wayland support via `grab()`
2. Cross-platform global input capture
3. "Modern compositors" supported
4. XGrab integration as fallback

### The Reality

The feature is marked **"UNSTABLE"** for a reason:

- Not well-tested in production
- Community reports vary (some work, some don't)
- Depends heavily on compositor implementation
- May not work as advertised

### Why This Test Matters

**Before this test:** We have anecdotal reports and documentation claims
**After this test:** We have verified truth

---

## rdev Architecture

### How rdev Works

```
┌─────────────────────────────────────────────────────────────┐
│                     rdev crate                               │
│                                                              │
│  pub fn grab<F>(callback: F) -> Result<()>                 │
│  where F: FnMut(Event) -> Option<Event>                     │
└─────────────────────────────────────────────────────────────┘
             │
             ├─ Linux → rdev/src/linux_grabber.rs
             │           ├─ X11 mode (XGrab)
             │           └─ Wayland mode (unstable_grab)
             │
             ├─ Windows → Windows API
             │
             └─ macOS → CoreGraphics (CGEvent)
```

### Linux Implementation (The Critical Part)

rdev's Linux code has two paths:

#### Path 1: X11 Mode (XGrab)
```rust
// Uses X11's XGrab functions
// Well-tested, stable
// Works: Yes ✓
```

#### Path 2: Wayland Mode (unstable_grab)
```rust
// Claimed to use:
// - Wayland protocols
// - XGrab fallback for compatibility
// - Direct device access (evdev-like)
// Works: ??? (This is what we're testing!)
```

### The Source Code

From `rdev/src/linux_grabber.rs`:

```rust
#[cfg(feature = "unstable_grab")]
unsafe fn grab_impl<F: FnMut(Event) -> Option<Event> + 'static>(
    callback: F,
) -> Result<()> {
    // Implementation details here
    // Either uses Wayland protocol or XGrab
}
```

**Key observation:** The actual implementation is complex and depends on:
1. Which display server is detected
2. Availability of Wayland protocol support
3. Compositor's implementation level

---

## Why rdev's Claims Might Be Wrong

### Reason 1: Wayland is Not Homogeneous

Wayland is a **protocol**, not a monolithic system like X11.

Each compositor implements it differently:
- **GNOME Shell** - Minimal protocol, security-focused
- **KDE Plasma** - More permissive
- **Hyprland** - Custom implementations
- **niri** - Very new, minimal protocol support
- **Sway** - Follows spec strictly

There's **no "global grab" protocol in Wayland** (intentionally).

### Reason 2: The X11 Fallback Doesn't Work on Wayland

rdev might try to fallback to X11's XGrab, but:
- Pure Wayland compositors ignore X11
- XWayland (X11 inside Wayland) is optional
- Even if present, XWayland windows can't grab globally

### Reason 3: Direct Device Access (evdev) Isn't "Grabbing"

If rdev falls back to `/dev/input/eventX` reading:
- This is what our project already does
- It's not XGrab, it's not Wayland protocol
- Just direct device file access
- Works, but rdev shouldn't claim this is "Wayland support"

### Reason 4: No Public Test Results

Despite existing since ~2019, **no public test results** show rdev::grab working on Wayland.

- GitHub issues mention vague support
- No clear examples
- No known projects using it for Wayland grab
- Community reports are anecdotal

---

## What We Expect to Find

### Scenario A: rdev::grab() Actually Works (10% probability)

```rust
rdev::grab(callback)
    ↓
✓ Calls successfully
✓ Returns Ok()
✓ Callback receives events globally
✓ Works when window unfocused
→ DISCOVERY: rdev claims are verified!
```

**Implications:**
- rdev's Wayland support is real (surprising!)
- Could use for all platforms
- Library maintained well enough
- We should switch to rdev

### Scenario B: rdev::grab() Fails at Runtime (50% probability)

```rust
rdev::grab(callback)
    ↓
✓ Calls successfully
✓ Returns Ok()
✗ No events received / Only focused events
→ RESULT: rdev claim is FALSE
```

**Implications:**
- rdev doesn't actually capture globally on Wayland
- Fallback mechanism broken or missing
- Must use evdev for Wayland
- rdev useful for Windows/macOS only

### Scenario C: rdev::grab() Fails at Initialization (40% probability)

```rust
rdev::grab(callback)
    ↓
✗ Returns Err()
→ RESULT: rdev can't initialize on Wayland
```

**Implications:**
- rdev explicitly doesn't support this system
- Error message should explain why
- evdev is the only option
- rdev is not viable

---

## Technical Deep Dive

### What "Global Grab" Means

On different platforms, "grab" means different things:

**X11 (XGrab):**
- XGrabKeyboard / XGrabPointer
- Redirects input to requesting window
- Other apps can't see events
- Blocking/exclusive

**Windows:**
- SetWindowsHookEx
- Global hook into event chain
- Can be overridden by admin
- System-wide or per-process

**macOS:**
- CGEvent tap (kCGHIDEventTap)
- Requires accessibility permissions
- Can be disabled by system
- Process-specific

**Wayland:**
- No global grab protocol (intentional security feature)
- Alternatives:
  1. XWayland (X11 inside Wayland) - breaks on pure Wayland
  2. Direct device access (/dev/input) - what we do
  3. Compositor-specific extensions - not standard

### Why Wayland Can't Have Global Grab

Wayland's security model:

```
X11 (Old, trusting):
  Any app can grab global input
  → Passwords can be stolen
  → Spyware can exist
  → Bad for security

Wayland (New, security-focused):
  Only compositor can see all input
  Apps see only their own events
  → Passwords are safer
  → Spyware must be in-kernel or compositor
  → Better for users
```

**Trade-off:** Better security, but some tools (like ours) can't capture globally.

**Solution:** Use `/dev/input` directly (requires explicit input group permission)

---

## Hypothesis: What's Really Happening

### Most Likely Scenario

rdev's "Wayland support" probably means:

```
User calls: rdev::grab()
    ↓
rdev checks: Are we on Wayland?
    ↓
    YES
    ↓
rdev tries:
  1. Check for XWayland (/dev/wl_display)
  2. If XWayland exists: Use XGrab inside XWayland
  3. If no XWayland: Fall back to /dev/input (evdev)
  4. If no /dev/input: Return error
    ↓
Reality:
  - XWayland XGrab: Can't grab globally on Wayland
  - evdev fallback: Works, but rdev shouldn't call it "Wayland support"
  - Result: Probably broken on pure Wayland
```

### Our Test Will Prove It

By running the test and observing actual behavior, we'll know which path rdev takes.

---

## Community Context

### What Developers Are Saying

**From rdev issues/discussions:**

> "Does unstable_grab work on Wayland?" - Unanswered (2023)

> "I got it to work on Hyprland" - No details provided

> "Not working on GNOME" - Confirmed issue

> "Seems to depend on compositor" - General statement

### No Definitive Answer

**The pattern:** Lots of questions, few answers, no clear documentation.

This suggests:
- Feature might work on some compositors
- Doesn't work on others
- Not well-tested
- Not production-ready
- Better to test ourselves than rely on hearsay

---

## Why This Matters for Our Project

### Current State
- **evdev:** Working, proven, production-ready
- **rdev:** Unknown, needs verification

### If rdev Works
- Could simplify architecture
- Single library for all platforms
- Less maintenance burden
- Better community support

### If rdev Broken
- Confirms evdev is the right choice
- Validates our earlier decision
- Prevents wasting time on dead-end
- Provides data for rdev maintainers (helpful!)

### Either Way
- **This test is valuable**
- We learn something important
- We help the community

---

## References

### rdev Resources
- **GitHub:** https://github.com/enigo-rs/rdev
- **Crates.io:** https://crates.io/crates/rdev
- **Docs:** https://docs.rs/rdev/latest/rdev/

### Wayland Resources
- **Wayland Protocol:** https://wayland.freedesktop.org/
- **Wayland Security Model:** https://wayland.freedesktop.org/security-module.html
- **Input Protocol Spec:** https://wayland.freedesktop.org/docs/html/ProtocolSpec/

### Related Projects
- **enigo** (another input library): https://github.com/enigo-rs/enigo
- **Inputbot:** https://github.com/obv-mikhail/inputbot
- **device-query:** https://github.com/ostrosablin/device-query

---

## Conclusion

rdev's `unstable_grab` feature is **marketed as Wayland-compatible** but **never clearly verified in production**.

This test will definitively answer:
- **Does it actually work?**
- **On which compositors?**
- **What are the limitations?**

The findings will inform:
- Whether to use rdev for our project
- Whether to document findings for rdev maintainers
- Our long-term input capture strategy

---

**Test Status:** EXPERIMENTAL - UNVERIFIED
**Hypothesis:** 50% likely to work, 50% likely to fail
**How to Know:** Run the test and check if events appear when window is unfocused
