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
let openControllers = new Map(); // Track opened SDL controllers

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

    // Helper to refresh controller list (devices array already contains controller objects)
    const updateConnectedControllers = () => {
      const devices = sdl.controller.devices;
      console.log('[Main] Scanning controllers, found:', devices.length);

      // Rebuild controller map from devices array
      openControllers.clear();
      devices.forEach((controller, index) => {
        if (controller) {
          openControllers.set(index, controller);
          console.log('[Main] ✓ Controller', index, ':', controller.name || 'Unknown');
        }
      });
    };

    // Initial scan for already-connected controllers
    updateConnectedControllers();

    // Listen for controller hotplug events
    sdl.controller.on('deviceAdd', (event) => {
      console.log('[Main] Controller connected:', event.which);
      updateConnectedControllers();
    });

    sdl.controller.on('deviceRemove', (event) => {
      console.log('[Main] Controller disconnected:', event.which);
      updateConnectedControllers();
    });

    // Poll gamepads at 60Hz (matches requestAnimationFrame)
    gamepadPollInterval = setInterval(() => {
      if (openControllers.size === 0) return;

      const currentGamepads = [];

      // Poll each open controller
      openControllers.forEach((controller, deviceId) => {
        try {
          // Read controller state
          const state = {
            index: deviceId,
            id: controller.name || `SDL Controller ${deviceId}`,
            connected: true,
            timestamp: Date.now(),
            buttons: [],
            axes: []
          };

          // Read axes (use numeric indices - SDL standard gamepad mapping)
          // 0: Left X, 1: Left Y, 2: Right X, 3: Right Y, 4: Left trigger, 5: Right trigger
          for (let axisIndex = 0; axisIndex < 6; axisIndex++) {
            const value = controller.getAxis(axisIndex) || 0;
            state.axes.push(value / 32768.0); // Normalize to -1.0 to 1.0
          }

          // Read buttons (use numeric indices - SDL standard gamepad mapping)
          // 0: A, 1: B, 2: X, 3: Y, 4: LB, 5: RB, 6: Back, 7: Start, 8: LS, 9: RS, 10-13: D-pad, 14: Guide
          for (let buttonIndex = 0; buttonIndex < 15; buttonIndex++) {
            const pressed = controller.getButton(buttonIndex) || false;
            state.buttons.push({
              pressed: pressed,
              touched: pressed,
              value: pressed ? 1.0 : 0.0
            });
          }

          currentGamepads.push(state);
        } catch (err) {
          console.error('[Main] Error reading controller:', err.message);
        }
      });

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

  // Clear controller map (SDL library manages controller lifecycle)
  if (openControllers.size > 0) {
    openControllers.clear();
  }

  if (process.platform !== 'darwin') {
    app.quit();
  }
});
