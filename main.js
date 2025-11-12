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

  // Start SDL gamepad polling
  if (sdl) {
    console.log('[Main] Initializing SDL gamepad polling...');
    console.log('[Main] Trying both Controller API (high-level) and Joystick API (low-level)');

    // Store current gamepad state (normalized to -1 to 1 range)
    const gamepadState = {
      axes: [0, 0, 0, 0], // leftx, lefty, rightx, righty
      buttons: Array(17).fill(false).map(() => ({ pressed: false, value: 0 }))
    };

    // Track opened devices
    const openedControllers = new Map();
    const openedJoysticks = new Map();

    // Try SDL Controller API first (game controller abstraction)
    sdl.controller.on('deviceAdd', (device) => {
      console.log('[Main] Controller API: Gamepad connected:', device.name);

      try {
        // Open the device to get controller instance
        const controller = sdl.controller.openDevice(device);
        openedControllers.set(device.id, controller);

        // DEBUG: Log all controller properties
        console.log('[Main] DEBUG: Controller object keys:', Object.keys(controller));
        console.log('[Main] DEBUG: Controller.axes:', controller.axes);
        console.log('[Main] DEBUG: Controller.buttons:', controller.buttons);

        console.log('[Main] Controller opened successfully:', device.name);
        console.log('[Main] Testing if ANY SDL events fire with wildcard listener...');

        // Listen to ALL events to see if ANY events fire
        controller.on('*', (eventType, ...args) => {
          console.log('[Main] SDL Event fired!', eventType, args);
        });

        console.log('[Main] Using POLLING mode (like OBS plugin - events do not fire)');

        // OBS-style polling: Read controller.axes and controller.buttons objects directly
        // Poll at 60fps (16ms) to match game loop
        let pollCount = 0;
        const pollInterval = setInterval(() => {
          if (controller._closed) {
            clearInterval(pollInterval);
            return;
          }

          pollCount++;

          // Poll axis state (controller.axes is an OBJECT with named properties)
          const axes = controller.axes;
          if (axes) {
            // DEBUG: Log raw values every 2 seconds regardless of threshold
            if (pollCount % 120 === 0) {
              console.log('[Main] DEBUG: Raw axis values:', {
                leftStickX: axes.leftStickX,
                leftStickY: axes.leftStickY,
                rightStickX: axes.rightStickX,
                rightStickY: axes.rightStickY
              });
            }

            // Map named properties to array indices for Web Gamepad API
            gamepadState.axes[0] = axes.leftStickX || 0;
            gamepadState.axes[1] = axes.leftStickY || 0;
            gamepadState.axes[2] = axes.rightStickX || 0;
            gamepadState.axes[3] = axes.rightStickY || 0;

            // Only log if stick moved significantly (avoid spam)
            if (Math.abs(axes.leftStickX) > 0.1 || Math.abs(axes.leftStickY) > 0.1) {
              console.log('[Main] Gamepad state poll: leftStick=', axes.leftStickX.toFixed(2), axes.leftStickY.toFixed(2));
            }
          }

          // Poll button state (controller.buttons is an OBJECT with named properties)
          const buttons = controller.buttons;
          if (buttons) {
            // Map to standard gamepad button indices
            const buttonMapping = [
              'a', 'b', 'x', 'y',
              'leftShoulder', 'rightShoulder',
              'leftTrigger', 'rightTrigger',
              'back', 'start',
              'leftStick', 'rightStick',
              'dpadUp', 'dpadDown', 'dpadLeft', 'dpadRight',
              'guide'
            ];

            buttonMapping.forEach((buttonName, index) => {
              const pressed = buttons[buttonName] || false;
              const oldState = gamepadState.buttons[index]?.pressed || false;

              gamepadState.buttons[index] = {
                pressed: pressed,
                value: pressed ? 1.0 : 0.0
              };

              // Log button changes
              if (pressed !== oldState) {
                console.log(`[Main] Gamepad button '${buttonName}' changed to`, pressed);
              }
            });
          }

          // Send updated state to renderer
          mainWindow.webContents.send('global-gamepad-state', gamepadState);
        }, 16); // 60fps polling

        // Store interval for cleanup
        openedControllers.set(device.id + '_poll', pollInterval);

      } catch (error) {
        console.error('[Main] Failed to open controller:', error.message);
      }
    });

    // Handle disconnections
    sdl.controller.on('deviceRemove', (device) => {
      console.log('[Main] Controller API: Gamepad disconnected:', device.name);

      // Clear polling interval
      const pollInterval = openedControllers.get(device.id + '_poll');
      if (pollInterval) {
        clearInterval(pollInterval);
        openedControllers.delete(device.id + '_poll');
      }

      // Close controller
      const controller = openedControllers.get(device.id);
      if (controller) {
        controller.close();
        openedControllers.delete(device.id);
      }
    });

    // Check for already connected controllers
    console.log('[Main] Checking for game controllers:', sdl.controller.devices.length);
    sdl.controller.devices.forEach(device => {
      console.log('[Main] Found controller:', device.name);
      sdl.controller.emit('deviceAdd', device);
    });

    console.log('[Main] ✓ SDL gamepad polling started (unfocused support enabled)');
  } else {
    console.log('[Main] Gamepad support: Using Web Gamepad API only (no unfocused support)');
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
