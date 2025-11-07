# Build Guide

## Prerequisites

Development is managed via `nix-shell`. The `shell.nix` file provides all required tools:
- Node.js (frontend)
- Rust/Cargo (backend)
- TypeScript compiler
- Development utilities

Enter the development environment:
```bash
nix-shell
```

## First-Time Setup

```bash
# Install npm dependencies
npm install
```

This pulls in Tauri CLI and other frontend tooling.

## Development

### Run Tauri Dev Server (Desktop App)

```bash
# Full hot-reload development experience
npm run dev
```

This will:
1. Start Vite dev server on `http://localhost:5173`
2. Launch Tauri with the overlay window
3. Hot-reload both frontend and backend

### Build for Release

```bash
# Build and package Tauri application
npm run build
```

Outputs go to:
- `src-tauri/target/release/` - Compiled Rust binary
- Installer/app bundle in `src-tauri/target/release/bundle/`

### Web-Only Version (GitHub Pages)

The same source code can be built for web without Tauri:

```bash
# Build frontend only (no Tauri backend)
npx vite build
```

Output in `dist/` can be deployed to GitHub Pages.

The browser listeners gracefully fallback when Tauri API isn't available.

## Architecture

### Tauri + Rust Backend
- `src-tauri/Cargo.toml` - Rust dependencies (including `rdev`)
- `src-tauri/src/main.rs` - Tauri app entry point
- `src-tauri/tauri.conf.json` - Window config (transparency, always-on-top)

### Frontend
- `index.html` - Entry point
- `browserInputOverlayView/` - Main overlay application
- `browserInputListeners/` - Input capture (Tauri IPC when available, browser fallback otherwise)

### Build Outputs
- **Tauri app**: Platform-specific executable with transparency and always-on-top
- **Web version**: Pure HTML/CSS/JS, works in any browser, no transparency

## Troubleshooting

### "tauri: command not found"
Make sure you're in `nix-shell`:
```bash
nix-shell
npm run dev
```

### Cargo compilation errors
Ensure Rust is available in nix-shell and dependencies are clean:
```bash
nix-shell
cargo clean
npm run dev
```

### Port 5173 already in use
Vite dev server uses port 5173. If busy, you can change it in `vite.config.ts` or kill the conflicting process:
```bash
lsof -ti:5173 | xargs kill -9
```

## Next Steps

After successful build, test:
1. Global input capture (keyboard/mouse) in overlay window
2. Window transparency (should show desktop behind)
3. Always-on-top behavior
4. Web version at `http://localhost:5173` (no global input, browser-only)
