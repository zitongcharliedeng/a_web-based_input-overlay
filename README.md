# Web-Based Input Overlay

Transparent overlay for streamers. Shows input visualization (keyboard, mouse, gamepad), camera, audio, and chat in an always-on-top window.

## For End Users

**Download the latest release from the [Releases](https://github.com/zitongcharliedeng/a_web-based_input-overlay/releases) tab.**

Extract and run the executable. No installation required.

## For Developers

### Prerequisites

- [Node.js](https://nodejs.org/) (18+)
- [Git](https://git-scm.com/)
- Windows 10/11 (primary development platform)

### Setup

```powershell
git clone https://github.com/zitongcharliedeng/a_web-based_input-overlay.git
cd a_web-based_input-overlay
npm install
```

### Development

**Run the overlay (with auto-compile and DevTools):**

```powershell
.\build-and-run-windows.ps1
```

This script will:
1. Install dependencies (if needed)
2. Compile TypeScript
3. Launch Electron with DevTools

**Manual TypeScript compilation:**

```powershell
npx tsc
```

**Run without rebuild:**

```powershell
npm run dev:win
```

### Project Structure

```
browserInputListeners/           # Pure input system (keyboard, mouse, gamepad)
browserInputOverlayView/         # Main overlay application
  ├── objects/                   # Visual components (LinearInputIndicator, etc.)
  ├── actions/                   # Scene modifiers (PropertyEdit)
  ├── _helpers/                  # Utilities (Vector, draw helpers)
  └── _compiled/                 # TypeScript output (gitignored)
```

See [CLAUDE.md](CLAUDE.md) for full technical details and architecture.

## Platform Support

Developed and tested on **Windows 10/11**. Should work on macOS and Linux (GNOME, KDE, Hyprland) with mature Wayland/X11 compositors.

## License

MIT. Inspired by [DarrenVs/analog_keyboard_overlay](https://github.com/DarrenVs/analog_keyboard_overlay).
