# Web-Based Input Overlay

A transparent overlay platform for streamers built with TypeScript and web technologies, wrapping in Electron for native transparency.

## Goal

Make streaming overlays that streamers can actually see while they stream, not just viewer-only graphics. A customizable HUD showing input visualization, camera feeds, audio levels, chat, and more in a transparent always-on-top window.

## Development

### Compile TypeScript
```bash
nix-shell -p nodejs --run "npx tsc"
```

### Running (Electron)
```bash
./run-nix.sh                      # Interactive mode (Wayland native)
./run-nix-clickthrough.sh         # Overlay mode with click-through attempt (Wayland)
./run-nix-xwayland.sh             # Interactive mode (XWayland)
./run-nix-xwayland-clickthrough.sh # Overlay mode with click-through attempt (XWayland)
./run-nix-dev.sh                  # Development mode with DevTools
./run-nix-frame.sh                # Debug mode with window frame
```

### Platform Compatibility

**Electron APIs used:** Standard cross-platform `BaseWindow`, `transparent: true`, `setAlwaysOnTop()`, and `setIgnoreMouseEvents()`. These APIs are OS-agnostic and widely supported.

#### Linux Compositors (NixOS - Tested)

| Feature | COSMIC Wayland | COSMIC XWayland | niri Wayland | niri XWayland |
|---------|----------------|-----------------|--------------|---------------|
| **Transparency** | ✅ Works | ✅ Works | ✅ Works | ✅ Works |
| **Always-on-top** | ❌ Broken | ❌ Broken | ⚠️ Manual | ❌ Broken |
| **Click-through** | ❌ Broken | ❌ Broken | ❌ Broken | ❌ Broken |
| **Interaction** | ✅ Works | ✅ Works | ✅ Works | ✅ Works |
| **Animations** | ✅ 60fps | ✅ 60fps | ✅ 60fps | ✅ 60fps |

**COSMIC notes:**
- Always-on-top and click-through don't work (very new desktop environment)
- Both Wayland and XWayland modes have same limitations

**niri notes:**
- Always-on-top requires manual `niri msg action set-floating` (Wayland only)
- Click-through doesn't work in either mode
- XWayland mode: niri's floating command doesn't work

#### Other Platforms (Expected to Work - Untested)

| Platform | Transparency | Always-on-top | Click-through | Notes |
|----------|--------------|---------------|---------------|-------|
| **Windows 10/11** | ✅ Expected | ✅ Expected | ✅ Expected | DWM has mature layered window support |
| **macOS 11+** | ✅ Expected | ✅ Expected | ✅ Expected | NSWindow transparency well-supported |
| **Linux (GNOME)** | ✅ Expected | ✅ Expected | ⚠️ May vary | Compositor-dependent |
| **Linux (KDE Plasma)** | ✅ Expected | ✅ Expected | ⚠️ May vary | Compositor-dependent |
| **Linux (Hyprland)** | ✅ Expected | ✅ Expected | ⚠️ May vary | Compositor-dependent |

**Why we expect these to work:** Using standard Electron APIs that are widely used in production apps (Discord overlays, OBS Browser Source, etc.). Issues found on COSMIC/niri are due to these being very new/niche compositors still implementing window management features.

**Testing contributions welcome!** If you test on other platforms, please report results via GitHub Issues.

See [CLAUDE.md](CLAUDE.md) for full technical details, architecture, and roadmap.

---

Originally forked from [DarrenVs/analog_keyboard_overlay](https://github.com/DarrenVs/analog_keyboard_overlay) as a baseline for building my own transparent input overlay platform with Electron and multimedia streaming features.

## License

MIT
