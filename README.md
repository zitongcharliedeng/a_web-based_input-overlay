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
/                                # Root: Documentation only
├── README.md
├── CLAUDE.md
├── .gitignore
└── SourceCode/                  # ALL source code related files
    │
    ├── _devTools/               # Build configs and scripts
    │   ├── node_modules/        # Installed dependencies (gitignored)
    │   ├── package.json         # Dependencies and npm scripts
    │   ├── package-lock.json
    │   ├── tsconfig.json        # Base TypeScript config
    │   ├── tsconfig.webapp.json # WebApp (ES2022 modules)
    │   ├── tsconfig.desktop.json # Desktop (CommonJS)
    │   ├── .eslintrc.cjs
    │   └── buildForWindowsDevelopment.ps1
    │
    ├── WebApp/                  # Web application (browser + Electron renderer)
    │   ├── viewWhichRendersConfigurationAndUi/
    │   │   ├── canvasRenderer/  # Rendering engine
    │   │   ├── inputReaders/    # Input listeners
    │   │   └── uiComponents/    # UI components
    │   ├── modelToSaveCustomConfigurationLocally/
    │   ├── _helpers/
    │   └── index.html
    │
    └── DesktopWrappedWebapp/    # Electron wrapper (main process)
        ├── main.ts              # Window management
        └── preload.ts           # IPC bridge
```

All `.js`, `.d.ts`, `.js.map` files are gitignored build artifacts.

See [CLAUDE.md](CLAUDE.md) for full technical details and architecture.

## Platform Support

Developed and tested on **Windows 10/11**. Should work on macOS and Linux (GNOME, KDE, Hyprland) with mature Wayland/X11 compositors.

## License

MIT. Inspired by [DarrenVs/analog_keyboard_overlay](https://github.com/DarrenVs/analog_keyboard_overlay).
