# Quick Start: 30-Second Test

## One-Liner (NixOS)

```bash
cd experiments/tauri-rdev-grab && nix-shell shell.nix --run "./run.sh"
```

## Manual (Any Linux)

```bash
cd experiments/tauri-rdev-grab
cargo build --release
RUST_LOG=info ./target/release/tauri-rdev-test
```

## What to Do

1. **Window is focused** → Type some keys, move mouse
   - Should see events printed
   - This is normal

2. **Click outside window** → Window loses focus
   - **CRITICAL MOMENT**
   - Keep typing, moving mouse, clicking

3. **Check output:**
   - **Still seeing events?** → rdev WORKS ✓
   - **No events now?** → rdev BROKEN ✗

## Expected Output (Working)

```
[Event 1] KEY PRESS: KeyW
[Event 2] KEY RELEASE: KeyW
[Event 3] MOUSE MOVE: (1280, 720)
[Event 4] KEY PRESS: KeyA        ← These appear while unfocused
[Event 5] KEY RELEASE: KeyA
```

## Expected Output (Broken)

```
[Event 1] KEY PRESS: KeyW
[Event 2] KEY RELEASE: KeyW
[Event 3] MOUSE MOVE: (1280, 720)
← Window unfocused - NO MORE EVENTS
```

## Prerequisites

```bash
# Must be on Wayland:
echo $XDG_SESSION_TYPE  # Should say: wayland

# Must be in input group:
groups | grep input     # Should show: input

# If not:
sudo usermod -aG input $USER
# Then log out completely and log back in
```

## Troubleshooting

| Error | Fix |
|-------|-----|
| `Permission denied` | Run: `sudo usermod -aG input $USER` then log out/in |
| `command not found: cargo` | Install Rust: `curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs \| sh` |
| `XDG_SESSION_TYPE is X11` | Switch to Wayland in login screen, log in again |
| `No input devices` | Run: `sudo usermod -aG input $USER` and log out/in |

## Results

### Working (✓)
rdev::grab() captures input globally on Wayland.
→ Could replace our evdev implementation
→ Test other platforms next
→ Consider using rdev everywhere

### Broken (✗)
rdev::grab() only captures focused window input.
→ Keep using evdev (already proven)
→ Use uiohook-napi for Windows/macOS
→ Document findings for rdev maintainers

## File Reference

- `README.md` - Full documentation
- `SETUP.md` - Detailed setup instructions
- `TEST_RESULTS.md` - Results template
- `COMPARISON.md` - rdev vs evdev analysis
- `RDEV_INVESTIGATION.md` - Technical deep dive
- `src/main.rs` - Test implementation

## Time Required

- **Setup (first time):** 5-10 minutes
- **Build:** 2-5 minutes
- **Test:** 1-2 minutes
- **Total:** ~10-15 minutes first time, ~1 minute after

## Next Steps

1. Run test
2. Document results in `TEST_RESULTS.md`
3. Commit: `git add . && git commit -m "test: rdev::grab() Wayland results - [WORKS|BROKEN]"`
4. If WORKS: Plan integration with main project
5. If BROKEN: Continue with evdev strategy

---

**Questions?** See `SETUP.md` for detailed troubleshooting.
