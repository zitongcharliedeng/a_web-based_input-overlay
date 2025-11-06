const { app, BrowserWindow } = require('electron');
const path = require('path');

function createWindow() {
  const win = new BrowserWindow({
    width: 1600,
    height: 600,
    transparent: true,
    frame: false,
    alwaysOnTop: true,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true
    }
  });

  // Enable click-through based on command line flag
  const enableClickThrough = process.argv.includes('--click-through');
  if (enableClickThrough) {
    win.setIgnoreMouseEvents(true);
    console.log('Click-through enabled');
  } else {
    console.log('Click-through disabled - window is interactive');
  }

  win.loadFile('index.html');

  // Open DevTools in development
  if (process.argv.includes('--enable-logging')) {
    win.webContents.openDevTools();
  }
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
