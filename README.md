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

**Single unified script:**

```powershell
.\SourceCode\_devTools\buildForWindowsDevelopment.ps1
```

Interactive menu with 4 options:
1. Build only
2. Build and launch website version
3. Build and launch webapp (interactive mode)
4. Build and launch webapp (clickthrough-readonly mode)

### Project Structure

```
SourceCode/
  ├── _devTools/                 # Build configs and scripts
  │   ├── tsconfig.json          # Base TypeScript config
  │   ├── tsconfig.webapp.json   # WebApp config (ES2022 modules)
  │   ├── tsconfig.desktop.json  # Desktop config (CommonJS)
  │   ├── .eslintrc.cjs          # ESLint config
  │   └── buildForWindowsDevelopment.ps1
  │
  ├── WebApp/                    # Web application (browser + Electron renderer)
  │   ├── viewWhichRendersConfigurationAndUi/
  │   │   ├── canvasRenderer/    # Rendering engine
  │   │   ├── inputReaders/      # Input listeners (keyboard, mouse, gamepad)
  │   │   └── uiComponents/      # UI (PropertyEdit, toast)
  │   ├── modelToSaveCustomConfigurationLocally/  # Config management
  │   ├── _helpers/              # Utilities (Vector, version)
  │   └── index.html
  │
  └── DesktopWrappedWebapp/      # Electron wrapper (main process)
      ├── main.ts                # Window management, native input hooks
      └── preload.ts             # IPC bridge

package.json                     # Root dependencies (all merged)
.gitignore                       # Ignores: **/*.js, **/*.js.map, **/*.d.ts
```

All `.js` files are gitignored build artifacts. TypeScript compiles to sibling `.js` files.

See [CLAUDE.md](CLAUDE.md) for full technical details and architecture.

## Platform Support

Developed and tested on **Windows 10/11**. Should work on macOS and Linux (GNOME, KDE, Hyprland) with mature Wayland/X11 compositors.

## License

MIT. Inspired by [DarrenVs/analog_keyboard_overlay](https://github.com/DarrenVs/analog_keyboard_overlay).
