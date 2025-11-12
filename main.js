const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');

// Enable unfocused joystick input (SDL2 feature - GitHub issue #74)
// This allows gamepad events even when window is not focused
process.env.SDL_JOYSTICK_ALLOW_BACKGROUND_EVENTS = '1';

// Linux GTK compatibility (from stream-overlay)
if (process.platform === 'linux') {
  app.commandLine.appendSwitch('gtk-version', '3');
}

// Parse command line flags
const isReadonly = process.argv.includes('--in-clickthrough-readonly-mode');
const enableFrame = process.argv.includes('--with-window-frame');
const enableDevTools = process.argv.includes('--with-dev-console');
let globalInputAvailable = false;

// Try to initialize uiohook for global input capture
let uIOhook = null;
let mainWindow = null; // Store reference to send events

try {
  const uiohook = require('uiohook-napi');
  uIOhook = uiohook.uIOhook;
  globalInputAvailable = true;
  console.log('[Main] ✓ uiohook-napi loaded successfully');
} catch (error) {
  console.log('[Main] ✗ uiohook-napi not available:', error.message);
  console.log('[Main] Global input hooks disabled (will use DOM events only)');
}

// Try to initialize @kmamal/sdl for gamepad input
// Cross-platform: Windows, Linux, macOS
// With SDL_JOYSTICK_ALLOW_BACKGROUND_EVENTS=1, works unfocused
let sdl = null;
let gamepadAvailable = false;

try {
  sdl = require('@kmamal/sdl');
  gamepadAvailable = true;
  console.log('[Main] ✓ @kmamal/sdl loaded (unfocused gamepad enabled via SDL_JOYSTICK_ALLOW_BACKGROUND_EVENTS)');
} catch (error) {
  console.log('[Main] ✗ @kmamal/sdl not available:', error.message);
  console.log('[Main] Native gamepad polling disabled (will use Web Gamepad API only)');
  console.log('[Main] To install: npm install');
}

// IPC handlers for renderer queries
ipcMain.on('get-readonly-state', (event) => {
  event.returnValue = isReadonly;
});

ipcMain.on('has-global-input', (event) => {
  event.returnValue = globalInputAvailable;
});

console.log('[Main] Starting overlay...');
console.log('[Main] Readonly mode:', isReadonly);
console.log('[Main] Preload script path:', path.join(__dirname, 'preload.js'));

function createWindow() {
  const width = 1600;
  const height = 600;

  // Create BrowserWindow with transparency
  const win = new BrowserWindow({
    width: width,
    height: height,
    transparent: true,
    frame: enableFrame,
    alwaysOnTop: true,
    skipTaskbar: false,
    backgroundColor: '#40404040',  // Semi-transparent grey for debugging
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    }
  });

  // Enhanced always-on-top with screen-saver level
  win.setAlwaysOnTop(true, 'screen-saver', 1);

  // Load the HTML file
  win.loadFile('index.html');

  // Readonly mode: click-through for overlay use (can't edit config)
  // Interactive mode: can drag and edit objects
  if (isReadonly) {
    win.setIgnoreMouseEvents(true);
    console.log('[Main] Readonly mode - click-through enabled, UI editing disabled');

    // Keep window on top (from stream-overlay)
    const keepOnTop = setInterval(() => {
      if (!win.isDestroyed()) {
        win.moveTop();
      }
    }, 1000);

    win.on('closed', () => {
      clearInterval(keepOnTop);
    });
  } else {
    console.log('[Main] Interactive mode - can drag and edit objects');
  }

  // Open DevTools (warning: breaks transparency)
  if (enableDevTools) {
    console.log('[Main] DevTools enabled (transparency will break)');
    win.webContents.openDevTools();
  }

  return win;
}

app.whenReady().then(() => {
  mainWindow = createWindow();

  // Start global input hooks if available
  if (uIOhook) {
    console.log('[Main] Starting global input hooks...');

    let keycode0Count = 0;

    // Keyboard events
    uIOhook.on('keydown', (event) => {
      const data = {
        keycode: event.keycode,
        rawcode: event.rawcode,
        timestamp: Date.now()
      };

      if (data.keycode === 0) {
        keycode0Count++;
        if (keycode0Count === 1 || keycode0Count % 10 === 0) {
          console.log('[Main] Keycode 0 detected (possibly joystick?) - count:', keycode0Count);
        }
      } else {
        console.log('[Main] Global keydown:', data.keycode);
      }

      mainWindow.webContents.send('global-keydown', data);
    });

    uIOhook.on('keyup', (event) => {
      const data = {
        keycode: event.keycode,
        rawcode: event.rawcode,
        timestamp: Date.now()
      };

      if (data.keycode !== 0) {
        console.log('[Main] Global keyup:', data.keycode);
      }

      mainWindow.webContents.send('global-keyup', data);
    });

    // Start the hook
    uIOhook.start();
    console.log('[Main] ✓ Global input hooks started');
  }

  // GAMEPAD NOTE: SDL event-based API is incompatible with Electron's event loop
  // SDL events never fire because Electron controls the main loop
  // OBS plugin uses SDL_GetGamepadButton/Axis polling, but @kmamal/sdl doesn't expose those
  //
  // SOLUTION: Use Web Gamepad API (works natively in Chromium/Electron when focused)
  // For unfocused support on Linux: Chromium already supports it (user confirmed it worked)
  // For Windows: May need alternative approach (investigate later)

  console.log('[Main] Gamepad: Using native Web Gamepad API (works when Electron window focused)');
  console.log('[Main] Note: Unfocused gamepad may work on Linux but not Windows (Chromium behavior)');

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  // Stop global input hooks
  if (uIOhook) {
    console.log('[Main] Stopping global input hooks...');
    uIOhook.stop();
  }

  // Close all SDL controllers
  if (sdl) {
    const openedControllers = new Map(); // Access from closure if needed
    // Controllers will be cleaned up automatically on process exit
  }

  if (process.platform !== 'darwin') {
    app.quit();
  }
});
