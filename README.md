# Web-Based Input Overlay

> The Ultimate Transparent Streamer Overlay - Because streamers should see their own overlays too!

## What Makes This Different

**Traditional overlays:** Only visible in OBS output (viewers see it, streamer doesn't)
**This overlay:** Transparent window that's visible to BOTH the streamer AND viewers in real-time

Think of it as a HUD for streamers - displaying input visualization (keyboard, mouse, gamepad), camera feeds, audio levels, and web embeds (chat, GIFs, etc.) in a customizable transparent overlay.

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

## Platform Support

Developed and tested on **Windows 10/11**. Should work on macOS and Linux (GNOME, KDE, Hyprland) with mature Wayland/X11 compositors.

## License

MIT. Inspired by [DarrenVs/analog_keyboard_overlay](https://github.com/DarrenVs/analog_keyboard_overlay).
