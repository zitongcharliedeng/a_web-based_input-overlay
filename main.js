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
// Bundles SDL2 - no separate installation needed
let sdl = null;
let sdlController = null;
let gamepadAvailable = false;

try {
  sdl = require('@kmamal/sdl');
  gamepadAvailable = true;
  console.log('[Main] ✓ @kmamal/sdl loaded (bundled SDL2, cross-platform)');
} catch (error) {
  console.log('[Main] ✗ @kmamal/sdl not available:', error.message);
  console.log('[Main] Native gamepad polling disabled (will use Web Gamepad API only)');
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

  // Start SDL gamepad polling if available
  if (sdl) {
    console.log('[Main] Searching for SDL controllers...');

    // Find first available controller
    const devices = sdl.controller.devices;
    if (devices.length > 0) {
      const device = devices[0];
      console.log('[Main] Found controller:', device.name);

      try {
        sdlController = sdl.controller.openDevice(device.id);
        console.log('[Main] Controller opened successfully');

        // Store gamepad state (standard Web Gamepad API format)
        const gamepadState = {
          axes: [0, 0, 0, 0],
          buttons: Array(17).fill(null).map(() => ({ pressed: false, value: 0 })),
          timestamp: Date.now(),
          connected: true
        };

        // Poll controller state at 60fps (16ms interval)
        const pollInterval = setInterval(() => {
          if (!sdlController) {
            clearInterval(pollInterval);
            return;
          }

          // Read axes from controller.axes object
          // @kmamal/sdl exposes: leftStickX, leftStickY, rightStickX, rightStickY, leftTrigger, rightTrigger
          const axes = sdlController.axes || {};
          gamepadState.axes[0] = axes.leftStickX || 0;
          gamepadState.axes[1] = axes.leftStickY || 0;
          gamepadState.axes[2] = axes.rightStickX || 0;
          gamepadState.axes[3] = axes.rightStickY || 0;

          // Read buttons from controller.buttons object
          const buttons = sdlController.buttons || {};
          gamepadState.buttons[0] = { pressed: buttons.a || false, value: buttons.a ? 1.0 : 0 };
          gamepadState.buttons[1] = { pressed: buttons.b || false, value: buttons.b ? 1.0 : 0 };
          gamepadState.buttons[2] = { pressed: buttons.x || false, value: buttons.x ? 1.0 : 0 };
          gamepadState.buttons[3] = { pressed: buttons.y || false, value: buttons.y ? 1.0 : 0 };
          gamepadState.buttons[4] = { pressed: buttons.leftShoulder || false, value: buttons.leftShoulder ? 1.0 : 0 };
          gamepadState.buttons[5] = { pressed: buttons.rightShoulder || false, value: buttons.rightShoulder ? 1.0 : 0 };
          gamepadState.buttons[6] = { pressed: (axes.leftTrigger || 0) > 0.1, value: Math.max(0, axes.leftTrigger || 0) };
          gamepadState.buttons[7] = { pressed: (axes.rightTrigger || 0) > 0.1, value: Math.max(0, axes.rightTrigger || 0) };
          gamepadState.buttons[8] = { pressed: buttons.back || false, value: buttons.back ? 1.0 : 0 };
          gamepadState.buttons[9] = { pressed: buttons.start || false, value: buttons.start ? 1.0 : 0 };
          gamepadState.buttons[10] = { pressed: buttons.leftStick || false, value: buttons.leftStick ? 1.0 : 0 };
          gamepadState.buttons[11] = { pressed: buttons.rightStick || false, value: buttons.rightStick ? 1.0 : 0 };
          gamepadState.buttons[12] = { pressed: buttons.dpadUp || false, value: buttons.dpadUp ? 1.0 : 0 };
          gamepadState.buttons[13] = { pressed: buttons.dpadDown || false, value: buttons.dpadDown ? 1.0 : 0 };
          gamepadState.buttons[14] = { pressed: buttons.dpadLeft || false, value: buttons.dpadLeft ? 1.0 : 0 };
          gamepadState.buttons[15] = { pressed: buttons.dpadRight || false, value: buttons.dpadRight ? 1.0 : 0 };
          gamepadState.buttons[16] = { pressed: buttons.guide || false, value: buttons.guide ? 1.0 : 0 };

          gamepadState.timestamp = Date.now();
          mainWindow.webContents.send('global-gamepad-state', gamepadState);
        }, 16);

        console.log('[Main] ✓ SDL gamepad polling started (60fps via setInterval)');
      } catch (error) {
        console.log('[Main] ✗ Failed to open controller:', error.message);
      }
    } else {
      console.log('[Main] No controllers detected');
    }
  }

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
