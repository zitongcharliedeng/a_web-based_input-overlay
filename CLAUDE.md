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

**Last Updated:** 2025-11-06
**Author:** [@zitongcharliedeng](https://github.com/zitongcharliedeng)
**Status:** 🚧 In Planning Phase

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

**Completed:**
1. ✅ `browserInputOverlayView/_helpers/Vector.ts` - 3D vector math utility
2. ✅ `browserInputOverlayView/_helpers/applyProperties.ts` - Property merging with deepMerge
3. ✅ `browserInputOverlayView/objects/LinearInputIndicator.ts` - Nested config (input, processing, display)
4. ✅ **Directory Refactoring Complete** - Semantic structure with browserInputListeners and browserInputOverlayView

**Next in Queue:**
1. ⏳ `browserInputOverlayView/objects/Text.ts` - Simplest object (pure text rendering)
2. ⏳ `browserInputOverlayView/objects/Thumbstick.ts` - Apply nested config pattern like LinearInputIndicator
3. ⏳ `browserInputOverlayView/actions/PropertyEdit.ts` - Right-click edit menu
4. ⏳ `browserInputOverlayView/_helpers/draw.ts` - Canvas drawing helpers
5. ⏳ `browserInputListeners/*.ts` - Input system (keyboard, mouse, gamepad)

### Known Issues & TODOs

**Active TODOs:**
- [ ] Convert Text.js to TypeScript
- [ ] Convert Thumbstick.js to TypeScript (apply nested config pattern)
- [ ] Rename `linkedAxis` to better mathematical term (radialCompensationAxis or perpendicularAxis)
- [ ] Make KeyImage user-customizable property (currently hardcoded in default.js scene)

**Click-Through Investigation (COSMIC Limitation):**
- ⚠️ `setIgnoreMouseEvents(true)` does NOT work on COSMIC compositor (both Wayland and X11/XWayland modes)
- ✅ Researched stream-overlay implementation (uses same API - BaseWindow + setIgnoreMouseEvents)
- ✅ Implemented BaseWindow + WebContentsView (matches stream-overlay exactly)
- ✅ Added GTK-3 flag for Linux compatibility
- ✅ Tested in X11 mode with transparent background (background works, click-through doesn't)
- **Conclusion**: COSMIC compositor doesn't support click-through windows yet (very new DE)
- **Workaround**: Use interactive mode for editing, overlay mode for display (user must avoid clicking on it)

**Architectural Notes:**
- Using nested config structure: `{ input: {...}, processing: {...}, display: {...} }`
- `deepMerge()` properly handles special objects (Image, Date, etc.) via `isPlainObject()` check
- Compiled output is gitignored (developers must compile locally)
- No npm/npx in PATH - must use `nix-shell -p nodejs --run "npx tsc"`

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

## 🔮 Pending Features & Refactoring (DO NOT IMPLEMENT YET)

### Priority 0: Code Refactoring (Must Do First)

**Goal:** Clean up codebase before adding new features

1. **Remove Non-DRY Logic**
   - Identify and consolidate duplicated code patterns
   - Extract common functionality into shared utilities
   - Refactor repetitive object creation patterns

2. **Improve Variable Naming**
   - Rename `linkedAxis` to `radialCompensationAxis` or `perpendicularAxis`
   - Review all variable names for semantic clarity
   - Use consistent naming conventions throughout

3. **Complete TypeScript Migration**
   - Convert Text.js → Text.ts
   - Convert Thumbstick.js → Thumbstick.ts (apply nested config pattern)
   - Convert PropertyEdit.js → PropertyEdit.ts
   - Convert draw.js → draw.ts
   - Convert keyboard.js → keyboard.ts
   - Convert gamepad.js → gamepad.ts

4. **Build System Improvements**
   - Create proper release binaries (electron-builder)
   - Better dev commands (npm scripts)
   - Improve click-through/readonly mode implementation
   - Fix GitHub Pages deployment issues

---

### Priority 1: Visual Feedback Enhancement

**Problem:** Fast events (scroll, clicks) complete faster than 60fps frame time, making them invisible

**Solution: Global Fade-Out Duration Parameter**

1. **Add Global Fade Configuration**
   - New parameter: `fadeOutDuration` (default: 0 = current instant behavior)
   - Measured in seconds (e.g., 0.2 = 200ms fade)
   - Applied to all LinearInputIndicator objects

2. **Implementation Details**
   - When input becomes inactive, indicator value fades from 1.0 → 0.0 over X seconds
   - Linear or eased fade curve (configurable)
   - Maintains current instant-on behavior (no fade-in delay)
   - Only fades when ALL input sources become inactive

3. **Benefits**
   - Makes scroll wheel events visible (they stay lit for fade duration)
   - Makes fast mouse clicks more visible
   - Gives users feedback on input registration
   - Configurable per user preference (0 for instant, 0.2+ for visibility)

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

### Priority 2: Configuration Management System

**Goal:** Save/load/share overlay configurations easily

**Feature: Configuration Export/Import UI**

1. **Right-Click Context Menu (Background Only)**
   - Right-click on canvas background (NOT on objects) opens menu:
     - "Create New PlanarInputIndicator"
     - "Create New LinearInputIndicator"
     - "Change Canvas Background RGBA"
     - "Show Configuration (Copy/Paste)" ← 4th option

2. **Configuration Text Box**
   - Modal/panel that displays entire scene configuration as JSON
   - Shows all objects with:
     - Position properties (x, y)
     - All input/processing/display config
     - Canvas background RGBA
     - Global settings (fadeOutDuration, scale, etc.)
   - Fully copy/pasteable text
   - Friends can share configs via Discord/text

3. **Live Configuration Update**
   - Pasting new config into text box updates canvas in real-time
   - Graceful error handling with validation warnings
   - Shows which line/property is invalid if paste fails
   - Preserves valid objects if only part of config is bad
   - Undo/redo support for config changes

**Example Configuration Format:**
```json
{
  "canvas": {
    "width": 1920,
    "height": 1080,
    "scale": 1.0,
    "backgroundColor": "rgba(0, 0, 0, 0)"
  },
  "global": {
    "fadeOutDuration": 0.2
  },
  "objects": [
    {
      "type": "LinearInputIndicator",
      "x": 240,
      "y": 60,
      "width": 100,
      "height": 100,
      "input": {
        "keyboard": { "keyCode": "KeyW" },
        "mouse": { "button": 3, "wheel": null },
        "gamepad": {
          "stick": { "type": "left", "axis": "Y", "direction": "negative" },
          "button": { "index": null }
        }
      },
      "processing": {
        "linkedAxis": 0,
        "multiplier": 1,
        "antiDeadzone": 0,
        "fadeOutDuration": 0.2
      },
      "display": {
        "text": "W",
        "backgroundImage": "KeyDefault.png",
        "fillStyle": "#00ff00"
      }
    }
    // ... more objects
  ]
}
```

4. **Position Properties**
   - All objects must include `x`, `y` in config
   - Currently objects have position but not in serialized config
   - Add position to configuration export/import

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

*Last Updated: Current Session*
*Model at Session Start: Claude Haiku 4.5*
*Switching to: Claude Sonnet 4.5 for next session*
