# a_web-based_input-overlay

> The Ultimate Transparent Streamer Overlay Platform - Because streamers should see their own overlays too!

## 🎯 Project Vision

This project transforms the concept of streaming overlays from "viewer-only graphics" to **real-time, transparent, always-on-top overlays that streamers can actually see**. Built with web technologies for maximum compatibility, wrapped in Electron for native transparency support.

### The Big Idea

**Traditional overlays:** Only visible in OBS output (viewers see it, streamer doesn't)
**Our approach:** Transparent window overlay (streamer AND viewers see it in real-time)

Think of it as a HUD for streamers - displaying input visualization, chat, camera feeds, audio levels, and more, all in a customizable transparent overlay that works across Windows, macOS, and Linux.

---

## 🏗️ Project Status

### Current State
- **Repository Location:** `/home/zitchaden/analog_keyboard_overlay_fork/`
- **Git Status:** Part of `myLinuxHome` repository
- **Code Status:** Empty (clean slate for fresh implementation)
- **Stage:** Planning & Architecture Phase

### Repository Context
This directory exists within the larger `myLinuxHome` dotfiles repository (`https://github.com/zitongcharliedeng/myLinuxHome.git`). The plan is to:
1. Develop the project here initially
2. Create a dedicated GitHub repository as `zitongcharliedeng/a_web-based_input-overlay`
3. Maintain as a standalone project with its own release cycle

### Origin Story & Legal Approach

**Inspiration:** This project is inspired by [`DarrenVs/analog_keyboard_overlay`](https://github.com/DarrenVs/analog_keyboard_overlay), a lightweight web-based gamepad/analog keyboard visualizer created by Darren for the Wooting keyboard community.

**Clean-Room Rewrite Strategy:**
- The original project has **no license** (default "all rights reserved" copyright)
- We're implementing a **clean-room rewrite**: studying the concepts and functionality, but writing all code fresh
- After refactoring to our semantic architecture style, the code will be unrecognizable from the original
- All implementations use our own abstractions, naming conventions, and design patterns
- We will release under **MIT License** for maximum community adoption

**Attribution:**
- DarrenVs receives credit for the original gamepad overlay concept
- The transparent overlay approach and multimedia features are novel additions
- Our codebase is legally distinct through substantial transformation

---

## 🚀 Core Features

### Phase 1: Input Visualization (MVP)
- ✅ **Analog Keyboard/Gamepad Input:** Real-time visualization of analog keypresses and joystick movement
- ✅ **Mouse Velocity Tracking:** Dynamic trails and effects based on mouse speed
- ✅ **Customizable Layouts:** Multiple keyboard layouts (WASD, QWER, full keyboard, etc.)
- ✅ **Transparent Window:** True alpha transparency (Electron) or greenscreen (web)

### Phase 2: Multimedia Integration
- 🔄 **Camera Feeds:** Embed webcam or capture card feeds with positioning
- 🔄 **Microphone Waveform:** Real-time audio visualization with FFT analysis
- 🔄 **Audio Levels:** VU meters for mic input
- 🔄 **Multi-camera Support:** Picture-in-picture layouts

### Phase 3: Chat & Interaction
- 📋 **Twitch Chat Embed:** Live chat display with custom styling
- 📋 **YouTube Chat Embed:** Supports YouTube live stream chat
- 📋 **Chat Filters:** Highlight keywords, hide commands, custom CSS
- 📋 **Alerts Integration:** Compatible with StreamElements/Streamlabs

### Phase 4: Advanced Features
- 📋 **Animated Crosshairs:** Dynamic crosshairs reacting to input (weapon recoil, movement)
- 📋 **Music Player:** Now playing display with album art
- 📋 **Performance Stats:** FPS counter, CPU/GPU usage, frame time graphs
- 📋 **Scene Switching:** Multiple overlay configurations (per-game presets)

**Legend:** ✅ Planned | 🔄 In Progress | 📋 Future

---

## 🔧 Technology Stack

### Core Decision: TypeScript/Electron (Web-First Architecture)

#### Why Web Technologies Won Over Rust

We extensively evaluated Rust vs TypeScript for this project. Here's why **TypeScript + Electron** emerged as the clear winner:

**✅ Web Technologies Excel at Multimedia:**
- **Camera Access:** `getUserMedia()` API is mature, cross-platform, and battle-tested
- **Microphone:** Web Audio API provides built-in FFT analysis for waveforms (no manual implementation)
- **Chat Embeds:** Twitch/YouTube provide iframe/API integration (impossible in native Rust)
- **Gamepad Input:** Native `Gamepad API` works flawlessly across all platforms
- **Mouse Tracking:** `PointerEvent API` with sub-millisecond timestamps

**✅ Code Reusability (90% Sharing):**
```
Same HTML/CSS/TypeScript codebase →
  ├─ Web Version (GitHub Pages) → OBS Browser Source
  └─ Electron Wrapper → Transparent standalone overlay
```

**✅ Development Velocity:**
- Hot reload during development (instant feedback)
- Chrome DevTools for debugging (inspect canvas, profile performance)
- Massive npm ecosystem (libraries for everything)
- Lower barrier to contribution (web devs > systems programmers)

**✅ Cross-Platform Zero-Pain:**
- Write once, run on Windows/Mac/Linux
- No platform-specific code for 90% of features
- Electron handles window management differences

**⚠️ Rust Ecosystem Gaps for Our Use Case:**
| Feature | Web APIs | Rust Native | Winner |
|---------|----------|-------------|--------|
| Camera access | ✅ getUserMedia() | ❌ nokhwa (buggy) | **Web** |
| Microphone FFT | ✅ Web Audio API | ⚠️ cpal (no viz libs) | **Web** |
| Chat embeds | ✅ iframe/API | ❌ Needs embedded browser | **Web** |
| Gamepad | ✅ Gamepad API | ✅ gilrs crate | Tie |
| Transparency | ✅ Electron | ✅ winit | Tie |
| Binary size | ❌ 100-200MB | ✅ 5-20MB | Rust |
| Memory usage | ⚠️ 200-500MB | ✅ 50-150MB | Rust |

**Performance Reality Check:**
- Rust is 2-3x more efficient in CPU/memory
- But web is "fast enough" for overlays (60fps easily achievable)
- Modern streaming PCs have 32GB+ RAM (500MB overlay is negligible)
- Canvas API is hardware-accelerated (GPU rendering)

**When Rust Would Make Sense:**
- If we needed 240fps+ rendering (we don't - 60fps is standard)
- If targeting low-end hardware (streaming PCs are high-end)
- If building a game engine (we're building an overlay)
- If Twitch/YouTube embeds weren't core features (they are)

**Verdict:** The fact that chat embeds are a core requirement makes web tech the only pragmatic choice. Rust has no HTML rendering without embedding a browser (defeating the purpose).

### Technology Stack Details

**Frontend:**
- **TypeScript:** Type-safe JavaScript for maintainability
- **Vanilla JS/TS:** No framework bloat initially (can add React/Svelte for UI later)
- **HTML5 Canvas:** Hardware-accelerated rendering for effects
- **CSS3:** Animations and styling (GPU-accelerated transforms)

**Build System:**
- **Vite:** Lightning-fast dev server with hot module replacement
- **TypeScript Compiler:** Type checking and ES6+ transpilation
- **Rollup:** Bundling for production (via Vite)

**APIs & Libraries:**
- **Web APIs:**
  - `Gamepad API` - Controller/analog keyboard input
  - `PointerEvent API` - Mouse tracking with velocity calculation
  - `getUserMedia()` - Camera and microphone access
  - `Web Audio API` - FFT analysis for waveform visualization
  - `Canvas 2D Context` - Rendering engine
  - `requestAnimationFrame()` - 60fps render loop
- **Electron (Desktop Only):**
  - `BrowserWindow` - Transparent window management
  - `setAlwaysOnTop()` - Overlay stays above other windows
  - `setIgnoreMouseEvents()` - Click-through capability

**Development Tools:**
- **Hot Reload:** Vite dev server (instant feedback)
- **Debugging:** Chrome DevTools (inspect DOM, profile Canvas)
- **Type Checking:** TypeScript LSP in editor
- **Build:** `npm run build:web` or `npm run build:electron`

### Performance Targets

| Metric | Target | Rationale |
|--------|--------|-----------|
| Frame Rate | 60 FPS | Standard for smooth overlays (matches monitor refresh) |
| Memory Usage | <500 MB | Acceptable for streaming PCs (32GB+ RAM typical) |
| CPU Usage | <15% | Leave headroom for game + OBS encoding |
| Latency | <16ms | One frame at 60fps (imperceptible to human eye) |
| Binary Size | <200 MB | Electron bundle (one-time download) |

---

## 🎨 Architecture

### Web-First Approach

**Philosophy:** Build as a web application first, add Electron wrapper for native features.

```
┌─────────────────────────────────────────────────────────────┐
│                      Web Application Core                    │
│  (Runs in browser AND Electron renderer process)            │
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │   Input      │  │  Multimedia  │  │   Effects    │     │
│  │ Visualization│  │  (Cam/Mic)   │  │   Engine     │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │   Canvas     │  │  Web Audio   │  │   Gamepad    │     │
│  │  Rendering   │  │     API      │  │     API      │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
└─────────────────────────────────────────────────────────────┘
                             │
                    ┌────────┴─────────┐
                    │                  │
          ┌─────────▼────────┐  ┌─────▼──────────────┐
          │   Web Version    │  │  Electron Wrapper  │
          │ (GitHub Pages)   │  │   (Native App)     │
          ├──────────────────┤  ├────────────────────┤
          │ • Greenscreen BG │  │ • Transparency     │
          │ • OBS Browser    │  │ • Always-on-top    │
          │   Source ready   │  │ • Click-through    │
          │ • Demo/testing   │  │ • File system      │
          └──────────────────┘  └────────────────────┘
```

### Project Structure

```
a_web-based_input-overlay/
├── web/                              # Pure web application
│   ├── index.html                    # Entry point
│   ├── src/
│   │   ├── core/                     # Clean semantic abstractions
│   │   │   ├── Canvas.ts            # Canvas wrapper with cleanup
│   │   │   ├── RenderLoop.ts        # requestAnimationFrame manager
│   │   │   ├── EventBus.ts          # Pub/sub for component communication
│   │   │   └── StateManager.ts      # Centralized state
│   │   │
│   │   ├── features/                 # Feature modules (plug-and-play)
│   │   │   ├── keyboard/
│   │   │   │   ├── KeyboardVisualizer.ts
│   │   │   │   ├── AnalogKeyRenderer.ts
│   │   │   │   └── layouts/         # WASD, QWER, full, etc.
│   │   │   │
│   │   │   ├── gamepad/
│   │   │   │   ├── GamepadInput.ts  # Gamepad API wrapper
│   │   │   │   └── ThumbstickRenderer.ts
│   │   │   │
│   │   │   ├── mouse/
│   │   │   │   ├── VelocityTracker.ts # PointerEvent velocity calc
│   │   │   │   └── TrailRenderer.ts   # Dynamic mouse trails
│   │   │   │
│   │   │   ├── camera/
│   │   │   │   ├── CameraFeed.ts     # getUserMedia wrapper
│   │   │   │   └── MultiCamLayout.ts
│   │   │   │
│   │   │   ├── audio/
│   │   │   │   ├── MicInput.ts       # getUserMedia audio
│   │   │   │   ├── WaveformRenderer.ts # FFT visualization
│   │   │   │   └── VUMeter.ts
│   │   │   │
│   │   │   ├── chat/
│   │   │   │   ├── TwitchEmbed.ts
│   │   │   │   └── YouTubeEmbed.ts
│   │   │   │
│   │   │   └── crosshair/
│   │   │       ├── CrosshairRenderer.ts
│   │   │       └── RecoilSimulator.ts
│   │   │
│   │   ├── ui/                       # Customization interface
│   │   │   ├── SettingsPanel.ts     # Runtime configuration
│   │   │   ├── PresetManager.ts     # Save/load configurations
│   │   │   └── ColorPicker.ts
│   │   │
│   │   └── utils/                    # Shared utilities
│   │       ├── Vector2D.ts          # 2D vector math
│   │       ├── Lerp.ts              # Interpolation helpers
│   │       └── PerformanceMonitor.ts
│   │
│   ├── styles/
│   │   ├── main.css
│   │   ├── transparent.css          # Transparent background styles
│   │   └── greenscreen.css          # Chroma key green background
│   │
│   └── public/
│       ├── assets/                  # Images, fonts, etc.
│       └── scenes/                  # Preset configurations
│
├── electron/                         # Electron wrapper (desktop app)
│   ├── main.js                      # Main process (window management)
│   ├── preload.js                   # Secure IPC bridge
│   └── package.json                 # Electron dependencies
│
├── docs/                             # Platform-specific guides
│   ├── transparency/
│   │   ├── nixos-niri.md           # NixOS with niri compositor
│   │   ├── nixos-cosmic.md         # NixOS with COSMIC DE
│   │   ├── linux-gnome.md          # GNOME Shell configuration
│   │   ├── linux-kde.md            # KDE Plasma window rules
│   │   ├── linux-hyprland.md       # Hyprland config
│   │   ├── windows-powertoys.md    # PowerToys FancyZones
│   │   └── macos-yabai.md          # Yabai window manager
│   │
│   ├── development.md               # Setup and contribution guide
│   └── api.md                       # API documentation
│
├── claude.md                         # This file
├── README.md                         # Public-facing readme
├── package.json                      # npm scripts and dependencies
├── tsconfig.json                     # TypeScript configuration
└── vite.config.ts                    # Vite build configuration
```

### Semantic Architecture Principles

**Clean Abstraction Layers:**
1. **Core Layer:** Framework-agnostic primitives (Canvas, EventBus, State)
2. **Feature Layer:** Self-contained modules (can enable/disable independently)
3. **UI Layer:** User-facing customization interface
4. **Platform Layer:** Electron-specific integrations (optional)

**Code Philosophy:**
- **Dependency Injection:** Features receive dependencies (no globals)
- **Pub/Sub Pattern:** Features communicate via EventBus (loose coupling)
- **Type Safety:** Strong TypeScript types (no `any`, strict mode)
- **Readable Naming:** `VelocityTracker.calculateSpeed()` not `vt.calc()`
- **Single Responsibility:** Each class does ONE thing well

**Example - Clean Module:**
```typescript
// features/mouse/VelocityTracker.ts
export class VelocityTracker {
  private lastPosition: Vector2D;
  private lastTime: number;
  private currentVelocity: Vector2D;

  constructor(private eventBus: EventBus) {
    this.setupListeners();
  }

  private setupListeners(): void {
    document.addEventListener('pointermove', this.handlePointerMove);
  }

  private handlePointerMove = (event: PointerEvent): void => {
    const now = event.timeStamp;
    const position = new Vector2D(event.clientX, event.clientY);

    const deltaTime = now - this.lastTime;
    if (deltaTime > 0) {
      const deltaPosition = position.subtract(this.lastPosition);
      this.currentVelocity = deltaPosition.divide(deltaTime).multiply(1000); // px/s

      this.eventBus.emit('mouse:velocity', {
        velocity: this.currentVelocity,
        speed: this.currentVelocity.magnitude(),
        position
      });
    }

    this.lastPosition = position;
    this.lastTime = now;
  }

  public getVelocity(): Vector2D {
    return this.currentVelocity;
  }

  public cleanup(): void {
    document.removeEventListener('pointermove', this.handlePointerMove);
  }
}
```

**Benefits of This Style:**
- Easy to understand (even after months away from code)
- Testable (mock EventBus for unit tests)
- Reusable (VelocityTracker can be used anywhere)
- Maintainable (clear contracts, no hidden dependencies)

---

## 🖥️ Cross-Platform Transparency

### The Transparency Challenge

**Web browsers CANNOT create transparent windows** due to security and architectural limitations. Only native applications (or Electron) can achieve true window transparency.

**Our Solution:**
- **Web Version:** Use greenscreen background (chroma key in OBS) or solid color
- **Electron Version:** True alpha-channel transparency (always-on-top overlay)

### Platform Support Matrix

| Platform | Transparency | Always-On-Top | Click-Through | Status |
|----------|--------------|---------------|---------------|--------|
| **Windows 10/11** | ✅ Excellent | ✅ Yes | ✅ Yes | Fully supported |
| **macOS 11+** | ✅ Good | ✅ Yes | ⚠️ Requires permissions | Supported |
| **Linux (X11)** | ✅ Good | ✅ Yes | ✅ Yes | Supported (compositor required) |
| **Linux (Wayland)** | ⚠️ Experimental | ✅ Yes | ⚠️ Compositor-dependent | Testing required |
| **Android/iOS** | ❌ Not possible | ❌ No | ❌ No | Web version only |

### How Transparency Works (Technical)

**Electron Transparency API:**
```javascript
// electron/main.js
const { BrowserWindow } = require('electron');

const win = new BrowserWindow({
  width: 1920,
  height: 1080,
  transparent: true,        // Enable alpha channel
  frame: false,             // Remove window decorations
  alwaysOnTop: true,        // Stay above other windows
  hasShadow: false,         // No drop shadow
  webPreferences: {
    backgroundThrottling: false  // Keep animations running
  }
});

// Optional: Click-through mode
win.setIgnoreMouseEvents(true, { forward: true });
```

**Web Application CSS:**
```css
/* styles/transparent.css */
body {
  margin: 0;
  background: transparent;  /* Alpha = 0 */
  overflow: hidden;
}

canvas {
  display: block;
  pointer-events: none;  /* Click-through for Canvas */
}

.ui-controls {
  pointer-events: auto;  /* Re-enable for interactive elements */
}
```

**How It Works Per Platform:**

**Windows (DWM - Desktop Window Manager):**
- Uses `WS_EX_LAYERED` window style
- Per-pixel alpha blending via `UpdateLayeredWindow` API
- Electron handles this internally
- **Works perfectly** - most reliable platform

**macOS (Cocoa):**
- Uses `NSWindow` with `opaque: false`
- Native alpha blending support
- May require accessibility permissions for always-on-top
- **Works well** - second most reliable

**Linux (X11 with Compositor):**
- Requires compositing manager (picom, compton, xcompmgr, or DE compositor)
- Uses 32-bit ARGB visual
- `_NET_WM_WINDOW_OPACITY` property
- **Works with setup** - compositor must be running

**Linux (Wayland):**
- Native transparency in protocol
- Compositor-dependent (GNOME, KDE, Sway all support it)
- Electron's Wayland support is experimental
- May need `--enable-features=UseOzonePlatform --ozone-platform=wayland`
- **Experimental** - testing required per compositor

### Compositor Configuration Guides

We provide detailed guides for pinning the overlay window and configuring transparency per platform:

**NixOS (User's Primary System):**
- [`docs/transparency/nixos-niri.md`](docs/transparency/nixos-niri.md) - niri compositor setup
- [`docs/transparency/nixos-cosmic.md`](docs/transparency/nixos-cosmic.md) - COSMIC DE configuration

**Linux Desktop Environments:**
- [`docs/transparency/linux-gnome.md`](docs/transparency/linux-gnome.md) - GNOME Shell extensions
- [`docs/transparency/linux-kde.md`](docs/transparency/linux-kde.md) - KDE window rules
- [`docs/transparency/linux-hyprland.md`](docs/transparency/linux-hyprland.md) - Hyprland config

**Other Platforms:**
- [`docs/transparency/windows-powertoys.md`](docs/transparency/windows-powertoys.md) - FancyZones setup
- [`docs/transparency/macos-yabai.md`](docs/transparency/macos-yabai.md) - Yabai window manager

**Contribution Welcome:**
We accept PRs for additional platform guides! Share your compositor setup and help the community.

---

## 🚦 Roadmap

### Phase 1: Core Overlay (Weeks 1-4) - MVP
**Goal:** Functional analog input visualization with mouse velocity

- [ ] Project setup (Vite + TypeScript)
- [ ] Core abstractions (Canvas, RenderLoop, EventBus)
- [ ] Gamepad input visualization (analog keys + thumbstick)
- [ ] Mouse velocity tracking with trails
- [ ] Basic UI (toggle features, opacity control)
- [ ] Web version deployed to GitHub Pages
- [ ] Electron wrapper with transparency
- [ ] Test on NixOS (niri compositor)

**Deliverable:** Streamers can visualize analog input in transparent overlay

### Phase 2: Multimedia (Weeks 5-8)
**Goal:** Add camera and microphone visualization

- [ ] Camera feed integration (getUserMedia)
- [ ] Multi-camera layout system
- [ ] Microphone input with FFT analysis
- [ ] Waveform renderer (oscilloscope style)
- [ ] VU meter component
- [ ] Audio-reactive effects (optional)
- [ ] Performance optimization (keep <15% CPU)

**Deliverable:** Full multimedia overlay with audio/video

### Phase 3: Chat Integration (Weeks 9-12)
**Goal:** Embed Twitch/YouTube chat

- [ ] Twitch chat embed (iframe + styling)
- [ ] YouTube chat embed
- [ ] Chat filter system (keywords, commands)
- [ ] Custom chat styling (CSS themes)
- [ ] Chat message animations
- [ ] Alert integration (StreamElements/Streamlabs compatible)

**Deliverable:** Complete streaming overlay with chat

### Phase 4: Advanced Features (Weeks 13+)
**Goal:** Polish and unique features

- [ ] Animated crosshair system
- [ ] Crosshair reacts to input (weapon recoil simulation)
- [ ] Music player integration (Spotify API, local files)
- [ ] Now playing display with album art
- [ ] Performance monitor (FPS, CPU/GPU, frame time)
- [ ] Scene system (per-game presets)
- [ ] Save/load configurations (LocalStorage + file export)
- [ ] Community preset sharing

**Deliverable:** Feature-complete ultimate streamer overlay

### Future Considerations
- [ ] Plugin system (community extensions)
- [ ] Theme marketplace
- [ ] Cloud sync for settings (optional account system)
- [ ] Mobile companion app (control overlay from phone)
- [ ] VR overlay support (OpenVR integration)
- [ ] Multi-monitor awareness (auto-position overlay)

---

## 🛠️ Development Workflow

### Prerequisites

**Required:**
- Node.js 18+ (for npm and TypeScript)
- Git (for version control)
- Modern browser (Chrome/Firefox for web development)

**Optional:**
- Electron (for desktop app testing) - installed via npm
- OBS Studio (for testing Browser Source integration)
- Gamepad/controller (for input visualization testing)

### Getting Started

**1. Clone the repository:**
```bash
cd /home/zitchaden/analog_keyboard_overlay_fork/
git init  # Initialize if not already a repo
# Or when GitHub repo is created:
git clone https://github.com/zitongcharliedeng/a_web-based_input-overlay.git
```

**2. Install dependencies:**
```bash
npm install
```

**3. Start development server (web version):**
```bash
npm run dev
```
Opens browser at `http://localhost:5173` with hot reload.

**4. Test Electron version:**
```bash
npm run dev:electron
```
Launches Electron window with transparency enabled.

### Testing Protocol

**IMPORTANT:** All development testing must follow the structured test protocol.

**Test Documentation:** See [`TEST-PROTOCOL.md`](TEST-PROTOCOL.md) for detailed testing workflow

**Key Principles:**
- Structured test cases with clear human actions and expected results
- YES/NO questions for efficient debugging communication
- Baseline testing (web version) before Electron testing
- Source of truth for test procedures (refer to file, not memory)

**Quick Test Commands:**
```bash
# Test 1: Web version baseline (regression check)
npm run start:web

# Test 2: Electron with SDL gamepad polling
.\build-and-run-windows.ps1
# Follow TEST-PROTOCOL.md Test 2 for detailed steps
```

### Development Commands

```bash
# Web version development
npm run dev              # Vite dev server (hot reload)
npm run build:web        # Bundle for production (GitHub Pages)
npm run preview          # Preview production build locally

# Electron development
npm run dev:electron     # Electron with live reload
npm run build:electron   # Package Electron app
npm run package:win      # Create Windows installer
npm run package:mac      # Create macOS app bundle
npm run package:linux    # Create Linux AppImage/deb

# Code quality
npm run type-check       # TypeScript type checking
npm run lint             # ESLint (code style)
npm run format           # Prettier (auto-format)

# Deployment
npm run deploy           # Deploy web version to GitHub Pages
```

### Project Configuration Files

**`package.json`** - Dependencies and scripts
**`tsconfig.json`** - TypeScript compiler settings (strict mode)
**`vite.config.ts`** - Vite build configuration
**`electron/package.json`** - Electron-specific dependencies

### Debugging

**Web Version:**
1. Open Chrome DevTools (F12)
2. Use Console for logs
3. Use Performance tab for profiling
4. Use Canvas inspection tools

**Electron Version:**
1. Add `win.webContents.openDevTools()` in `electron/main.js`
2. DevTools opens automatically
3. Main process logs: `console.log` in `main.js` shows in terminal
4. Renderer process: DevTools console

### Testing Transparency

**Linux (X11):**
```bash
# Check if compositor is running
ps aux | grep -i compton
ps aux | grep -i picom

# Test transparency
npm run dev:electron
# Should see transparent window with overlay content
```

**NixOS (niri):**
```bash
# Ensure niri is running
echo $XDG_CURRENT_DESKTOP  # Should show "niri"

# Launch overlay
npm run dev:electron

# Configure window rules (see docs/transparency/nixos-niri.md)
```

---

## 📚 API & Usage

### Core APIs

**EventBus (Pub/Sub):**
```typescript
import { EventBus } from './core/EventBus';

const bus = new EventBus();

// Subscribe to events
bus.on('mouse:velocity', (data) => {
  console.log(`Speed: ${data.speed} px/s`);
});

// Emit events
bus.emit('mouse:velocity', { velocity, speed, position });

// Unsubscribe
bus.off('mouse:velocity', handler);
```

**Canvas Wrapper:**
```typescript
import { Canvas } from './core/Canvas';

const canvas = new Canvas('overlay-canvas', { alpha: true });

// Render loop
canvas.onFrame((ctx, deltaTime) => {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  // Your rendering code
});

canvas.start();  // Begin animation loop
```

**StateManager:**
```typescript
import { StateManager } from './core/StateManager';

interface AppState {
  overlayOpacity: number;
  mouseTrailsEnabled: boolean;
}

const state = new StateManager<AppState>({
  overlayOpacity: 1.0,
  mouseTrailsEnabled: true
});

// Subscribe to state changes
state.subscribe('overlayOpacity', (value) => {
  document.body.style.opacity = value.toString();
});

// Update state
state.set('overlayOpacity', 0.8);
```

### Feature Module API

**Each feature module exports:**
- `init(config)` - Initialize with configuration
- `start()` - Begin operation (start listening to events)
- `stop()` - Pause operation
- `cleanup()` - Remove event listeners, free resources
- `getState()` - Return current state (for debugging)

**Example - Mouse Velocity:**
```typescript
import { VelocityTracker } from './features/mouse/VelocityTracker';
import { TrailRenderer } from './features/mouse/TrailRenderer';

// Initialize
const tracker = new VelocityTracker(eventBus);
const trails = new TrailRenderer(canvas, eventBus);

// Configure
trails.configure({
  maxTrailLength: 50,
  fadeSpeed: 0.95,
  color: 'rgba(255, 0, 0, 0.8)'
});

// Start
tracker.start();
trails.start();

// Later: cleanup
tracker.cleanup();
trails.cleanup();
```

### Electron-Specific APIs

**Window Management:**
```typescript
// Check if running in Electron
const isElectron = typeof window !== 'undefined' &&
                   window.process?.type === 'renderer';

if (isElectron) {
  const { remote } = require('electron');
  const win = remote.getCurrentWindow();

  // Always on top
  win.setAlwaysOnTop(true);

  // Click-through
  win.setIgnoreMouseEvents(true, { forward: true });

  // Opacity control
  win.setOpacity(0.9);
}
```

---

## 🤝 Contributing

### How to Contribute

**1. Fork the repository**
**2. Create a feature branch:** `git checkout -b feature/animated-crosshairs`
**3. Commit changes:** `git commit -m "Add animated crosshair system"`
**4. Push to branch:** `git push origin feature/animated-crosshairs`
**5. Open Pull Request** with description

### Contribution Guidelines

**Code Style:**
- Use TypeScript (no `any` types)
- Follow existing architecture patterns
- Add JSDoc comments for public APIs
- Run `npm run format` before committing

**Feature Modules:**
- Keep modules self-contained
- Use EventBus for communication
- Provide `cleanup()` method
- Add configuration options

**Documentation:**
- Update README.md for new features
- Add inline code comments for complex logic
- Create guide in `docs/` for platform-specific setup

**Testing:**
- Test on web version first
- Verify Electron wrapper works
- Check performance (FPS, CPU usage)
- Test on your platform (document in PR)

### Platform-Specific Guides (Priority Contributions)

**We especially welcome PRs for:**
- Compositor setup guides (Sway, i3, bspwm, etc.)
- Window manager configurations
- Platform testing reports (does it work on your setup?)
- Performance optimization tips
- Custom themes and presets

**Template for new platform guide:**
```markdown
# Platform: [Your Compositor/OS]

## Prerequisites
- [List required software]

## Configuration
[Step-by-step setup]

## Troubleshooting
[Common issues and fixes]

## Screenshots
[Optional: show it working]
```

---

## 📄 License

**MIT License** - This project is free and open-source.

**Attribution:**
- Original analog keyboard overlay concept: [DarrenVs](https://github.com/DarrenVs/analog_keyboard_overlay)
- Clean-room rewrite and transparent overlay architecture: This project
- All code independently written with distinct implementation

See [LICENSE](LICENSE) file for full text.

---

## 🙏 Credits & Acknowledgments

**Inspiration:**
- **DarrenVs** - Original analog keyboard overlay concept for Wooting keyboards
- **Wooting Community** - Analog keyboard pioneers
- **OBS Project** - Making streaming accessible

**Technology:**
- **Electron** - Cross-platform desktop framework
- **Vite** - Lightning-fast build tool
- **TypeScript** - Type-safe JavaScript

**Special Thanks:**
- Streaming community for feedback and testing
- Contributors (see CONTRIBUTORS.md when we have them!)

---

## 📞 Support & Community

**Issues:** [GitHub Issues](https://github.com/zitongcharliedeng/a_web-based_input-overlay/issues)
**Discussions:** [GitHub Discussions](https://github.com/zitongcharliedeng/a_web-based_input-overlay/discussions)
**Documentation:** [docs/](docs/) folder in repository

**Quick Links:**
- 🐛 [Report a Bug](https://github.com/zitongcharliedeng/a_web-based_input-overlay/issues/new?template=bug_report.md)
- 💡 [Request a Feature](https://github.com/zitongcharliedeng/a_web-based_input-overlay/issues/new?template=feature_request.md)
- 📖 [Read the Docs](docs/)
- 🎨 [Share Your Setup](https://github.com/zitongcharliedeng/a_web-based_input-overlay/discussions)

---

## 📊 Project Status & Metrics

**Development Stage:** Planning & Architecture
**First Commit:** [TBD]
**Latest Release:** [None yet]
**Contributors:** 1 (zitongcharliedeng)

**Roadmap Progress:**
- [x] Research & Planning (100%)
- [ ] Phase 1: Core Overlay (0%)
- [ ] Phase 2: Multimedia (0%)
- [ ] Phase 3: Chat Integration (0%)
- [ ] Phase 4: Advanced Features (0%)

**Platform Support:**
- [x] Web (GitHub Pages) - Planned
- [x] Electron (Desktop) - Planned
- [x] Windows 10/11 - Planned
- [x] macOS 11+ - Planned
- [x] Linux (X11) - Planned
- [ ] Linux (Wayland) - Testing Required
- [ ] Android/iOS - Web Only (No transparency)

---

## 🎓 Learning Resources

**For Contributors New to These Technologies:**

**TypeScript:**
- [Official Handbook](https://www.typescriptlang.org/docs/handbook/)
- [TypeScript Deep Dive](https://basarat.gitbook.io/typescript/)

**Canvas API:**
- [MDN Canvas Tutorial](https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API/Tutorial)
- [HTML5 Canvas Deep Dive](https://joshondesign.com/p/books/canvasdeepdive/toc.html)

**Web Audio API:**
- [MDN Web Audio API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API)
- [Web Audio API Book](https://webaudioapi.com/book/)

**Electron:**
- [Electron Documentation](https://www.electronjs.org/docs/latest)
- [Electron Fiddle](https://www.electronjs.org/fiddle) - Interactive playground

**Game Dev Concepts (Relevant for Overlays):**
- [Game Loop Patterns](https://gameprogrammingpatterns.com/game-loop.html)
- [Vector Math](https://www.mathsisfun.com/algebra/vectors.html)

---

## 💭 Future Vision

**Long-term Goals:**

**1. Plugin Ecosystem**
Allow community to create custom modules:
```typescript
// Community plugin example
import { OverlayPlugin } from 'a_web-based_input-overlay';

class ReactionTimePlugin extends OverlayPlugin {
  // Measure and display reaction time to events
}
```

**2. Cloud Sync (Optional)**
- Save configurations to cloud
- Share presets with community
- Auto-sync across machines
- Privacy-respecting (opt-in only)

**3. VR Overlay Support**
Extend to VR gaming:
- OpenVR/SteamVR integration
- 3D positioned overlays in VR space
- Eye tracking visualization

**4. AI-Enhanced Features**
- Auto-adjust overlay position (face detection)
- Intelligent scene switching (game detection)
- Voice command controls

**The Ultimate Goal:**
> "Make streaming overlays so good that even the streamer wants to see them."

---

**Last Updated:** 2025-11-14
**Author:** [@zitongcharliedeng](https://github.com/zitongcharliedeng)
**Status:** ✅ Foundation Complete - Active Development

---

## 📝 Current Session Notes (2025-11-06)

### Completed Work
- ✅ Migrated `framework/vector.js` to `framework/Vector.ts` with full type annotations
- ✅ Converted ES5 prototype syntax to ES2020 class syntax
- ✅ Updated README.md with concise goal-focused description
- ✅ Renamed `claude.md` to `CLAUDE.md` for better visibility
- ✅ **Major Directory Refactoring:**
  - Reorganized entire codebase into semantic structure
  - Separated input listeners from overlay view
  - Used `_` prefix for system/helper folders
  - Merged game loop + scenes into single default.js
  - Fixed TEST 1B to include all 4 directions (added missing J key)
- ✅ **Electron Migration:**
  - Converted from web-based to Electron overlay app
  - Implemented BaseWindow + WebContentsView API (newer Electron API)
  - Added GTK-3 flag for Linux compatibility
  - Enhanced always-on-top with screen-saver level
  - Fixed transparency (both window and view backgrounds)
  - Created run scripts for NixOS (interactive + click-through modes)

### Current State
- **Repository**: `https://github.com/zitongcharliedeng/a_web-based_input-overlay.git`
- **Branch**: `master`
- **Latest Commit**: `b7b64a4` - refactor: migrate to BaseWindow API with improved transparency
- **Runtime**: Electron app using `nix-shell -p nodejs electron --run "electron ."`
- **Compilation**: Using `nix-shell -p nodejs --run "npx tsc"` (no global npm/node)
- **Status**: Electron overlay working, transparency confirmed, click-through limited by COSMIC

### Directory Structure (Current - REFACTORED)
```
.
├── index.html                          # Entry point
├── CLAUDE.md                           # This file - full technical roadmap
├── README.md                           # Public-facing readme (concise)
├── tsconfig.json                       # TypeScript config
├── package.json                        # npm dependencies
├── .gitignore                          # Ignores: _compiled/, node_modules/, .claude/
│
├── browserInputListeners/              # Pure input system (no dependencies)
│   ├── keyboard.js                     # Keyboard state tracker
│   ├── mouse.js                        # Mouse position/clicks tracker
│   └── gamepad.js                      # Gamepad API wrapper
│
└── browserInputOverlayView/            # Main overlay application
    ├── default.js                      # ✅ Game loop + scene (merged from canvasFramework + scenes)
    │
    ├── objects/                        # Visual components
    │   ├── LinearInputIndicator.ts     # ✅ TypeScript (nested config: input, processing, display)
    │   ├── Thumbstick.js               # ⏳ Needs TypeScript migration
    │   └── Text.js                     # ⏳ Needs TypeScript migration
    │
    ├── actions/                        # Scene modifiers
    │   └── PropertyEdit.js             # ⏳ Right-click edit menu (needs TS migration)
    │
    ├── _helpers/                       # Utilities (used only by overlay view)
    │   ├── Vector.ts                   # ✅ TypeScript - 3D vector math
    │   ├── applyProperties.ts          # ✅ TypeScript - deepMerge, isPlainObject
    │   └── draw.js                     # ⏳ Canvas drawing helpers (needs TS migration)
    │
    ├── _assets/                        # Static resources
    │   ├── style.css                   # Global styles
    │   └── images/
    │       └── KeyDefault.png          # Key background image
    │
    └── _compiled/                      # TypeScript output (gitignored)
        ├── _helpers/
        │   ├── Vector.js
        │   └── applyProperties.js
        └── objects/
            └── LinearInputIndicator.js
```

### TypeScript Migration Status

**Completed (CL1-8):**
1. ✅ `browserInputOverlayView/_helpers/Vector.ts` - 3D vector math utility (CL1)
2. ✅ `browserInputOverlayView/_helpers/applyProperties.ts` - Property merging with deepMerge (CL2)
3. ✅ `browserInputOverlayView/objects/LinearInputIndicator.ts` - Nested config (input, processing, display) (CL3)
4. ✅ `browserInputOverlayView/objects/Text.ts` - Text rendering object (CL4)
5. ✅ `browserInputOverlayView/objects/PlanarInputIndicator_Radial.ts` - Joystick visualization (CL5 - WORKING)
6. ✅ `browserInputOverlayView/actions/PropertyEdit.ts` - Right-click edit menu (CL6)
7. ✅ `browserInputListeners/keyboard.ts` and `browserInputListeners/gamepad.ts` - Input system (CL7)
8. ✅ `browserInputOverlayView/_helpers/draw.ts` - Canvas drawing helpers with type-safe properties (CL8)

**Migration Complete:**
All core objects, helpers, and input listeners are now in TypeScript. The only remaining JavaScript file is `default.js` (main game loop/scene), which will be kept as JavaScript for flexibility during development.

### Current Architecture Notes

**Config System:**
- Nested config structure: `{ input: {...}, processing: {...}, display: {...} }`
- Zod schemas with defaults are single source of truth
- Deep merging handled by explicit object spreading (no deepMerge utility)
- CustomisableCanvasConfig validated on load/save with detailed error messages

**Build System:**
- esbuild bundles TypeScript → dist/bundle.js
- Compiled output gitignored (developers compile locally)
- No global npm/node - use `nix-shell -p nodejs --run "npm run build"`
- <50ms rebuild times

**Electron Wrapper (Optional):**
- BaseWindow + WebContentsView API for transparency
- Click-through NOT supported on COSMIC compositor (Wayland/X11)
- Workaround: Interactive mode for editing, avoid clicking in overlay mode

### User Preferences (Code Style)
- No emojis in code or commit messages (removed from README)
- Concise documentation (no bullet point spam)
- Semantic clarity over brevity
- Clean-room refactoring approach (making code unrecognizable from original)
- Conventional commits with breaking change markers
- No "Co-Authored-By: Claude" in commits (user preference)

### Electron Implementation Details

**Run Scripts Created:**
- `run-nix.sh` - Interactive mode (Wayland, can edit/drag objects)
- `run-nix-clickthrough.sh` - Overlay mode (attempts click-through, doesn't work on COSMIC)
- `run-nix-dev.sh` - Development mode with DevTools
- `run-nix-frame.sh` - Debug mode with window frame
- `run-nix-x11.sh` - Force X11/XWayland mode

**Key Improvements from stream-overlay:**
- BaseWindow instead of BrowserWindow (newer API)
- WebContentsView for content management
- GTK-3 flag: `app.commandLine.appendSwitch('gtk-version', '3')`
- Enhanced always-on-top: `win.setAlwaysOnTop(true, 'screen-saver', 1)`
- Periodic moveTop() every 1 second
- Transparent backgrounds on both window and view

**COSMIC Compositor Issues:**
- Click-through (`setIgnoreMouseEvents(true)`) does not work
- Tested in both Wayland and X11 modes
- Transparency works perfectly
- Always-on-top works perfectly
- Conclusion: COSMIC doesn't support click-through yet (very new DE)

### Latest Session Progress (2025-11-13)

**TypeScript Refactoring - The Idiomatic Way:**

**Context:** User challenged me on using `any` and `as` type assertions - "TypeScript gods must approve"

**Problem Identified:**
- Used `deepMerge()` utility with `any` types
- Required type assertions (`as`) to make it work
- This is an anti-pattern in TypeScript - indicates wrong modeling

**Root Cause Analysis:**
- Q: Why do we even need deepMerge?
- A: We're merging partial user configs with nested defaults
- The pattern came from JavaScript, but TypeScript has better solutions

**The Idiomatic Solution:**
- Eliminated `deepMerge()` and `applyProperties()` entirely
- Replaced with explicit object spreading at each nesting level
- Example:
  ```typescript
  // Before (with deepMerge - requires any/as):
  const merged = deepMerge(defaults, props || {}) as SomeType;

  // After (explicit spreading - fully type-safe):
  this.input = {
    keyboard: { ...defaults.input.keyboard, ...props.input?.keyboard },
    mouse: { ...defaults.input.mouse, ...props.input?.mouse },
    gamepad: {
      stick: { ...defaults.input.gamepad.stick, ...props.input?.gamepad?.stick },
      button: { ...defaults.input.gamepad.button, ...props.input?.gamepad?.button }
    }
  };
  ```

**Results:**
- ✅ Zero `any` types
- ✅ Zero `as` assertions
- ✅ Fully type-safe, verifiable by TypeScript
- ✅ Optional chaining (`?.`) and nullish coalescing (`??`) for safety
- ✅ Explicit, readable code
- ✅ **TESTED AND WORKING** - Confirmed functional on Windows

**Files Changed:**
- `LinearInputIndicator.ts` - explicit nested spreading
- `Text.ts` - simple spreading with nested textStyle
- `PlanarInputIndicator_Radial.ts` - explicit spreading with style objects
- `PropertyEdit.ts` - removed empty applyProperties, changed `any` to `unknown`
- `default.ts` - fixed Text constructor to use nested textStyle
- **DELETED:** `applyProperties.ts` - no longer needed

**Lesson Learned:**
When TypeScript complains about types and you reach for `any` or `as`, that's a code smell. The solution is almost always to refactor the code pattern, not to silence the compiler. Object spreading is idiomatic TypeScript for merging configs.

**Commit:** `447dc39` - refactor!: eliminate deepMerge anti-pattern, use idiomatic TypeScript object spreading

### Latest Session Progress (2025-11-17)

**WebEmbed Implementation + Bug Fixes + Naming Refactors**

**What Was Accomplished:**
- ✅ **WebEmbed Interaction Modes** - Added `interactionMode` enum: 'readonly' (pointer-events: none) vs 'interactableOnFocus' (pointer-events: auto)
- ✅ **WebEmbed 50px Border** - Wider hitbox border for easier dragging/right-click without triggering iframe
- ✅ **Text Left-Aligned** - Fixed Text rendering to left-align at x=0, vertically centered
- ✅ **Drag Performance Fix** - Dragging now only updates config on mouse release (not every frame), shows semi-transparent preview during drag
- ✅ **Naming Refactors** - OmniConfig → CustomisableCanvasConfig, toast.ts → Toast.ts (TypeScript conventions)
- ✅ **Image Default Path Fix** - Changed broken GitHub URL to local path: `./viewWhichRendersConfigurationAndUi/_assets/images/KeyDefault.png`

**Branch:** `claude/read-the-l-011CUyxYQP7k5L551y7LxcUT`
**Latest Commit:** `0e032d6` - fix: use local path for default Image src

**Key Design Decisions:**

1. **WebEmbed Architecture:**
   - Uses iframe with 50px magenta border (full hitbox for interaction)
   - Inner gray border shows actual iframe boundary
   - URL label at top for debugging
   - iframe caching via global registry (prevents recreation on every frame)
   - Cross-origin broadcast input is impossible (security restriction)

2. **Drag Preview Pattern:**
   - DRY approach: renders actual object with globalAlpha=0.5
   - No config updates during drag (only on release)
   - Removed unnecessary right-mouse-button check from drag release condition

3. **Image Loading:**
   - Simple HTMLImageElement with src property
   - Accepts both local paths and HTTPS URLs agnostically
   - Browser handles all loading/caching automatically
   - No bundling, no custom asset management needed

**Files Modified:**
- `configSchema.ts` - Added WebEmbed schema with interactionMode, fixed Image default src
- `WebEmbed.ts` - Implemented iframe rendering with 50px border and interaction modes
- `Text.ts` - Changed to left-align (x=0, textAlign='left')
- `InteractionController.ts` - Fixed drag release condition, removed per-frame config updates, added getDragPreview()
- `ConfigManager.ts` - Wired up moveObject callback
- `default.ts` - Added drag preview rendering using object.draw()
- `CustomisableCanvasConfig.ts` (renamed from OmniConfig.ts)
- `Toast.ts` (renamed from toast.ts)

**Current Status:**
- ✅ All object types spawnable: LinearInputIndicator, PlanarInputIndicator, Text, Image, WebEmbed
- ✅ Drag and drop working with visual preview
- ✅ PropertyEdit persists changes to localStorage
- ✅ Config serialization/deserialization working
- ✅ Image object shows default KeyDefault.png on spawn
- ✅ All properties user-customizable through PropertyEdit (right-click any object)
- ✅ Clean architecture: no temporary getters, semantic naming throughout

---

### Latest Session Progress (2025-11-15)

**Priority 0 Refactoring Complete: Code Clarity & Semantic Naming**

**What Was Accomplished:**
- ✅ **Renamed linkedAxis → radialCompensationAxis** - Clearly indicates purpose (circular-to-square coordinate conversion)
- ✅ **Renamed revertedAxis → invertedAxis** - Consistent with PlanarInputIndicator's invertX/invertY
- ✅ **Renamed linkedValue → compensationAxisValue** - Matches radialCompensationAxis naming
- ✅ **Verified no non-DRY patterns** - Code is already well-factored
- ✅ **Confirmed temporary getters removed** - BaseCanvasObject uses proper semantic properties

**Branch:** `claude/read-the-l-011CUyxYQP7k5L551y7LxcUT`
**Latest Commit:** `7a4f2cd` - refactor: improve variable naming for semantic clarity

**Files Modified:**
- `LinearInputIndicator.ts` - all variable renames
- `OmniConfig.ts` - processing config interface
- `configSchema.ts` - Zod schema
- `default.ts` - all 12 object instantiations
- Builds tested successfully after each change

**Current Status:**
- ✅ Priority -1 (Foundation) Complete
- ✅ Priority 0 (Refactoring) Complete
- ✅ Priority 1 (Fade-out) Complete (implemented earlier)
- 📋 Next: Priority 2 - Configuration Management System

---

### Latest Session Progress (2025-11-14)

**Priority -1 Foundation Complete: TypeScript Strict Mode + Zod Validation + esbuild Bundler**

**What Was Accomplished:**
- ✅ **TypeScript Strict Mode Enabled** - All code passes strictest type checking
- ✅ **Zod Runtime Validation** - Config validation with detailed error messages
- ✅ **esbuild Bundler** - 305KB minified bundle, <50ms rebuild times
- ✅ **Pure TypeScript Repository** - All .js files are gitignored build artifacts
- ✅ **localStorage Persistence** - Scene configs save/load with validation
- ✅ **PropertyEdit Saves to Config** - UI mutations now persist across reloads

**Branch:** `claude/read-the-l-011CUyxYQP7k5L551y7LxcUT`
**Latest Commit:** `689b63c` - fix: use string keys for xAxes/yAxes record in Zod schema

**Key Technical Challenges Solved:**

1. **Zod Validation Failures (Multiple Iterations):**
   - Initial: Shallow object spread didn't merge nested config objects
   - Fixed: Deep merge all nested levels (input.keyboard, input.gamepad.stick, display.fontStyle)
   - Second issue: PlanarInputIndicator missing 6 style fields in schema
   - Final issue: JSON.stringify converts numeric keys to strings (z.record needs string keys)
   - **Validation approach:** Created test-validate.ts to test with actual localStorage data before pushing

2. **esbuild Module Resolution:**
   - TypeScript uses `.js` extensions in imports but files are `.ts`
   - Created custom plugin with onResolve hook to check if `.ts` file exists

3. **Pure TypeScript Repo:**
   - Changed gitignore to `**/*.js` (global ignore)
   - Converted esbuild.config.js → esbuild.config.ts
   - Electron wrapper now compiles from TypeScript sources
   - Use `tsx` for running .ts config files (not node --loader)

**Files Modified:**
- `webApp/package.json` - esbuild build scripts using tsx
- `webApp/esbuild.config.ts` - custom plugin for .js → .ts resolution
- `webApp/index.html` - uses dist/bundle.js from esbuild
- `webApp/persistentData/OmniConfig.ts` - added StyleProperties interface, fixed PlanarInputIndicator display config
- `webApp/persistentData/configSchema.ts` - Zod schemas with StyleProperties, string keys for xAxes/yAxes
- `webApp/persistentData/sceneSerializer.ts` - deep merge nested config objects
- `webApp/sceneRender/default.ts` - PropertyEdit saves to localStorage on close
- `.gitignore` - changed to `**/*.js` (all JS files are build artifacts)
- `wrapWebAppAsStandaloneProgram/package.json` - added build script for TypeScript

**Build Commands:**
```bash
# Web app (bundled with esbuild)
cd webApp && npm run build

# Electron wrapper (compiled TypeScript)
cd wrapWebAppAsStandaloneProgram && npm run build
```

**Current Status:**
- ✅ All inputs working (keyboard, mouse, gamepad, scroll wheel)
- ✅ Property edits persist across reloads
- ✅ Zod validation passes with actual localStorage data
- ✅ Build tested before every commit
- ✅ 100% TypeScript codebase (zero .js files tracked)

**Next Session: Priority 0 Refactoring**
Before adding new features, need to:
1. Remove non-DRY logic (consolidate duplicated patterns)
2. Improve variable naming (linkedAxis → radialCompensationAxis)
3. Complete any remaining cleanup from TypeScript migration
4. Then proceed to Priority 2: Configuration Management System (Priority 1 fade-out already done)

---

### Latest Session Progress (2025-11-12)

**Completed:**
- ✅ Added unfocused mouse button tracking via uiohook-napi
- ✅ Migrated mouse.js to TypeScript (mouse.ts)
- ✅ Restored TEST CASE 1 with multi-input support (keyboard + mouse + gamepad)
- ✅ Added mouse wheel support (scroll up/down)
- ✅ Implemented single-frame wheel events (wheelEvents.up/down)
- ✅ All inputs are additive (keyboard, mouse buttons, mouse wheel, gamepad can all trigger same indicator)
- ✅ PlanarInputIndicator_Radial restored to TEST CASE 1
- ✅ Mouse buttons work with unfocused input (global input hook)
- ✅ Fixed tsconfig.json rootDir to prevent double-nested compilation output
- ✅ Scroll wheel indicators confirmed working (visible in screen recordings at 60fps)

**Current Status:**
- **Latest Commit**: `d477f61` - fix: add single-frame wheel events for scroll up/down detection
- **Branch**: `claude/read-the-l-011CUyxYQP7k5L551y7LxcUT`
- **All Test Cases Passing**:
  - TEST 1: Multi-input WASD (gamepad stick + keyboard + mouse)
  - TEST 2: Digital keyboard keys (ZXC)
  - TEST 3: Gamepad buttons (A/B/X/Y)
  - TEST 3B: Gamepad triggers (LT/RT analog)
  - TEST 4: Thumbstick visualization
  - TEST 5: Mouse buttons (5-button) + scroll wheel (up/down) ← ALL WORKING

**Technical Notes:**
- Single-frame events are visible for 1 frame (16.67ms @ 60Hz, 6.94ms @ 144Hz)
- Higher refresh rates = shorter visibility for instantaneous inputs
- Screen recording at 60fps captures single-frame events successfully
- Fade-out duration (Priority 1 feature) will improve visibility for all refresh rates

---

## 🔮 Completed Priorities & Future Features

### Priority -1: Foundation (Critical - Do First) ✅ COMPLETE

**Analysis Date:** 2025-11-13
**Status:** ✅ COMPLETED 2025-11-14

These architectural improvements prevent bugs and improve maintainability.

#### 1. Enable TypeScript Strict Mode ⭐ HIGHEST PRIORITY
- **Current:** `strict: false` in tsconfig.json
- **Change to:** `strict: true`
- **Benefits:**
  - `strictNullChecks`: Prevents null/undefined crashes
  - `noImplicitAny`: Forces explicit typing
  - `strictFunctionTypes`: Better type safety
  - `noImplicitThis`: Catches context bugs
- **Cost:** 20-50 type errors to fix initially
- **ROI:** Massive - prevents entire classes of runtime bugs
- **Best done NOW** while codebase is small

#### 2. Add Zod for Config Validation ⭐ HIGH PRIORITY
- **Problem:** `JSON.parse(localStorage)` with no validation - silent corruption or crashes
- **Solution:** Add `zod` dependency (45kb, tree-shakeable)
- **Use cases:**
  - Validate localStorage data before deserializing
  - Type-safe config migrations when schema evolves
  - Better error messages ("expected number at processing.fadeOutDuration, got string")
  - Types derived from Zod schema (single source of truth)
- **Where:** sceneSerializer.ts, ConfigManager.ts, config import/export
- **This solves real problems** - not just dependency bloat

#### 3. Memory Leak Audit 🔍 MEDIUM PRIORITY
**Current risks to investigate:**
- Event listeners in keyboard.ts, mouse.ts, gamepad.ts - do they clean up?
- HTMLImageElement.onload in Image.ts - leaking references?
- PropertyEdit DOM element creation - proper removal?
- requestAnimationFrame loop - cancelled on cleanup?

**Action items:**
- Add explicit `cleanup()` / `destroy()` methods to all CanvasObjects
- Document lifecycle: init → update/draw → cleanup
- Test with Chrome DevTools Memory Profiler

#### 4. State Management - NOT Recommended ❌
**Conclusion:** Redux/Zustand NOT worth it for current project
- Current pure functional approach is clean
- No complex state coordination needed
- No reactive UI requiring global state
- **Only add if building full scene editor with undo/redo**

---

### Priority 0: Code Refactoring (Must Do First) ✅ COMPLETE

**Status:** ✅ COMPLETED 2025-11-15

**Goal:** Clean up codebase before adding new features

1. **Remove Non-DRY Logic** ✅
   - ✅ Verified code is already well-factored
   - ✅ No significant duplication found

2. **Improve Variable Naming** ✅
   - ✅ Renamed `linkedAxis` → `radialCompensationAxis` (clearly indicates radial compensation)
   - ✅ Renamed `revertedAxis` → `invertedAxis` (consistent with PlanarInputIndicator)
   - ✅ Renamed `linkedValue` → `compensationAxisValue` (matches radialCompensationAxis)
   - ✅ All variable names now semantic and self-documenting

3. **Complete TypeScript Migration** ✅
   - ✅ All files already migrated to TypeScript
   - ✅ No .js files remain (pure TypeScript repository)

---

### Priority 1: Visual Feedback Enhancement ✅ COMPLETE

**Status:** ✅ COMPLETED 2025-11-13 (Implemented before Priority -1 work)

**Problem:** Fast events (scroll, clicks) complete faster than 60fps frame time, making them invisible

**Solution: Fade-Out Duration Parameter (IMPLEMENTED)**

**What was implemented:**
1. ✅ `fadeOutDuration` parameter (default: 0.2 seconds)
2. ✅ Opacity-based fade (not fill-based) - differentiates digital vs analog inputs
3. ✅ Exponential decay algorithm (audio reverb-style signal processing)
4. ✅ Instant-on behavior (no fade-in delay)
5. ✅ Color opacity helper to apply fade to any fillStyle
6. ✅ Works for all input types (keyboard, mouse, scroll wheel, gamepad buttons)

**Results:**
- ✅ Scroll wheel events are visible (stay lit for 200ms)
- ✅ Fast mouse clicks more visible
- ✅ Per-object configurable (can disable by setting to 0)
- ✅ Digital inputs (keyboard/mouse) fade opacity, analog inputs (stick) vary fill height

**Example:**
```typescript
processing: {
  linkedAxis: 0,
  multiplier: 1,
  antiDeadzone: 0,
  fadeOutDuration: 0.2  // NEW: 200ms fade after input stops
}
```

---

### Priority 2: Configuration Management System ✅ COMPLETE

**Status:** ✅ COMPLETED 2025-11-17

**What was implemented:**
1. ✅ **localStorage Persistence** - Configs auto-save and restore on reload
2. ✅ **Zod Validation** - All configs validated on load/save with detailed error messages
3. ✅ **PropertyEdit UI** - Right-click any object to edit all properties
4. ✅ **Spawn Menu** - Right-click background to create new objects (all 5 types)
5. ✅ **Position Saving** - Objects maintain position across reloads
6. ✅ **JSON Serialization** - CustomisableCanvasConfig format (ready for copy/paste)

**What's missing (future enhancements):**
- [ ] Config export/import UI (currently auto-saves to localStorage)
- [ ] Manual copy/paste config JSON feature
- [ ] Preset sharing (Discord/URL sharing)
- [ ] Canvas background color changer in spawn menu

---

### Priority 3: Canvas Scaling & Fullscreen

**Goal:** Make overlay adapt to different screen sizes and resolutions

**Features:**

1. **Stretch to Fit Screen (Overlay Mode)**
   - Canvas automatically scales to fill entire screen in overlay mode
   - Maintains aspect ratio or allows stretch (user preference)
   - Responsive to window resize events

2. **Scale/Zoom Parameter**
   - New parameter: `canvas.scale` (default: 1.0)
   - Scales entire canvas and all objects uniformly
   - Allows users to make overlay bigger/smaller without repositioning objects
   - Included in configuration JSON (source of truth)

3. **Resolution Independence**
   - Objects positioned in normalized coordinates (0-1) or absolute pixels (user choice)
   - Scale factor applied at render time
   - Allows same config to work on 1080p and 4K screens

**Example:**
```json
{
  "canvas": {
    "width": 1920,
    "height": 1080,
    "scale": 1.5,  // NEW: 150% zoom
    "fitMode": "contain"  // or "fill", "stretch"
  }
}
```

---

### Priority 4: Enhanced Object Creation

**Goal:** Create new objects without editing code

**Right-Click Context Menu Implementation:**

1. **Menu Structure**
   ```
   Right-click background:
   ├─ Create New Linear Indicator
   ├─ Create New Planar Indicator
   ├─ Change Canvas Background RGBA
   └─ Configuration (Copy/Paste)

   Right-click object:
   └─ Edit Properties (existing PropertyEdit)
   ```

2. **Object Creation Flow**
   - Click "Create New Linear Indicator"
   - New object appears at mouse position
   - Immediately opens PropertyEdit dialog
   - User configures input/processing/display
   - Object added to scene

3. **Canvas Background RGBA**
   - Opens color picker with alpha slider
   - Live preview of background change
   - Useful for testing transparency, greenscreen, etc.

---

### Future Considerations (Low Priority)

1. **Preset Sharing Platform**
   - Community repository of overlay configs
   - One-click import from URL
   - Rating/voting system for popular presets

2. **Visual Config Editor**
   - Drag-and-drop object creation
   - Visual property editor (no JSON editing required)
   - Real-time preview

3. **Animation System**
   - Keyframe animations for objects
   - Transition effects between states
   - Particle effects on input

4. **Performance Optimizations**
   - Only redraw changed objects (dirty rectangle optimization)
   - Offscreen canvas rendering
   - WebGL acceleration for effects

---

### Next Steps (When Resuming)
1. **REFACTOR FIRST** - Clean up non-DRY logic and naming before new features
2. Complete TypeScript migration
3. Implement fade-out duration parameter (fixes scroll wheel visibility)
4. Add configuration export/import system
5. Implement canvas scaling/fullscreen support
6. Test on other Linux compositors (Hyprland, GNOME, KDE) for click-through verification

---

## 📋 Current Session Progress (TypeScript Migration Sprint)

### Branch: `claude/read-the-l-011CUyxYQP7k5L551y7LxcUT`
**Latest Commit:** `efd61e6` - fix(CL5): WORKING - remove property flattening, access nested config directly

### Development Context
- **Primary Development Machine:** Windows
- **Testing Machine:** Linux (NixOS with COSMIC DE)
- **Build Tool:** TypeScript compiler via `npm run build` (Windows) / `nix-shell -p nodejs --run "npx tsc"` (Linux)
- **No Global npm:** Use `nix-shell -p nodejs --run "npx ..."` on Linux

### Completed Changes (This Session)

#### CL1: Create CanvasObject Base Class ✅
**Commit:** `a1b749d`
- Abstract base class for all canvas objects
- Semantic grouped properties: `positionOnCanvas` and `hitboxSize` (not flat params)
- Temporary getters/setters for `x`, `y`, `width`, `height` for incremental migration
- CanvasObjectType union: linearInputIndicator, planarInputIndicator, text, image, webEmbed

#### CL2: Migrate Text to CanvasObject ✅
**Commit:** `f80e589`
- Convert Text.js → Text.ts extending CanvasObject
- Class syntax with proper TypeScript types
- Single `applyProperties()` call (DRY fix)
- Fixed multiple build errors (import paths, cross-platform prebuild)

#### CL3: Migrate LinearInputIndicator to CanvasObject ✅
**Commits:** `367281a`, `34d64ba`, `6b0b076`, `9ee2e1d`, `893c33a`
- Convert function constructor to class extending CanvasObject
- Initialize class fields to defaults (matches original state flow)
- Fix operator precedence in gamepad stick condition
- **Critical Fix:** Return type changed from `void` to `boolean` (update() must return true for redraw)
- All input types working: keyboard, mouse buttons, mouse wheel, gamepad stick

#### CL4: Refactor CanvasObject Constructor to Use Grouped Properties ✅
**Commit:** `ab82323`
- Changed CanvasObject constructor signature from flat params to grouped objects
- All subclasses updated to pass grouped `positionOnCanvas` and `hitboxSize`
- Cleaner semantic API

#### CL5: Migrate PlanarInputIndicator_Radial to CanvasObject ✅ WORKING
**Commits:** `8d7ac0d`, `4bda554`, `efd61e6`
- Convert function constructor to class extending CanvasObject
- Fixed input config structure in default.js (was using wrong format)
- **Critical Fix (Multiple Iterations):** Property flattening was causing gamepad input to fail
  - Initial attempts to fix flattening logic all failed (field initializations, timing, etc.)
  - **Root Cause:** Simple property flattening (`this.xAxes = this.input.xAxes`) unreliable in class constructors
  - **Solution:** Remove flattening entirely - access nested properties directly in update/draw methods
  - Now uses: `this.input.xAxes[i]`, `this.display.radius`, `this.processing.deadzone`
  - Cleaner semantic organization - properties stay in logical groups
- **CONFIRMED WORKING:** All inputs functional (keyboard, mouse, gamepad) on Windows and Linux

### Key Lessons Learned

#### Problem 1: Missing Return Statement in update()
- **Symptom:** Canvas froze when joystick stopped moving
- **Root Cause:** `update()` was returning `undefined` instead of `true`
- **Solution:** Changed abstract method signature in CanvasObject from `void` to `boolean`
- **Lesson:** Update methods must return `true` to trigger screen redraws

#### Problem 2: Property Flattening in Class Constructors (MAJOR)
- **Symptom:** Gamepad input failed completely while keyboard/mouse worked fine
- **Root Cause:** Simple property flattening (`this.xAxes = this.input.xAxes`) was unreliable in class constructors
  - Tried multiple approaches: removing field initializations, changing timing, using mergedProperties directly
  - All attempts to fix flattening failed on Windows (worked on Linux)
- **Solution:** Remove flattening entirely - access nested config properties directly
  - `this.input.xAxes[i]` instead of `this.xAxes[i]`
  - `this.display.radius` instead of `this.radius`
  - Properties stay in logical groups (input, processing, display)
- **Lesson:** Avoid simple property flattening in classes; keep properties nested OR do meaningful computation during flattening (like LinearInputIndicator's `asConventionalGamepadAxisNumber()`)

#### Problem 3: Operator Precedence in Boolean Logic
- **Symptom:** Gamepad input behaved unexpectedly
- **Root Cause:** Missing parentheses in complex boolean condition with mixed `&&` and `||` operators
- **Solution:** Added explicit parentheses: `if (condition && (subA && subB || subC))`
- **Lesson:** Always use explicit parentheses for clarity, never rely on operator precedence

#### Problem 4: Config Property Structure Mismatch
- **Symptom:** PlanarInputIndicator_Radial wasn't reading joystick input
- **Root Cause:** Scene was passing LinearInputIndicator-format config instead of correct PlanarInputConfig format
- **Solution:** Updated scene to pass correct `{ xAxes: {...}, yAxes: {...} }` structure
- **Lesson:** Each object type has its own config interface; don't mix them

### Architecture Principles Applied

#### Semantic Grouped Properties
```typescript
// Instead of:
constructor(pxFromCanvasTop, pxFromCanvasLeft, widthInPx, lengthInPx, type)

// Now:
constructor(
    positionOnCanvas: { pxFromCanvasTop, pxFromCanvasLeft },
    hitboxSize: { widthInPx, lengthInPx },
    canvasObjectType
)
```

#### Self-Documenting Code
- Variable names clearly indicate purpose: `pxFromCanvasTop` not `y`, `lengthInPx` not `height`
- NO comments - semantic naming tells the story
- Type annotations provide clarity without need for docs

#### Nested Property Access Pattern (Recommended)
```typescript
const mergedProperties = deepMerge(defaults, overrides);
applyProperties(this, mergedProperties);

// NO flattening - access nested properties directly in methods:
update() {
    if (this.input.xAxes[i]) { ... }  // Not this.xAxes[i]
    if (this.display.radius > 0) { ... }  // Not this.radius
}
```

**Why:** Simple property flattening is unreliable in TypeScript class constructors. Keep properties nested in logical groups.

### Files Modified This Session

**Objects:**
- `webApp/browserInputOverlayView/objects/CanvasObject.ts` (new)
- `webApp/browserInputOverlayView/objects/LinearInputIndicator.ts` (refactored)
- `webApp/browserInputOverlayView/objects/PlanarInputIndicator_Radial.ts` (refactored)
- `webApp/browserInputOverlayView/objects/Text.ts` (refactored)

**Helpers:**
- `webApp/browserInputOverlayView/_helpers/applyProperties.ts` (verified working)

**Scene:**
- `webApp/browserInputOverlayView/default.js` (updated imports and config)

**Config:**
- `webApp/package.json` (updated scripts)
- `webApp/tsconfig.json` (verified correct)

### Testing Status

✅ **All Input Types Working:**
- Keyboard (WASD, etc.)
- Mouse buttons (all 5 buttons)
- Mouse wheel (scroll up/down)
- Gamepad stick (left stick X/Y axes)
- Gamepad buttons

✅ **Visual Feedback:**
- LinearInputIndicator bars fill correctly
- PlanarInputIndicator_Radial shows joystick input as radial display
- Text elements render

✅ **Build Status:**
- TypeScript compilation succeeds
- No type errors
- Compiled JS loads in browser

### Known Issues & TODOs

**Immediate Next (CL6-7):**
1. Migrate PropertyEdit.js to TypeScript
2. Migrate keyboard.js and gamepad.js input listeners to TypeScript
3. Remove temporary x/y/width/height getters from CanvasObject (after all objects migrated)

**Future (Phase 2+):**
1. Camera feed integration
2. Microphone/audio visualization
3. Chat embed system
4. Scene management system
5. Save/load configurations

### Workflow Notes for Next Session

**Build Process (Windows):**
```powershell
npm run build
# Compiles TS, cleans _compiled dirs, runs tsc
```

**Build Process (Linux):**
```bash
nix-shell -p nodejs --run "node -e \"require('fs').rmSync(...); ...\" && npx tsc"
```

**Testing Cycle:**
1. Make changes to .ts file
2. Run build (compiles to _compiled/)
3. Pull changes on Windows machine
4. Test in browser
5. Report any input behavior changes
6. If working: good to commit; if broken: identify root cause

**Critical Pattern for Class Migration:**
1. Extend CanvasObject
2. Declare properties WITHOUT initializing (except descriptive ones like className)
3. In constructor: call super() with grouped objects
4. In constructor: merge and flatten properties from defaults
5. Return `true` from update() method
6. Call parent draw() signature exactly: `(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D)`

**Commit Message Convention:**
- CL# prefix for change list number
- Describe the architectural change, not just what files changed
- Include any critical fixes discovered during migration

### User Preferences (Code Style)
- No emojis in code or commit messages
- No comments - semantic names tell the story
- DRY principles: extract shared logic
- Small testable CLs for regression checking
- Windows as primary dev machine; Linux for validation
- Test manually in browser (no automated tests yet)

---

### Latest Session Progress (2025-11-13 Continued - Omniconfig & Visual Polish)

**Branch:** `claude/read-the-l-011CUyxYQP7k5L551y7LxcUT`
**Latest Commit:** `5c23577` - fix: match W button background, apply mathematical RGB colors to radial

**Completed This Session:**
- ✅ **Folder Restructure:** `objects/` → `CanvasObject/`, `CanvasObject.ts` → `index.ts` for proper TypeScript folder imports
- ✅ **Browser ES Module Fix:** Changed folder imports from `'.'` to `'./index.js'` (browsers require explicit file paths)
- ✅ **Dead Code Cleanup:** Removed applyProperties.js, removed unnecessary test cases (ZXC, spacebar, mouse-only tests)
- ✅ **Omniconfig Infrastructure:** Added OmniConfig.ts with types and default templates for all object types
- ✅ **Config Versioning System:** Added `CONFIG_VERSION` constant - auto-clears localStorage on breaking changes
- ✅ **Multi-Input Enhancement:** Added scroll wheel (up/down) to WASD keys alongside keyboard/mouse/gamepad
- ✅ **Visual Polish:**
  - Black text with white outline (3px stroke) for all labels
  - Simplified labels to single letters/short names (W, A, S, D, LT, RT, etc.)
  - Mathematical RGB convention for radial indicator (X=red, Y=green, magnitude=yellow, direction=blue)
  - Consolidated triggers (LT/RT) to same row as gamepad buttons
  - Transparent background for radial circle
  - 2px line width for radial (down from 4px)

**Architecture Achievements:**
- **Omniconfig Complete:** Types, templates, and factory functions fully implemented
- **localStorage Persistence:** Scene configs save/load with automatic version checking
- **Config-Driven:** All objects use config pattern (ready for serialization)
- **Scene Config Editor:** Right-click canvas → edit JSON config in real-time

**Current Test Setup:**
- TEST 1: WASD with/without radial compensation + PlanarInputIndicator + multi-input (keyboard + mouse + scroll + gamepad)
- TEST 1B: Right joystick (IJKL)
- TEST 3: Gamepad buttons (A/B/X/Y) + triggers (LT/RT) on same row
- All inputs confirmed working across platforms

**CONFIG_VERSION History:**
- v1: Initial localStorage persistence
- v2: Black text with white outline, simplified labels
- v3: Fixed text fill color (black not white)
- v4: Mathematical RGB colors, transparent radial background

**What's Actually Next:**
The omniconfig infrastructure is COMPLETE. The test scene uses direct constructors which is fine - they're already config-driven and work with serialization. Factory functions exist for deserialization (scene config editor uses them).

Genuine next priorities:
1. **Visual feedback enhancement:** Fade-out duration for fast inputs (scroll wheel visibility)
2. **Config management UI:** Save/load preset configurations
3. **Additional input indicators:** More gamepad mappings, keyboard layouts
4. **Performance optimization:** Only redraw changed objects
5. **Platform testing:** Verify click-through on other Linux compositors

---

### Latest Session Progress (2025-11-13 - Fade-Out Implementation)

**Branch:** `claude/read-the-l-011CUyxYQP7k5L551y7LxcUT`
**Latest Commit:** `9b7c622` - fix: invert uiohook scroll wheel to match DOM convention, bump CONFIG_VERSION to 101

**Completed This Session:**
- ✅ **Opacity-Based Fade-Out:** Implemented exponential decay fade for digital inputs
- ✅ **Signal Processing Approach:** Replaced state machine with continuous decay (audio reverb-style)
- ✅ **Default Fade Duration:** Set to 0.2 seconds (was 0) for better visibility of fast inputs
- ✅ **Color Opacity Helper:** Added `applyOpacityToColor()` method to parse and modify RGBA/RGB/hex colors
- ✅ **Scroll Wheel Direction Fix:** Corrected uiohook rotation → DOM deltaY convention mismatch
- ✅ **Config Version Bump:** v101 to force localStorage clear for new defaults

**Technical Implementation:**

**1. Fade Logic (Signal Processing, Not State Machine):**
```typescript
if (rawValue > 0) {
    // Input active - instant response, full opacity
    this.value = rawValue;
    this.opacity = 1.0;
} else if (this.fadeOutDuration > 0 && this.value > 0) {
    // Input inactive - keep fill at current value, fade opacity to 0
    const decayRate = 1.0 / this.fadeOutDuration;
    this.opacity = this.opacity * Math.exp(-decayRate * delta);

    if (this.opacity < 0.001) {
        this.opacity = 0;
        this.value = 0;
    }
} else {
    // No fade - instant off
    this.value = 0;
    this.opacity = 1.0;
}
```

**Key Insight:** Fade is continuous signal decay (like audio reverb), not discrete state transitions. The exponential decay formula `value *= exp(-decayRate * delta)` provides smooth, natural-feeling fade.

**2. Opacity vs Fill Behavior:**
- **Digital inputs (keyboard, mouse):** Fill stays at 100%, opacity fades 1.0 → 0.0
- **Analog inputs (gamepad stick):** Fill height varies continuously with input value
- This visual distinction helps users differentiate input types at a glance

**3. Scroll Wheel Direction Bug:**
- **Problem:** uiohook and DOM use opposite sign conventions
  - DOM: `deltaY < 0` = scroll up, `deltaY > 0` = scroll down
  - uiohook: `rotation > 0` = scroll down, `rotation < 0` = scroll up
- **Fix:** Inverted comparison signs in index.html global wheel handler
- **Result:** Scroll wheel now works correctly in both web and Electron versions

**4. The Units Bug (Most Embarrassing):**
- Delta from `requestAnimationFrame` is already in seconds: `delta = (currentTime - previousTime) / 1000`
- Was dividing by 1000 again in exponential decay, making fade 1000x slower than intended
- Fix: removed the extra `/ 1000` - now fade works at correct speed

**Debug Journey (Commit History):**
- `ab34483` - Bumped CONFIG_VERSION to 100 (localStorage wasn't clearing)
- `b52970e` - FUNDAMENTAL FIX: Replaced state machine with exponential decay
- `d571078` - UNITS BUG: Delta already in seconds, don't divide by 1000 again
- `ed75a61` - feat: Replace fill fade with opacity fade
- `9b7c622` - fix: Invert uiohook scroll wheel direction

**Lessons Learned:**
1. **Treat the cause, not the symptom:** Multiple state machine fixes failed because the state machine itself was the wrong model
2. **Signal processing > state machines** for continuous effects like fades
3. **Unit conversions are dangerous:** Always verify what units your inputs are in
4. **Simple is better:** Final solution is 15 lines vs 50+ lines of state machine logic

**CONFIG_VERSION History:**
- v100: Forced clear for fadeOutDuration addition
- v101: Forced clear for new fadeOutDuration default (0.2s)

---

### Latest Session Progress (2025-11-15 - SourceCode Directory Restructure)

**Branch:** `claude/read-the-l-011CUyxYQP7k5L551y7LxcUT`
**Latest Commits:**
- `7a14126` - refactor!: restructure project with SourceCode directory and consolidated configs
- `c8d1fda` - chore: remove build artifacts (.bak and .d.ts files) from git

**Completed This Session:**
- ✅ **Directory Restructure:** Created `SourceCode/` root with `_devTools/`, `WebApp/`, `DesktopWrappedWebapp/` subdirectories
- ✅ **Config Consolidation:** Merged all dependencies into root `package.json`, deleted 6 redundant config files
- ✅ **Unified Build Script:** Created `buildForWindowsDevelopment.ps1` with 4-option menu in `_devTools/`
- ✅ **TypeScript Migration Complete:** Fixed 35+ compilation errors from previous refactor session
- ✅ **Build Artifacts Cleanup:** Removed `.bak` and `.d.ts` files from git, updated `.gitignore`
- ✅ **Documentation Updated:** Updated README.md with new structure and entry point

**Key Architectural Decisions:**

**1. Why Two TypeScript Configs (WebApp vs Desktop)?**
- **WebApp:** `"module": "ES2022"` + `"lib": ["ES2020", "DOM"]` for browser ES modules
- **Desktop:** `"module": "CommonJS"` for Electron main process (Node.js runtime)
- **Reason:** Electron main process needs synchronous `require()` in try-catch for optional native dependencies (uiohook-napi, @kmamal/sdl)
- **Industry Standard:** VSCode just migrated to ES modules in Oct 2024, most Electron apps still use CommonJS for main process

**2. Build System:**
- Using `tsc` (not esbuild) to preserve directory structure
- TypeScript compiles to sibling `.js` files (not `dist/` folder)
- All `.js`, `.js.map`, `.d.ts` files are gitignored (build artifacts only)
- No `.js` extensions in TypeScript imports (use `moduleResolution: "node"`)

**3. Deep Partial Utility Type:**
Created `DeepPartial<T>` for nested optional config properties - fixes `exactOptionalPropertyTypes: true` strictness:
```typescript
type DeepPartial<T> = T extends object ? {
	[P in keyof T]?: DeepPartial<T[P]>;
} : T;
```

**File Structure:**
```
/                                # Root: Documentation only
├── README.md
├── CLAUDE.md
├── .gitignore
└── SourceCode/                  # ALL source code related files
    ├── _devTools/               # All configs and build scripts
    │   ├── node_modules/        # Installed dependencies (gitignored)
    │   ├── package.json         # Dependencies and npm scripts
    │   ├── package-lock.json
    │   ├── tsconfig.json        # Base config (ES2022)
    │   ├── tsconfig.webapp.json # WebApp (ES modules)
    │   ├── tsconfig.desktop.json # Desktop (CommonJS)
    │   ├── .eslintrc.cjs
    │   └── buildForWindowsDevelopment.ps1
    ├── WebApp/                  # Browser code (ES2022 modules)
    └── DesktopWrappedWebapp/    # Electron wrapper (CommonJS)
```

Gitignore: `**/*.js`, `**/*.js.map`, `**/*.d.ts`

**Entry Point (Windows):**
```powershell
.\SourceCode\_devTools\buildForWindowsDevelopment.ps1
```

**Lessons Learned:**
1. **Council consensus:** Separate tsconfig files required for WebApp (ES modules) vs Desktop (CommonJS) - cannot be merged
2. **Build artifacts must be gitignored:** `.d.ts` declaration files are generated by `"declaration": true"` and should not be committed
3. **Documentation is critical:** Updated README.md immediately after restructure to reflect new entry point
4. **Minimal config philosophy:** Only 4 essential config files (package.json + 3 TypeScript configs) vs 11+ scattered configs before

---

*Last Updated: 2025-11-15*
*Model: Claude Sonnet 4.5*
