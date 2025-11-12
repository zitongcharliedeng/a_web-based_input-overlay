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

// Try to initialize sdl2-gamecontroller for gamepad input
// Uses its own polling thread (SDL_PumpEvents) - works with Electron's event loop!
// Same library OBS input-overlay uses
let gamecontroller = null;
let gamepadAvailable = false;

try {
  const { createController } = require('sdl2-gamecontroller');
  // Create with 60fps polling interval (16ms) - runs in separate thread
  gamecontroller = createController({ interval: 16 });
  gamepadAvailable = true;
  console.log('[Main] ✓ sdl2-gamecontroller loaded (60fps polling, unfocused support)');
} catch (error) {
  console.log('[Main] ✗ sdl2-gamecontroller not available:', error.message);
  console.log('[Main] Native gamepad polling disabled (will use Web Gamepad API only)');
  console.log('[Main] To install: Run install-cmake-windows.ps1 then npm install');
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
  if (gamecontroller) {
    console.log('[Main] Starting SDL gamepad polling...');

    // Store gamepad state (standard Web Gamepad API format)
    // SDL axes: leftx, lefty, rightx, righty, triggerleft, triggerright
    // Standard indices: 0=leftX, 1=leftY, 2=rightX, 3=rightY
    const gamepadState = {
      axes: [0, 0, 0, 0],
      buttons: Array(17).fill(null).map(() => ({ pressed: false, value: 0 })),
      timestamp: Date.now(),
      connected: true
    };

    // SDL axis name to standard gamepad index mapping
    const axisMap = {
      'leftx': 0,
      'lefty': 1,
      'rightx': 2,
      'righty': 3
      // Note: triggers are buttons in standard gamepad API, not axes
    };

    // SDL button name to standard gamepad index mapping
    const buttonMap = {
      'a': 0,
      'b': 1,
      'x': 2,
      'y': 3,
      'back': 8,
      'guide': 16,
      'start': 9,
      'leftstick': 10,
      'rightstick': 11,
      'leftshoulder': 4,
      'rightshoulder': 5,
      'dpup': 12,
      'dpdown': 13,
      'dpleft': 14,
      'dpright': 15
      // triggerleft: 6, triggerright: 7 (handled in axis-motion)
    };

    // Axis motion events
    gamecontroller.on('controller-axis-motion', (data) => {
      // data: { button: 'leftx', timestamp: number, value: number (-1 to 1), player: number }
      const axisName = data.button.toLowerCase();

      // Handle analog triggers separately (they're buttons in Web Gamepad API)
      if (axisName === 'triggerleft') {
        gamepadState.buttons[6] = {
          pressed: data.value > 0.1,
          value: Math.max(0, data.value)
        };
        console.log('[Main] SDL trigger left:', data.value.toFixed(3));
      } else if (axisName === 'triggerright') {
        gamepadState.buttons[7] = {
          pressed: data.value > 0.1,
          value: Math.max(0, data.value)
        };
        console.log('[Main] SDL trigger right:', data.value.toFixed(3));
      } else if (axisMap.hasOwnProperty(axisName)) {
        const axisIndex = axisMap[axisName];
        gamepadState.axes[axisIndex] = data.value;
        console.log('[Main] SDL axis', axisName + ':', data.value.toFixed(3));
      }

      gamepadState.timestamp = Date.now();
      mainWindow.webContents.send('global-gamepad-state', gamepadState);
    });

    // Button down events
    gamecontroller.on('controller-button-down', (data) => {
      // data: { button: 'a', timestamp: number, player: number }
      const buttonName = data.button.toLowerCase();

      if (buttonMap.hasOwnProperty(buttonName)) {
        const buttonIndex = buttonMap[buttonName];
        gamepadState.buttons[buttonIndex] = { pressed: true, value: 1.0 };
        console.log('[Main] SDL button down:', buttonName, '(index', buttonIndex + ')');

        gamepadState.timestamp = Date.now();
        mainWindow.webContents.send('global-gamepad-state', gamepadState);
      }
    });

    // Button up events
    gamecontroller.on('controller-button-up', (data) => {
      const buttonName = data.button.toLowerCase();

      if (buttonMap.hasOwnProperty(buttonName)) {
        const buttonIndex = buttonMap[buttonName];
        gamepadState.buttons[buttonIndex] = { pressed: false, value: 0 };
        console.log('[Main] SDL button up:', buttonName, '(index', buttonIndex + ')');

        gamepadState.timestamp = Date.now();
        mainWindow.webContents.send('global-gamepad-state', gamepadState);
      }
    });

    // Controller connected/disconnected
    gamecontroller.on('controller-device-added', (data) => {
      console.log('[Main] ✓ SDL controller connected (player', data.player + ')');
      gamepadState.connected = true;
      mainWindow.webContents.send('global-gamepad-state', gamepadState);
    });

    gamecontroller.on('controller-device-removed', (data) => {
      console.log('[Main] ✗ SDL controller disconnected (player', data.player + ')');
      gamepadState.connected = false;
      mainWindow.webContents.send('global-gamepad-state', gamepadState);
    });

    console.log('[Main] ✓ SDL gamepad polling started (60fps internal thread)');
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
