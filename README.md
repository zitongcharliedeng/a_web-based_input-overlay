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
```

### Development

**Launch Electron overlay (recommended):**

```powershell
.\forDevelopment_buildAndLaunchWebapp.ps1
```

This script will:
1. Install webApp dependencies
2. Compile TypeScript
3. Install Electron wrapper dependencies
4. Launch Electron with DevTools

**Launch web version (browser-based testing):**

```powershell
.\forDevelopment_buildAndLaunchWebsite.ps1
```

Opens http://localhost:8080 in your browser.

**Launch in readonly/overlay mode (streaming use):**

```powershell
.\forDevelopment_launchInReadonlyMode.ps1
```

Launches Electron with click-through enabled. Overlay stays on top, no editing UI. Close with Alt+F4.

### Project Structure

```
webApp/                          # Web application code
  ├── browserInputListeners/     # Pure input system (keyboard, mouse, gamepad)
  ├── browserInputOverlayView/   # Main overlay application
  │   ├── objects/               # Visual components (LinearInputIndicator, etc.)
  │   ├── actions/               # Scene modifiers (PropertyEdit)
  │   ├── _helpers/              # Utilities (Vector, draw helpers)
  │   └── _compiled/             # TypeScript output (gitignored)
  ├── index.html
  ├── package.json               # Web dependencies (TypeScript, http-server)
  └── tsconfig.json

wrapWebAppAsStandaloneProgram/   # Electron wrapper
  ├── main.js                    # Electron main process
  ├── preload.js                 # Secure IPC bridge
  └── package.json               # Electron dependencies

forDevelopment_build.ps1                    # Shared build script (DRY)
forDevelopment_buildAndLaunchWebapp.ps1     # Build & launch Electron (dev mode)
forDevelopment_buildAndLaunchWebsite.ps1    # Build & launch web version
forDevelopment_launchInReadonlyMode.ps1     # Build & launch overlay mode
```

See [CLAUDE.md](CLAUDE.md) for full technical details and architecture.

## Platform Support

Developed and tested on **Windows 10/11**. Should work on macOS and Linux (GNOME, KDE, Hyprland) with mature Wayland/X11 compositors.

## License

MIT. Inspired by [DarrenVs/analog_keyboard_overlay](https://github.com/DarrenVs/analog_keyboard_overlay).
