const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');

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

// Try to initialize SDL for gamepad capture
let sdl = null;
let gamepadPollInterval = null;
let connectedGamepads = new Map(); // Track connected gamepads by device ID

try {
  sdl = require('@kmamal/sdl');
  console.log('[Main] ✓ @kmamal/sdl loaded successfully');
} catch (error) {
  console.log('[Main] ✗ @kmamal/sdl not available:', error.message);
  console.log('[Main] SDL gamepad support disabled (will use Web Gamepad API only)');
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

    // Keyboard events
    uIOhook.on('keydown', (event) => {
      const data = {
        keycode: event.keycode,
        rawcode: event.rawcode,
        timestamp: Date.now()
      };
      console.log('[Main] Global keydown:', data.keycode);
      mainWindow.webContents.send('global-keydown', data);
    });

    uIOhook.on('keyup', (event) => {
      const data = {
        keycode: event.keycode,
        rawcode: event.rawcode,
        timestamp: Date.now()
      };
      console.log('[Main] Global keyup:', data.keycode);
      mainWindow.webContents.send('global-keyup', data);
    });

    // Start the hook
    uIOhook.start();
    console.log('[Main] ✓ Global input hooks started');
  }

  // Start SDL gamepad polling if available
  if (sdl) {
    console.log('[Main] Starting SDL gamepad polling...');

    // Poll gamepads at 60Hz (matches requestAnimationFrame)
    gamepadPollInterval = setInterval(() => {
      const controllers = sdl.controller.devices;
      const currentGamepads = [];

      // Poll each connected controller
      for (let i = 0; i < controllers.length; i++) {
        try {
          const controller = controllers[i];
          if (!controller) continue;

          // Read controller state
          const state = {
            index: i,
            id: controller.name || `SDL Controller ${i}`,
            connected: true,
            timestamp: Date.now(),
            buttons: [],
            axes: []
          };

          // Read axes (normalize to -1.0 to 1.0 range)
          const axisCount = 6; // Standard gamepad has 6 axes
          for (let a = 0; a < axisCount; a++) {
            const value = controller.getAxis(a) || 0;
            state.axes.push(value / 32768.0); // SDL returns -32768 to 32767
          }

          // Read buttons
          const buttonCount = 17; // Standard gamepad has 17 buttons
          for (let b = 0; b < buttonCount; b++) {
            const pressed = controller.getButton(b) || false;
            state.buttons.push({
              pressed: pressed,
              touched: pressed,
              value: pressed ? 1.0 : 0.0
            });
          }

          currentGamepads.push(state);
        } catch (err) {
          console.error('[Main] Error reading controller', i, ':', err.message);
        }
      }

      // Send gamepad state to renderer
      if (currentGamepads.length > 0) {
        mainWindow.webContents.send('global-gamepad-state', currentGamepads);
      }
    }, 16); // ~60Hz (16ms)

    console.log('[Main] ✓ SDL gamepad polling started at 60Hz');
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

  // Stop SDL gamepad polling
  if (gamepadPollInterval) {
    console.log('[Main] Stopping SDL gamepad polling...');
    clearInterval(gamepadPollInterval);
    gamepadPollInterval = null;
  }

  if (process.platform !== 'darwin') {
    app.quit();
  }
});
