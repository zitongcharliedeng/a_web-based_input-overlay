# Raylib Branch - Quick Start

## Build Status

⚠️ **Note:** This code is ready but hasn't been compiled yet due to Docker environment limitations. Build it on your NixOS system.

## One-Command Start

```bash
nix-shell shell-raylib.nix --run "./run-raylib.sh"
```

## What This Branch Contains

A minimal working Raylib + rdev overlay that demonstrates:

1. **Transparent overlay window** (1920x1080, undecorated)
2. **W key visualization** (green when pressed, gray when idle)
3. **Global input capture** (works when window unfocused)
4. **60 FPS rendering** with counter
5. **Native Rust performance** (low memory/CPU usage)

## File Structure

```
Cargo.toml              # Rust dependencies (raylib + rdev)
shell-raylib.nix        # NixOS development environment
run-raylib.sh           # Build and run script
src/
  ├── main.rs           # Entry point + render loop
  ├── input.rs          # rdev global input listener
  └── overlay.rs        # Raylib rendering logic
```

## Expected Performance

Based on architecture (actual benchmarks after first build):

- **Memory:** 20-50 MB (vs 200-500 MB Electron)
- **CPU (idle):** <1% (vs 3-5% Electron)
- **Binary Size:** 5-10 MB (vs 100-200 MB Electron)
- **Startup Time:** ~100ms (vs 2-3s Electron)

## Prerequisites

1. **User in input group** (for rdev):
   ```bash
   sudo usermod -aG input $USER
   # Logout and login required
   ```

2. **Compositor running** (for transparency):
   - niri, GNOME, KDE, picom, etc.

## First Build

```bash
# Enter Nix environment
nix-shell shell-raylib.nix

# Build (first time will download dependencies - may take 2-3 minutes)
cargo build --release

# Run
./target/release/input-overlay-raylib
```

## Testing

**Expected behavior:**
1. Window appears (transparent, 1920x1080)
2. W key rectangle visible at bottom (gray)
3. FPS counter top-left (should show ~60)
4. Press W key → rectangle turns green
5. Release W → rectangle turns gray
6. **Works even when window unfocused** (global capture)

**Exit:**
- Press ESC or Ctrl+C

## Troubleshooting

**Build fails with "raylib not found":**
- Make sure you're in `nix-shell shell-raylib.nix`

**"Permission denied" at runtime:**
- Add yourself to input group (see prerequisites)

**Window not transparent:**
- Make sure compositor is running
- Check: `ps aux | grep -i compositor`

**W key not detected:**
- Check console for "[Input] W key PRESSED" messages
- Verify: `groups | grep input`

## Next Steps

After confirming this works:

1. Add WASD key cluster (extend from W to all 4 keys)
2. Add gamepad thumbstick visualization
3. Add mouse velocity tracking
4. Add configuration system
5. Benchmark vs Electron version

## Documentation

- **Full Setup Guide:** RAYLIB_SETUP.md
- **Architecture Details:** See RAYLIB_SETUP.md > Architecture section
- **Raylib Docs:** https://www.raylib.com/
- **rdev Docs:** https://docs.rs/rdev/

## Questions?

See RAYLIB_SETUP.md for comprehensive documentation including:
- Architecture diagrams
- Platform support matrix
- Performance comparison with Electron
- Development tips
- Troubleshooting guide
