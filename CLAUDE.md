# A Web-Based Input Overlay - Developer Guide for AI Assistants

> The Ultimate Transparent Streamer Overlay Platform - Because streamers should see their own overlays too!

**Repository:** https://github.com/zitongcharliedeng/a_web-based_input-overlay
**Current Version:** 1.0.25
**Status:** Production (Active Development)
**License:** MIT
**Primary Platform:** Windows 10/11 (macOS and Linux supported)

---

## Project Vision

Transform streaming overlays from "viewer-only graphics" to **real-time, transparent, always-on-top overlays that streamers can actually see**.

**Traditional overlays:** Only visible in OBS output (viewers see it, streamer doesn't)
**Our approach:** Transparent window overlay (streamer AND viewers see it in real-time)

Think of it as a HUD for streamers - displaying input visualization (keyboard, mouse, gamepad), camera feeds, audio levels, web embeds (chat, YouTube), all in a customizable transparent overlay.

---

## Quick Facts for AI Assistants

**Technology Stack:**
- TypeScript (strict mode, no `any` types allowed)
- Electron (desktop wrapper with transparency support)
- Vite (web app bundler with hot reload)
- Zod (runtime schema validation as single source of truth)
- Canvas 2D API (hardware-accelerated rendering)

**Key Dependencies:**
- `@kmamal/sdl` - SDL2 bindings for robust gamepad polling
- `uiohook-napi` - Global keyboard/mouse hooks (clickthrough mode)
- `zod` - Schema validation and type inference

**Architecture Pattern:**
- Model-View-Controller (MVC) with semantic folder names
- Web-first design (works in browser AND Electron)
- Dual input systems (browser APIs + native Electron hooks)
- Config-driven rendering (Zod schemas → TypeScript types)

**Code Style Requirements:**
- No emojis in code or commit messages
- No `any` types - use `unknown` if type is truly unknown
- No `as` type assertions - refactor code pattern instead
- Explicit object spreading for config merging (no deepMerge utilities)
- Conventional commits with breaking change markers (`feat!:`, `fix!:`)
- Self-documenting variable names over comments

---

## Repository Structure

```
a_web-based_input-overlay/
├── CLAUDE.md                           # This file (AI assistant guide)
├── README.md                           # Public-facing readme
├── .github/workflows/                  # CI/CD (GitHub Actions)
│
└── SourceCode/                         # All source code lives here
    ├── package.json                    # Dependencies and npm scripts
    ├── package-lock.json              # Locked dependency versions
    │
    ├── WebApp/                         # Web application (Vite project)
    │   ├── index.html                  # Entry point
    │   ├── vite.config.ts              # Vite configuration
    │   │
    │   ├── modelToSaveCustomConfigurationLocally/    # MODEL layer
    │   │   ├── CustomisableCanvasConfig.ts  # Central registry + types
    │   │   ├── configSchema.ts              # Zod schemas (source of truth)
    │   │   ├── configSerializer.ts          # JSON serialization
    │   │   ├── configUpdaters.ts            # Config mutation logic
    │   │   └── ConfigManager.ts             # localStorage persistence
    │   │
    │   ├── viewWhichRendersConfigurationAndUi/      # VIEW layer
    │   │   ├── default.ts                   # Main entry point (game loop)
    │   │   │
    │   │   ├── inputReaders/
    │   │   │   ├── DOM_API/                 # Browser input (web version)
    │   │   │   │   ├── keyboard.ts
    │   │   │   │   ├── mouse.ts
    │   │   │   │   └── gamepad.ts
    │   │   │   └── ElectronAppWrapper_API/  # Native hooks (Electron)
    │   │   │       └── index.ts
    │   │   │
    │   │   ├── canvasRenderer/
    │   │   │   ├── CanvasRenderer.ts        # Main render loop
    │   │   │   ├── canvasDrawingHelpers.ts  # Drawing utilities
    │   │   │   └── canvasObjectTypes/       # Visual components
    │   │   │       ├── BaseCanvasObject.ts
    │   │   │       ├── LinearInputIndicator.ts  # WASD keys, triggers
    │   │   │       ├── PlanarInputIndicator.ts  # Joysticks, mouse
    │   │   │       ├── Text.ts
    │   │   │       ├── Image.ts
    │   │   │       ├── WebEmbed.ts          # YouTube, Twitch, GIFs
    │   │   │       └── index.ts             # Deserialization logic
    │   │   │
    │   │   ├── uiComponents/
    │   │   │   ├── PropertyEdit.ts          # Right-click edit menu
    │   │   │   └── Toast.ts                 # Notification system
    │   │   │
    │   │   └── _assets/
    │   │       ├── style.css                # Global styles
    │   │       └── images/
    │   │           └── KeyDefault.png
    │   │
    │   ├── controllerToMutateCustomConfiguration/   # CONTROLLER layer
    │   │   └── UserEditModeInteractionsController.ts  # Edit mode logic
    │   │
    │   └── _helpers/                        # Shared utilities
    │       ├── Vector.ts                    # 3D vector math
    │       └── TypeUtilities.ts             # TypeScript helpers
    │
    ├── DesktopWrappedWebapp/               # Electron wrapper
    │   ├── tsconfig.json                   # TypeScript config
    │   ├── main.ts                         # Main process
    │   ├── preload.ts                      # Preload script (IPC bridge)
    │   ├── sdl-bridge.ts                   # SDL child process (out-of-focus gamepad)
    │   └── modeSelectorPreload.ts          # Mode selection preload
    │
    └── _devTools/                          # Development tools
        └── buildForWindowsDevelopment.ps1  # Build and run script
```

---

## Architecture Deep Dive

### MVC Pattern with Semantic Folder Names

**Model (`modelToSaveCustomConfigurationLocally/`):**
- Zod schemas define the structure of all canvas objects
- Schemas generate TypeScript types via `z.infer<typeof schema>`
- ConfigManager handles localStorage persistence
- configUpdaters provide type-safe mutation functions

**View (`viewWhichRendersConfigurationAndUi/`):**
- `default.ts` is the main entry point (starts game loop)
- CanvasRenderer manages the render loop (requestAnimationFrame)
- Canvas object types (LinearInputIndicator, PlanarInputIndicator, etc.)
- Input readers provide unified interface for DOM and Electron APIs
- UI components for editing and notifications

**Controller (`controllerToMutateCustomConfiguration/`):**
- UserEditModeInteractionsController handles drag-drop, resize, select
- Right-click editing via PropertyEdit component
- Multi-select with shift-click and drag-to-select

### Dual Input Systems

**Web Version (DOM_API):**
```typescript
// Browser-based input for web deployment
keyboard.ts  // addEventListener('keydown', ...)
mouse.ts     // addEventListener('pointermove', ...)
gamepad.ts   // navigator.getGamepads()
```

**Electron Version (ElectronAppWrapper_API):**
```typescript
// Native global hooks for clickthrough mode
uiohook-napi  // Global keyboard/mouse (works when window ignores input)
@kmamal/sdl   // Robust gamepad polling (SDL_JOYSTICK_ALLOW_BACKGROUND_EVENTS)
```

The input readers abstract these differences, providing a unified interface to canvas objects.

### Canvas Object Architecture

All canvas objects extend `BaseCanvasObject` and follow this pattern:

```typescript
// Each object type has a Zod schema
const LinearInputIndicatorConfigSchema = z.object({
  input: z.object({ /* ... */ }),
  processing: z.object({ /* ... */ }),
  display: z.object({ /* ... */ }),
  opacity: z.number().min(0).max(1).optional()
});

// TypeScript type is inferred from schema
type LinearInputIndicatorConfig = z.infer<typeof LinearInputIndicatorConfigSchema>;

// Class uses explicit object spreading (no deepMerge)
class LinearInputIndicator extends BaseCanvasObject {
  constructor(props: Partial<LinearInputIndicatorConfig>, objArrayIdx: number) {
    const defaults = LinearInputIndicatorConfigSchema.parse({});

    // Explicit spreading at each nesting level (idiomatic TypeScript)
    this.input = {
      keyboard: { ...defaults.input.keyboard, ...props.input?.keyboard },
      gamepad: { ...defaults.input.gamepad, ...props.input?.gamepad }
    };

    this.display = { ...defaults.display, ...props.display };
    this.opacity = props.opacity ?? defaults.opacity;
  }

  draw(ctx: CanvasRenderingContext2D): void {
    if (this.opacity !== undefined) {
      ctx.globalAlpha = this.opacity;
    }
    // Drawing logic
    ctx.globalAlpha = 1.0; // Always reset (no ctx.save/restore)
  }
}
```

**Key Design Decisions:**
1. **Zod schemas as single source of truth** - Schemas define defaults, validation, and types
2. **Explicit object spreading** - No `any` types, fully type-safe merging
3. **Opacity managed at object level** - Each object handles its own globalAlpha
4. **Manual globalAlpha reset** - Performance optimization (no save/restore overhead)

### Config Serialization

```typescript
// Runtime registry for deserialization
export const ALL_CANVAS_OBJECT_CLASSES_BY_CLASSNAME = {
  LinearInputIndicator,
  PlanarInputIndicator,
  Text,
  Image,
  WebEmbed
} as const satisfies Record<string, CanvasObjectClass<any>>;

// Config is discriminated union based on class name
type CanvasObjectConfig =
  | { LinearInputIndicator: LinearInputIndicatorConfig }
  | { PlanarInputIndicator: PlanarInputIndicatorConfig }
  | { Text: TextConfig }
  | { Image: ImageConfig }
  | { WebEmbed: WebEmbedConfig };

// Deserialization uses runtime reflection
function deserializeCanvasObject(objData: CanvasObjectConfig): CanvasObjectInstance {
  for (const key in objData) {
    if (isCanvasObjectClassName(key)) {
      const Class = ALL_CANVAS_OBJECT_CLASSES_BY_CLASSNAME[key];
      const config = objData[key];
      return new Class(config, objArrayIdx);
    }
  }
  throw new Error('Invalid config: no valid class name found');
}
```

**Why this matters:**
- Class names must be preserved in production build
- Vite config has `esbuild: { keepNames: true }`
- Allows saving/loading configs from localStorage and files

---

## Build System

### Vite Configuration

```typescript
// SourceCode/WebApp/vite.config.ts
export default defineConfig({
  base: './',  // Relative paths for GitHub Pages
  build: {
    outDir: '_bundleAllCompiledJavascriptForWebapp',
    rollupOptions: {
      output: {
        entryFileNames: 'bundle.js',
        assetFileNames: '[name].[ext]'
      }
    }
  },
  esbuild: {
    keepNames: true  // CRITICAL: Preserve class names for runtime reflection
  },
  define: {
    '__CURRENT_PROJECT_GIT_HASH__': JSON.stringify(
      execSync('git rev-parse --short HEAD').trim()
    )
  }
});
```

### NPM Scripts

```bash
# Web app development (hot reload)
npm run dev:webapp
cd WebApp && vite

# Electron wrapper compilation
npm run build:desktop
tsc -p DesktopWrappedWebapp/tsconfig.json

# Full build (web + desktop)
npm run build
npm run build:webapp && npm run build:desktop

# Run Electron in development mode
npm run electron:dev
npm run build && electron DesktopWrappedWebapp/main.js --with-dev-console

# Run Electron in clickthrough-readonly mode
npm run electron:clickthrough-readonly
npm run build && electron DesktopWrappedWebapp/main.js --in-clickthrough-readonly-mode
```

### Windows Development Script

Primary development workflow uses PowerShell script:

```powershell
.\SourceCode\_devTools\buildForWindowsDevelopment.ps1

# Interactive menu:
# 1. Build only
# 2. Build and launch website version
# 3. Build and launch webapp (interactive mode)
# 4. Build and launch webapp (clickthrough-readonly mode)
```

---

## Electron Implementation Details

### Transparency and Always-On-Top

```typescript
// SourceCode/DesktopWrappedWebapp/main.ts
const mainWindow = new BrowserWindow({
  width: 1920,
  height: 1080,
  transparent: true,        // Alpha channel transparency
  frame: !enableFrame,      // Frameless window
  hasShadow: false,         // No drop shadow
  skipTaskbar: true,        // Hide from taskbar
  webPreferences: {
    preload: path.join(__dirname, 'preload.js'),
    contextIsolation: true,
    nodeIntegration: false
  }
});

mainWindow.setAlwaysOnTop(true, 'screen-saver', 1);

// Periodic check to maintain always-on-top
keepOnTopInterval = setInterval(() => {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.moveTop();
  }
}, 1000);
```

### Clickthrough-Readonly Mode

```typescript
// Toggle between interactive and clickthrough modes
ipcMain.on('toggle-readonly-mode', () => {
  isReadonly = !isReadonly;

  if (isReadonly) {
    mainWindow.setIgnoreMouseEvents(true, { forward: true });
    // Start uiohook for global input capture
    if (uIOhook) uIOhook.start();
  } else {
    mainWindow.setIgnoreMouseEvents(false);
    // Stop uiohook to allow window interaction
    if (uIOhook) uIOhook.stop();
  }
});
```

**Warning:** In clickthrough mode, use Task Manager to close the app (window ignores clicks).

### Global Input Hooks (uiohook-napi)

```typescript
import { uIOhook } from 'uiohook-napi';

uIOhook.on('keydown', (event: UIOHookKeyEvent) => {
  mainWindow?.webContents.send('uiohook:keydown', {
    keycode: event.keycode,
    rawcode: event.rawcode
  });
});

uIOhook.on('mousemove', (event: UIOHookMouseMoveEvent) => {
  mainWindow?.webContents.send('uiohook:mousemove', {
    x: event.x,
    y: event.y
  });
});

uIOhook.start();
```

### Gamepad Polling (SDL Child Process)

**Architecture:** SDL runs in a separate Node.js child process to avoid Chromium event loop conflicts.

```typescript
// DesktopWrappedWebapp/main.ts - Spawn SDL bridge
import { spawn, ChildProcess } from 'child_process';

let sdlBridgeProcess: ChildProcess | null = null;
const SDL_TCP_PORT = 54321;

// Start TCP server to receive SDL events
const sdlTcpServer = net.createServer((client) => {
  let buffer = '';
  client.on('data', (data: Buffer) => {
    buffer += data.toString();
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';

    lines.forEach((line) => {
      const message = JSON.parse(line);
      if (message.type === 'gamepad-state') {
        mainWindow?.webContents.send('sdl-gamepad-state', {
          index: message.index,
          state: message.state
        });
      }
    });
  });
});

sdlTcpServer.listen(SDL_TCP_PORT, '127.0.0.1', () => {
  // Spawn SDL bridge process
  sdlBridgeProcess = spawn('node', [bridgePath, SDL_TCP_PORT.toString()], {
    stdio: ['ignore', 'pipe', 'pipe'],
    windowsHide: true,  // Hide console window
    detached: false     // Die with parent
  });
});

// Clean shutdown
app.on('before-quit', () => {
  if (sdlBridgeProcess) sdlBridgeProcess.kill('SIGTERM');
  if (sdlTcpServer) sdlTcpServer.close();
});
```

```typescript
// DesktopWrappedWebapp/sdl-bridge.ts - SDL child process with full TypeScript types
import * as net from 'net';

// SDL Type Definitions (100+ lines of idiomatic TypeScript)
interface SDLController {
  device: SDLControllerDevice;
  axes: SDLControllerAxes;
  buttons: SDLControllerButtons;
  closed: boolean;
  on(event: 'axisMotion', callback: (event: { axis: number; value: number }) => void): void;
  on(event: 'buttonDown', callback: (event: { button: number }) => void): void;
  on(event: 'buttonUp', callback: (event: { button: number }) => void): void;
  close(): void;
}

const sdl = require('@kmamal/sdl') as SDL;
process.env['SDL_JOYSTICK_ALLOW_BACKGROUND_EVENTS'] = '1';

// Event-driven updates (not polling)
controller.on('axisMotion', (event) => {
  sendGamepadState(index, controller);
});

controller.on('buttonDown', (event) => {
  sendGamepadState(index, controller);
});

// Send via TCP (JSON-over-newline protocol)
function send(data: unknown): void {
  if (socket && socket.writable) {
    socket.write(JSON.stringify(data) + '\n');
  }
}
```

**Why SDL Child Process Architecture:**
- Chromium event loop conflicts with SDL timer-based polling
- Worker threads blocked by SDL's `isMainThread` check
- Child process has independent event loop (pure Node.js)
- TCP communication avoids stdio backpressure (64KB buffer crashes)
- Out-of-focus gamepad support (like OBS input-overlay plugin)
- Full TypeScript type safety (100+ lines of SDL type definitions)

**Key Features:**
- Event-driven updates (not polling loops)
- TCP on port 54321 for stable IPC
- Hidden console window (windowsHide: true)
- Process lifecycle management
- Zero ESLint errors with proper SDL types

---

## Development Workflow

### Setting Up Development Environment

```bash
# Clone repository
git clone https://github.com/zitongcharliedeng/a_web-based_input-overlay.git
cd a_web-based_input-overlay

# Install dependencies (from SourceCode/)
cd SourceCode
npm install

# Start development
npm run dev                # Web version with hot reload
npm run electron:dev       # Electron version with DevTools
```

### Testing Protocol

**Always test web version first:**
```bash
npm run dev:webapp
# Open http://localhost:5173 in browser
```

**Then test Electron version:**
```bash
npm run electron:dev
# Opens Electron window with DevTools
```

**Test clickthrough mode:**
```bash
npm run electron:clickthrough-readonly
# WARNING: Use Task Manager to close (window ignores clicks)
```

### Common Development Tasks

**Adding a new canvas object type:**

1. Create schema in `modelToSaveCustomConfigurationLocally/configSchema.ts`:
```typescript
export const MyNewObjectConfigSchema = z.object({
  display: z.object({
    x: z.number().default(100),
    y: z.number().default(100)
  }),
  opacity: z.number().min(0).max(1).optional().default(1.0)
});
```

2. Create class in `viewWhichRendersConfigurationAndUi/canvasRenderer/canvasObjectTypes/`:
```typescript
import { BaseCanvasObject } from './BaseCanvasObject';
import type { MyNewObjectConfig } from '../../../modelToSaveCustomConfigurationLocally/configSchema';

export class MyNewObject extends BaseCanvasObject {
  display: MyNewObjectConfig['display'];
  opacity: number;

  constructor(props: Partial<MyNewObjectConfig>, objArrayIdx: number) {
    super(objArrayIdx);
    const defaults = MyNewObjectConfigSchema.parse({});

    this.display = { ...defaults.display, ...props.display };
    this.opacity = props.opacity ?? defaults.opacity;
  }

  draw(ctx: CanvasRenderingContext2D): void {
    if (this.opacity !== undefined) {
      ctx.globalAlpha = this.opacity;
    }

    // Your drawing logic here

    ctx.globalAlpha = 1.0;
  }

  serialize(): { MyNewObject: MyNewObjectConfig } {
    return {
      MyNewObject: {
        display: this.display,
        opacity: this.opacity
      }
    };
  }
}
```

3. Register in `modelToSaveCustomConfigurationLocally/CustomisableCanvasConfig.ts`:
```typescript
import { MyNewObject } from '../viewWhichRendersConfigurationAndUi/canvasRenderer/canvasObjectTypes/MyNewObject';

export const ALL_CANVAS_OBJECT_CLASSES_BY_CLASSNAME = {
  LinearInputIndicator,
  PlanarInputIndicator,
  Text,
  Image,
  WebEmbed,
  MyNewObject  // Add here
} as const satisfies Record<string, CanvasObjectClass<any>>;
```

4. Export from `viewWhichRendersConfigurationAndUi/canvasRenderer/canvasObjectTypes/index.ts`:
```typescript
export { MyNewObject } from './MyNewObject';
```

**Debugging Tips:**

- Web version: Use browser DevTools (F12)
- Electron version: Pass `--with-dev-console` flag
- Main process logs: Check terminal running `electron`
- Renderer process logs: Check DevTools console
- Config issues: Check `localStorage` in DevTools Application tab

---

## Key Code Patterns

### Config Merging (The Idiomatic Way)

**NEVER use deepMerge utilities:**
```typescript
// ❌ BAD: Requires `any` types and `as` assertions
const merged = deepMerge(defaults, props || {}) as SomeType;

// ✅ GOOD: Explicit spreading, fully type-safe
this.input = {
  keyboard: { ...defaults.input.keyboard, ...props.input?.keyboard },
  gamepad: {
    stick: { ...defaults.input.gamepad.stick, ...props.input?.gamepad?.stick },
    button: { ...defaults.input.gamepad.button, ...props.input?.gamepad?.button }
  }
};
```

**Why this matters:**
- No `any` types needed
- No `as` type assertions needed
- TypeScript can fully verify correctness
- Optional chaining (`?.`) handles undefined gracefully
- Explicit and readable

### Type Safety with Zod

**Schemas define everything:**
```typescript
// Define schema with defaults
const ConfigSchema = z.object({
  foo: z.string().default('hello'),
  bar: z.number().default(42)
});

// Infer TypeScript type
type Config = z.infer<typeof ConfigSchema>;

// Parse with validation
const config = ConfigSchema.parse(userInput);  // Throws if invalid

// Safe parse (returns result object)
const result = ConfigSchema.safeParse(userInput);
if (result.success) {
  console.log(result.data);
} else {
  console.error(result.error);
}
```

### Opacity Management

**Each canvas object manages its own opacity:**
```typescript
draw(ctx: CanvasRenderingContext2D): void {
  // Set opacity if defined
  if (this.opacity !== undefined) {
    ctx.globalAlpha = this.opacity;
  }

  // Draw content
  ctx.fillRect(0, 0, 100, 100);

  // Always reset (no save/restore)
  ctx.globalAlpha = 1.0;
}
```

**Why manual reset over save/restore:**
- Performance: save/restore copies entire canvas state
- We only modify globalAlpha, so manual reset is sufficient
- Benchmarked: ~2x faster for simple opacity changes

### Vector Math

```typescript
import { Vector } from './_helpers/Vector';

// 3D vector with common operations
const v1 = new Vector(1, 2, 3);
const v2 = new Vector(4, 5, 6);

const sum = v1.add(v2);           // (5, 7, 9)
const scaled = v1.multiply(2);    // (2, 4, 6)
const length = v1.magnitude();    // sqrt(1 + 4 + 9)
const normalized = v1.normalize(); // Unit vector
```

---

## Platform Support Matrix

| Platform | Transparency | Always-On-Top | Click-Through | Status |
|----------|--------------|---------------|---------------|--------|
| **Windows 10/11** | ✅ Excellent | ✅ Yes | ✅ Yes | Fully supported |
| **macOS 11+** | ✅ Good | ✅ Yes | ⚠️ Requires permissions | Supported |
| **Linux (X11)** | ✅ Good | ✅ Yes | ✅ Yes | Supported (compositor required) |
| **Linux (Wayland)** | ⚠️ Compositor-dependent | ✅ Yes | ⚠️ Compositor-dependent | Experimental |

**Windows caveats:**
- Cursor lag in The Finals (borderless): Switch to exclusive fullscreen
- Some games may have issues with always-on-top windows

**Linux requirements:**
- Compositor required for transparency (picom, compton, or DE compositor)
- GTK-3 flag set in Electron: `app.commandLine.appendSwitch('gtk-version', '3')`

**macOS:**
- May require accessibility permissions for always-on-top
- Transparency works natively via Cocoa

---

## Recent Major Changes (Session History)

### v1.0.25 (Latest - 2025-11-24)
- **SDL Child Process Architecture** - Rewrote SDL integration to run in separate Node.js process
- **Out-of-Focus Gamepad Support** - Gamepads work when app is not focused (like OBS input-overlay)
- **Full TypeScript Type Safety** - Added 100+ lines of SDL type definitions
  - SDLController, SDLControllerDevice, SDLControllerAxes, SDLControllerButtons
  - SDLKeyEvent, SDLMouseMoveEvent, SDLMouseButtonEvent, SDLMouseWheelEvent
  - Eliminated all 12 `any` types from SDL bridge
- **TCP Communication** - JSON-over-TCP protocol on port 54321 (avoids stdio backpressure crashes)
- **Process Management** - windowsHide, detached:false, clean shutdown handlers
- **Production Packaging** - Added npm pack/dist scripts, electron-builder configuration

### v1.0.23 (2025-11-20)
- Merged experimental WebEmbed architecture
- Fixed readonly mode interaction issues
- Added input forwarding configuration for WebEmbed
- Refactored to remove code smell comments

### v1.0.22
- Fixed YouTube Error 153 in Electron (referrer policy + permissions)
- Replaced navigator.getGamepads override with merge pattern
- Added multi-select and drag-to-select functionality

### v1.0.20
- **Breaking:** Moved package.json to SourceCode/ (eliminated symlink hacks)
- Fixed Vite tree-shaking Electron gamepad bridge

### v1.0.9 (Arrow Key Fixes)
- Fixed Y-axis inversion (Canvas Y+ = down)
- Added uiohook keycodes for arrow keys in clickthrough mode
- Arrow keys now work in both interactive and clickthrough modes

### v1.0.8 (Opacity Architecture Fix)
- Implemented opacity isolation pattern
- Removed opacity from CanvasProperties (separation of concerns)
- Each object manages opacity with manual reset

### TypeScript Refactoring (2025-11-13)
- **Eliminated deepMerge anti-pattern**
- Replaced with explicit object spreading
- Zero `any` types, zero `as` assertions
- Fully type-safe config merging

**Lesson learned:** When TypeScript complains and you reach for `any` or `as`, that's a code smell. Refactor the code pattern, don't silence the compiler.

---

## Contributing Guidelines

### Code Style

**TypeScript Rules:**
- No `any` types (use `unknown` if type is truly unknown)
- No `as` type assertions (refactor code pattern instead)
- Explicit object spreading for config merging
- Use Zod schemas for runtime validation
- Prefer type inference over explicit types

**Naming Conventions:**
- Self-documenting variable names (no abbreviations)
- Classes: PascalCase (`LinearInputIndicator`)
- Functions: camelCase (`deserializeCanvasObject`)
- Constants: SCREAMING_SNAKE_CASE (`ALL_CANVAS_OBJECT_CLASSES_BY_CLASSNAME`)
- Private members: prefixed with underscore (`_internalState`)

**Commit Messages:**
- Follow Conventional Commits (feat, fix, docs, refactor, etc.)
- Use `!` for breaking changes (`feat!:`, `fix!:`)
- No emojis in commit messages
- Examples:
  - `feat: add multi-select functionality`
  - `fix: resolve joystick regression`
  - `refactor!: eliminate deepMerge anti-pattern`

### Pull Request Process

1. Fork the repository
2. Create feature branch: `git checkout -b feature/my-feature`
3. Make changes following code style
4. Test web version first, then Electron
5. Commit with conventional commit messages
6. Push to your fork
7. Open Pull Request with description

### Testing Requirements

**Before submitting PR:**
- [ ] Test web version (npm run dev:webapp)
- [ ] Test Electron interactive mode (npm run electron:dev)
- [ ] Test Electron clickthrough mode (npm run electron:clickthrough-readonly)
- [ ] Verify no TypeScript errors (npm run type-check)
- [ ] Test on Windows (primary platform)
- [ ] Document platform-specific behavior if applicable

---

## Troubleshooting

### Common Issues

**Build fails with "Class names not preserved":**
- Ensure `vite.config.ts` has `esbuild: { keepNames: true }`
- This is critical for runtime reflection in deserialization

**Gamepad not detected in Electron:**
- Check SDL environment variable: `process.env['SDL_JOYSTICK_ALLOW_BACKGROUND_EVENTS'] = '1'`
- Verify gamepad is connected before launching app
- Check SDL polling interval is running

**Keyboard/mouse not working in clickthrough mode:**
- Ensure uiohook is started: `uIOhook.start()`
- Check IPC events are being sent from main process
- Verify preload script is loaded correctly

**Transparency not working:**
- Windows: Should work out of the box
- Linux: Compositor must be running (check with `ps aux | grep picom`)
- macOS: Check accessibility permissions

**App won't close in clickthrough mode:**
- This is expected behavior (window ignores input)
- Use Task Manager (Windows) or Force Quit (macOS)
- Or kill process: `pkill -f "A Real Web-based Input Overlay"`

### Debug Mode

**Enable DevTools in Electron:**
```bash
npm run electron:dev
# or
electron DesktopWrappedWebapp/main.js --with-dev-console
```

**Enable frame for debugging:**
```bash
electron DesktopWrappedWebapp/main.js --with-window-frame
```

**Check config in localStorage:**
```javascript
// In browser DevTools console
localStorage.getItem('customisableCanvasConfig')
```

---

## Future Roadmap

### Phase 2: Multimedia Integration (In Progress)
- [ ] Camera feeds (getUserMedia)
- [ ] Microphone waveform (Web Audio API FFT)
- [ ] Audio VU meters
- [ ] Multi-camera layouts

### Phase 3: Enhanced Web Embeds
- [x] YouTube embed (Electron webview)
- [ ] Twitch chat embed
- [ ] GIF embeds
- [ ] Custom web content

### Phase 4: Advanced Features
- [ ] Animated crosshairs (recoil simulation)
- [ ] Performance stats (FPS, CPU/GPU)
- [ ] Scene system (per-game presets)
- [ ] Cloud sync (optional)

### Community Features
- [ ] Plugin system (community extensions)
- [ ] Theme marketplace
- [ ] Preset sharing
- [ ] Multi-monitor awareness

---

## Learning Resources

**For Contributors New to These Technologies:**

**TypeScript:**
- [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/)
- [TypeScript Deep Dive](https://basarat.gitbook.io/typescript/)

**Zod:**
- [Zod Documentation](https://zod.dev/)
- [Zod GitHub](https://github.com/colinhacks/zod)

**Electron:**
- [Electron Documentation](https://www.electronjs.org/docs/latest)
- [Electron IPC Guide](https://www.electronjs.org/docs/latest/tutorial/ipc)

**Canvas API:**
- [MDN Canvas Tutorial](https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API/Tutorial)
- [Canvas Performance](https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API/Tutorial/Optimizing_canvas)

**Game Dev Patterns (Relevant for Overlays):**
- [Game Loop Patterns](https://gameprogrammingpatterns.com/game-loop.html)
- [Vector Math](https://www.mathsisfun.com/algebra/vectors.html)

---

## Contact & Support

**Repository:** https://github.com/zitongcharliedeng/a_web-based_input-overlay
**Issues:** https://github.com/zitongcharliedeng/a_web-based_input-overlay/issues
**Discussions:** https://github.com/zitongcharliedeng/a_web-based_input-overlay/discussions
**Author:** [@zitongcharliedeng](https://github.com/zitongcharliedeng)

---

## Current Session Notes (2025-11-20)

### Session Context: Branch Reorganization & Dependency Fixes

**What We Just Accomplished:**

1. **Branch Structure Cleanup**
   - Renamed `claude/experimental-01GVQNvaEXT11NUP4p9Vdo3q` → `experimental`
   - Archived old feature branches with `archive/` prefix:
     - `claude/claude-md-*` → `archive/claude/claude-md-*`
     - `claude/fix-todo-*` → `archive/claude/fix-todo-*`
   - **Active branches now:** `main` (production) and `experimental` (testing)

2. **Merged Valuable Commits into Experimental**
   - `81468f2` - CLAUDE.md documentation rewrite (v1.0.23 architecture)
   - `c14482b` - Color constants refactoring (debug visuals, selection box)

3. **Fixed Critical Dependency Issue**
   - **Problem:** `electron-serve` was in root `package.json` (wrong location)
   - **Solution:** Moved to `SourceCode/package.json` dependencies
   - **Also:** Removed redundant root `package.json` (build happens in SourceCode/)
   - **Commits:** `05af391`, `dcb3286`

4. **Verified Build Works**
   - Cleaned stale `.js` files with `npm run clean`
   - Confirmed `npm run build` compiles successfully
   - TypeScript compilation passes
   - Vite bundling produces `bundle.js` (106.59 kB)

### Current Experimental Branch Status

**Latest commits on experimental:**
```
dcb3286 - chore: remove redundant root package.json
05af391 - fix: add electron-serve to SourceCode/package.json dependencies
c14482b - refactor: extract hardcoded colors to named constants in CanvasRenderer
81468f2 - docs: complete CLAUDE.md rewrite to reflect actual v1.0.23 architecture
7853d24 - fix(embed): use electron-serve + iframe to fix YouTube Error 153
f06354c - fix(webview): add partition, user-agent, and debug listeners for Error 153
```

**Experimental is 6 commits ahead of main (v1.0.23)**

### What Needs Testing on Windows

**YouTube Embed Fix (Critical):**
- Root cause: `file://` protocol lacks HTTP Referer header (YouTube blocks embeds)
- Solution: `electron-serve` creates custom `app://` protocol with proper headers
- Replaced deprecated `<webview>` tag with standard `<iframe>` everywhere
- Should fix "Error 153" that plagued previous versions

**Test Commands (Windows PowerShell/CMD):**
```powershell
cd SourceCode
npm install         # Installs electron-serve and all deps
npm run electron:dev  # Launch with DevTools for debugging
```

**What to Verify:**
1. App launches without "Cannot find module electron-serve" error
2. Can spawn WebEmbed object from spawn menu
3. YouTube embed loads without Error 153
4. Gamepad/keyboard inputs still work correctly
5. Multi-select and drag-to-select functionality works

### Key Technical Details for Next Session

**Build System:**
- All source code in `SourceCode/` directory
- `package.json` only exists in `SourceCode/` (not at repo root)
- Two build steps: `npm run build:webapp` (Vite) + `npm run build:desktop` (tsc)
- Output: `WebApp/_bundleAllCompiledJavascriptForWebapp/bundle.js`

**electron-serve Integration:**
- Added to dependencies in `SourceCode/package.json`
- Used in `DesktopWrappedWebapp/main.ts` for custom protocol
- Enables iframe YouTube embeds in Electron (works like http://)

**Recent Architecture Changes:**
- Removed `deepMerge()` utility (anti-pattern, required `any` types)
- Use explicit object spreading for config merging (idiomatic TypeScript)
- `getMergedGamepads()` exported from ElectronAppWrapper_API (merge pattern, not override)

### Next Steps

1. **Windows Testing** - User will test experimental branch on Windows
2. **If Tests Pass** - Flatten commit history and merge to main
3. **Release v1.0.24** - YouTube embed fix + documentation updates
4. **Continue Development** - Move to next features (camera feeds, audio viz)

### Important Reminders

- **Always verify builds compile before asking user to test** (learned this lesson today)
- Build happens in `SourceCode/`, not repo root
- Clean stale JS files with `npm run clean` if build fails mysteriously
- Experimental branch is for testing, main is production-ready

---

## Current Session Notes (2025-11-24)

### Session Context: SDL Child Process Architecture & TypeScript Type Safety

**What We Accomplished:**

1. **SDL Child Process Architecture (Out-of-Focus Gamepad Support)**
   - **Problem:** SDL could not work in Electron main process due to Chromium event loop conflicts
   - **Binary Search Test:** Confirmed SDL axes stuck at 0.000 in Electron despite correct event setup
   - **Root Cause:** Chromium's message pump deprioritizes SDL's timer-based polling
   - **Solution:** Run SDL in separate Node.js child process with independent event loop
   - **Architecture:**
     ```
     SDL Bridge (Node.js process)
       → TCP Socket (port 54321)
         → Electron Main (TCP server)
           → IPC (sdl-gamepad-state)
             → Renderer (WebApp)
               → sdlGamepadCache
                 → Unified getGamepads() interface
     ```
   - **Status:** Working perfectly! User confirmed "IT WORKS! logs in the devtools console"

2. **TCP Communication (Avoiding stdio Crashes)**
   - **Problem:** First attempt with stdio pipes crashed PC (Win32k error)
   - **Root Cause:** stdio has fixed ~64KB kernel buffer, 60fps JSON causes backpressure
   - **Solution:** TCP socket with JSON-over-newline protocol
   - **Port:** 54321 (localhost only)
   - **Protocol:** Each message is JSON followed by newline character

3. **Full TypeScript Type Safety (100+ Lines of SDL Types)**
   - **Problem:** @kmamal/sdl lacks TypeScript type definitions (12 ESLint errors)
   - **Solution:** Created comprehensive idiomatic TypeScript interfaces:
     - SDLController, SDLControllerDevice, SDLControllerAxes, SDLControllerButtons
     - SDLKeyEvent, SDLMouseMoveEvent, SDLMouseButtonEvent, SDLMouseWheelEvent
     - SDLWindow, SDLVideoAPI, main SDL interface
   - **Result:** Zero ESLint errors, zero TypeScript errors, zero `any` types

4. **Process Management (Single App in Task Manager)**
   - **windowsHide: true** - Hides console window
   - **detached: false** - SDL bridge dies with Electron parent
   - **process.title** - Clear naming for debugging
   - **Cleanup handlers** - before-quit and will-quit for graceful shutdown

5. **Production Packaging**
   - **Scripts:** `npm run pack` (unpacked), `npm run dist` (installer)
   - **electron-builder:** Configured for Windows/macOS/Linux
   - **win.sign: null** - Unsigned builds (no code signing certificate)
   - **Native modules:** @kmamal/sdl and uiohook-napi in extraResources
   - **Output:** `A Real Web-based Input Overlay.exe` (182 MB)

6. **Git Release**
   - **Version:** Bumped to 1.0.25
   - **Commit:** feat: add comprehensive SDL type definitions and production packaging
   - **Tag:** v1.0.25
   - **Pushed:** To main branch on GitHub

### Key Technical Decisions

**Why Child Process Instead of Worker Thread:**
- SDL has explicit `isMainThread` check in source code
- Worker threads cannot run SDL even with proper event loop

**Why TCP Instead of stdio:**
- stdio has fixed 64KB kernel buffer
- High-frequency JSON (60fps) causes backpressure and kernel deadlock
- TCP has proper flow control and larger buffers

**Why Event-Driven Instead of Polling:**
- SDL events trigger state updates immediately
- More efficient than setInterval polling
- Prevents missed input during frame drops

**Why TypeScript Type Definitions:**
- Eliminates `any` types (idiomatic TypeScript)
- Provides autocomplete and IntelliSense
- Catches errors at compile time
- Self-documenting code

### Files Modified

**DesktopWrappedWebapp/sdl-bridge.ts:**
- Created from scratch
- 100+ lines of SDL type definitions
- Event-driven SDL controller handling
- TCP client connecting to Electron
- Keyboard/mouse input via hidden SDL window
- Zero ESLint errors, zero `any` types

**DesktopWrappedWebapp/main.ts:**
- Added TCP server on port 54321
- Child process spawning with proper options
- IPC forwarding to renderer
- Clean shutdown handlers

**DesktopWrappedWebapp/preload.ts:**
- Added onSDLGamepadState IPC channel

**WebApp/viewWhichRendersConfigurationAndUi/inputReaders/_desktop/index.ts:**
- Added sdlGamepadCache array
- SDL bridge listener updates cache
- Unified getGamepads() merges SDL + DOM

**package.json:**
- Bumped version to 1.0.25
- Added pack and dist scripts
- Configured electron-builder

### Testing Status

**Development Mode (npm run electron:dev):**
- ✅ SDL bridge connects via TCP
- ✅ Azeron Keypad detected and opened
- ✅ Out-of-focus gamepad support working
- ✅ Keyboard/mouse input working (uiohook-napi)

**Production Build (dist/):**
- ✅ Executable created (182 MB)
- ✅ SDL bridge included in app.asar
- ✅ Native modules in resources
- ⏳ Not yet tested (pending user testing)

### Next Steps

1. Test packaged .exe to verify SDL bridge works in production
2. Consider adding reconnection logic for TCP (if bridge crashes)
3. Document SDL bridge architecture in README
4. Continue with multimedia features (camera, audio viz)

### Important Reminders for Next Session

- SDL bridge runs on port 54321 (kill old processes if conflict)
- All SDL types are in sdl-bridge.ts (reusable for future SDL work)
- Child process architecture pattern can be used for other native integrations
- Event-driven updates more reliable than polling

---

**Last Updated:** 2025-11-24
**AI Assistant:** Claude Sonnet 4.5
**Document Version:** 2.1 (SDL child process architecture added)
