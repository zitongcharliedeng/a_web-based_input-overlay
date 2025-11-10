# Web-Based Input Overlay

Transparent overlay for streamers. Shows input visualization, camera, audio, chat in an always-on-top window.

## Quick Start

### Windows Setup

```powershell
# Install Node.js from nodejs.org and Git from git-scm.com

git clone -b claude/read-the-l-011CUyxYQP7k5L551y7LxcUT https://github.com/zitongcharliedeng/a_web-based_input-overlay.git
cd a_web-based_input-overlay
npm install
```

### Windows (Run Tests)

```powershell
.\run-windows.ps1
```

Launches web version (browser) + Electron version. Test if input works when unfocused (Alt+Tab away and press WASD).

### Linux (NixOS)

```bash
./run.sh              # Interactive mode
./run-x11.sh          # XWayland mode
```

Compile TypeScript: `nix-shell -p nodejs --run "npx tsc"`

## Platform Compatibility

### Tested

**Linux (NixOS):**
- Transparency: ✅ Works (niri, COSMIC)
- Always-on-top: ⚠️ Manual on niri, broken on COSMIC
- Click-through: ❌ Broken on both

**Why broken:** COSMIC and niri are very new compositors still implementing window management.

### Expected to Work (Untested)

- **Windows 10/11:** DWM has mature transparency support
- **macOS 11+:** NSWindow transparency well-supported
- **Linux (GNOME/KDE/Hyprland):** Standard Wayland protocols

## Testing Needed

Does Electron capture DOM events when unfocused on Windows? If yes, we don't need `uiohook-napi`. See [TESTING.md](TESTING.md).

## Architecture

- TypeScript + Electron for cross-platform transparency
- Web version (browser) for quick testing
- `uiohook-napi` for global input hooks (if needed)

See [CLAUDE.md](CLAUDE.md) for full technical details.

## License

MIT. Inspired by [DarrenVs/analog_keyboard_overlay](https://github.com/DarrenVs/analog_keyboard_overlay).
