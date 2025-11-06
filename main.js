const { app, BaseWindow, WebContentsView } = require('electron');
const path = require('path');

// Linux GTK compatibility (from stream-overlay)
if (process.platform === 'linux') {
  app.commandLine.appendSwitch('gtk-version', '3');
}

function createWindow() {
  const width = 1600;
  const height = 600;

  // Create BaseWindow (like stream-overlay)
  const win = new BaseWindow({
    width: width,
    height: height,
    transparent: true,
    frame: false,
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
      contextIsolation: true
    }
  });

  // Set view background to transparent (fixes white background)
  view.setBackgroundColor('rgba(0, 0, 0, 0.0)');

  // Add view to window and set bounds to fill the window
  win.contentView.addChildView(view);
  view.setBounds({ x: 0, y: 0, width: width, height: height });

  // Load the HTML file
  view.webContents.loadFile('index.html');

  // Enable click-through based on command line flag
  const enableClickThrough = process.argv.includes('--click-through');

  if (enableClickThrough) {
    // Overlay mode: always click-through (for gaming)
    win.setIgnoreMouseEvents(true);
    console.log('Overlay mode - click-through enabled (always)');

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
    // Interactive mode: can drag and edit objects
    console.log('Interactive mode - can drag/edit objects');
  }

  // Open DevTools in development
  if (process.argv.includes('--enable-logging')) {
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
