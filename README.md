# Web-Based Input Overlay

A transparent overlay platform for streamers built with TypeScript and web technologies, wrapping in Electron for native transparency.

## Goal

Make streaming overlays that streamers can actually see while they stream, not just viewer-only graphics. A customizable HUD showing input visualization, camera feeds, audio levels, chat, and more in a transparent always-on-top window.

## Development

### Compile TypeScript
```bash
nix-shell -p nodejs --run "npx tsc"
```

### Running
Open `index.html` in browser:
- `index.html` - Default layout
- `index.html#e2e-test` - Test scene

See [CLAUDE.md](CLAUDE.md) for full technical details, architecture, and roadmap.

---

Originally forked from [DarrenVs/analog_keyboard_overlay](https://github.com/DarrenVs/analog_keyboard_overlay) as a baseline for building my own transparent input overlay platform with Electron and multimedia streaming features.

## License

MIT
