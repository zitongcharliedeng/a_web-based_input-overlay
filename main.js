const { app, BaseWindow, WebContentsView, ipcMain } = require('electron');
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

// Try to initialize global input capture
// Priority: evdev (Wayland/Linux) > uiohook-napi (X11/Windows/macOS)
let uIOhook = null;
let evdevCapture = null;
let activeView = null; // Store reference to send events

// Try evdev first (best for Wayland)
if (process.platform === 'linux') {
  try {
    const EvdevInputCapture = require('./browserInputListeners/evdevInput');
    evdevCapture = new EvdevInputCapture();
    console.log('[Main] evdev input capture available');
  } catch (error) {
    console.log('[Main] ✗ evdev not available:', error.message);
  }
}

// Try uiohook-napi as fallback (works on X11, Windows, macOS)
if (!evdevCapture) {
  try {
    const uiohook = require('uiohook-napi');
    uIOhook = uiohook.uIOhook;
    globalInputAvailable = true;
    console.log('[Main] ✓ uiohook-napi loaded successfully');
  } catch (error) {
    console.log('[Main] ✗ uiohook-napi not available:', error.message);
    console.log('[Main] Global input hooks disabled (will use DOM events only)');
  }
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

  // Create BaseWindow (like stream-overlay)
  const win = new BaseWindow({
    width: width,
    height: height,
    transparent: true,
    frame: enableFrame,  // Show frame for debugging
    alwaysOnTop: true,
    skipTaskbar: false,
  });

  // Set background to fully transparent
  win.setBackgroundColor('rgba(0, 0, 0, 0.0)');

  // Enhanced always-on-top with screen-saver level
  win.setAlwaysOnTop(true, 'screen-saver', 1);

  // Create WebContentsView for the overlay content
  const view = new WebContentsView({
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    }
  });

  // Set view background to transparent (fixes white background)
  view.setBackgroundColor('rgba(0, 0, 0, 0.0)');

  // Add view to window and set bounds to fill the window
  win.contentView.addChildView(view);
  view.setBounds({ x: 0, y: 0, width: width, height: height });

  // Load the HTML file
  view.webContents.loadFile('index.html');

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
    view.webContents.openDevTools();
  }

  return { win, view };
}

app.whenReady().then(async () => {
  const { win, view } = createWindow();
  activeView = view; // Store reference for IPC

  // Start evdev capture if available (Wayland/Linux)
  if (evdevCapture) {
    console.log('[Main] Starting evdev input capture...');

    try {
      await evdevCapture.start();
      globalInputAvailable = true;
      console.log('[Main] ✓ evdev capture started');

      // Mouse events
      evdevCapture.on('mousemove', (data) => {
        activeView.webContents.send('global-mousemove', data);
      });

      evdevCapture.on('mousewheel', (data) => {
        console.log('[Main] Mouse wheel:', data.delta);
        activeView.webContents.send('global-mousewheel', data);
      });

      evdevCapture.on('mousebutton', (data) => {
        console.log('[Main] Mouse button:', data.buttonName, data.pressed ? 'pressed' : 'released');
        activeView.webContents.send('global-mousebutton', data);
      });

      // Gamepad events
      evdevCapture.on('gamepadaxis', (data) => {
        activeView.webContents.send('global-gamepadaxis', data);
      });

      evdevCapture.on('gamepadbutton', (data) => {
        console.log('[Main] Gamepad button:', data.buttonName, data.pressed ? 'pressed' : 'released');
        activeView.webContents.send('global-gamepadbutton', data);
      });

      // Keyboard events
      evdevCapture.on('keypress', (data) => {
        console.log('[Main] Keyboard:', data.key, data.pressed ? 'pressed' : 'released');
        activeView.webContents.send('global-keypress', data);
      });

    } catch (error) {
      console.error('[Main] ✗ Failed to start evdev:', error.message);
      if (error.message.includes('Permission denied') || error.message.includes('input group')) {
        console.log('[Main] To enable global input capture:');
        console.log('[Main]   sudo usermod -aG input $USER');
        console.log('[Main]   Then log out and back in');
      }
      evdevCapture = null; // Clear on failure
    }
  }

  // Start uiohook if evdev not available (X11/Windows/macOS)
  if (!evdevCapture && uIOhook) {
    console.log('[Main] Starting uiohook input hooks...');

    // Keyboard events
    uIOhook.on('keydown', (event) => {
      const data = {
        keycode: event.keycode,
        rawcode: event.rawcode,
        timestamp: Date.now()
      };
      console.log('[Main] Global keydown:', data.keycode);
      activeView.webContents.send('global-keydown', data);
    });

    uIOhook.on('keyup', (event) => {
      const data = {
        keycode: event.keycode,
        rawcode: event.rawcode,
        timestamp: Date.now()
      };
      console.log('[Main] Global keyup:', data.keycode);
      activeView.webContents.send('global-keyup', data);
    });

    // Start the hook
    uIOhook.start();
    console.log('[Main] ✓ uiohook started');
  }

  // Log final status
  if (globalInputAvailable) {
    console.log('[Main] ✅ Global input capture enabled');
  } else {
    console.log('[Main] ⚠️  Global input capture unavailable - using DOM events (focus required)');
  }

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  // Stop global input capture
  if (evdevCapture) {
    console.log('[Main] Stopping evdev capture...');
    evdevCapture.stop();
  }

  if (uIOhook) {
    console.log('[Main] Stopping uiohook...');
    uIOhook.stop();
  }

  if (process.platform !== 'darwin') {
    app.quit();
  }
});
