const { app, BaseWindow, WebContentsView, ipcMain } = require('electron');
const path = require('path');

// Linux GTK compatibility (from stream-overlay)
if (process.platform === 'linux') {
  app.commandLine.appendSwitch('gtk-version', '3');
}

// Parse command line flags
const isReadonly = process.argv.includes('--readonly');
const enableFrame = process.argv.includes('--frame');
const enableDevTools = process.argv.includes('--dev');
let globalInputAvailable = false;

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

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
