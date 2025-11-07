# Tauri Setup Guide

Quick reference for building and running the Tauri overlay.

## Prerequisites

**Linux (NixOS):**
```bash
nix-shell shell-tauri.nix
```

**Linux (Other):**
```bash
# Install Rust
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

# Install system dependencies
sudo apt install libwebkit2gtk-4.1-dev libgtk-3-dev libevdev-dev
```

**Permissions (Linux only):**
```bash
sudo usermod -aG input $USER
# Log out and back in
```

## Building

```bash
cd src-tauri
cargo build
```

## Running

```bash
# Method 1: Via script
./run-tauri.sh

# Method 2: Direct cargo
cd src-tauri && cargo run

# Method 3: With Nix
nix-shell shell-tauri.nix --run "./run-tauri.sh"
```

## Architecture

```
┌─────────────────────────┐
│   Frontend (JS/TS)      │
│   browserInputOverlay   │  90% code reuse
└───────────┬─────────────┘
            │ Tauri IPC
┌───────────▼─────────────┐
│  tauri-preload.js       │  API compatibility layer
│  (Electron API compat)  │
└───────────┬─────────────┘
            │
┌───────────▼─────────────┐
│   Rust Backend          │
│   - rdev (input)        │  New implementation
│   - Tauri (window)      │
└─────────────────────────┘
```

## Key Features

- **Global Input Capture:** rdev library (cross-platform)
- **Transparent Window:** Always-on-top overlay
- **API Compatibility:** Same interface as Electron version
- **Code Reuse:** 90% of frontend unchanged

## Testing

```bash
# Build and run
cargo run

# Press W/A/S/D → should see key indicators
# Move mouse → should see mouse trails
# Works even when window is unfocused
```

## Troubleshooting

**Build fails:**
- Ensure internet access for crates.io
- Check system dependencies are installed

**No input captured:**
- Verify you're in `input` group: `groups | grep input`
- Log out and back in after adding to group

**Window not transparent:**
- Check compositor is running
- May require compositor-specific configuration

## Comparison: Electron vs Tauri

| Aspect | Electron | Tauri |
|--------|----------|-------|
| Binary Size | 150 MB | 15 MB |
| Memory | 200-500 MB | 50-150 MB |
| Startup | 2-5s | <1s |
| Input Library | evdev (JS) | rdev (Rust) |
| Platforms | Linux only | Linux/Win/Mac |

## Next Steps

- Test on multiple compositors (GNOME, KDE, Hyprland)
- Cross-platform builds (Windows, macOS)
- Performance benchmarking
- Feature parity checklist

See `TAURI_MIGRATION_SUMMARY.md` for complete details.
