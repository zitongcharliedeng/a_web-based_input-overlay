const { contextBridge, ipcRenderer } = require('electron');

/**
 * Preload script that creates a secure bridge between Electron main process
 * and the renderer process. Exposes global input hooks via contextBridge.
 *
 * Architecture:
 * - Main process captures OS-level input via uiohook-napi
 * - Events are sent via IPC to renderer
 * - This bridge translates IPC events to look like DOM events
 * - Browser code stays agnostic to input source
 */

console.log('[Preload] Loading preload script...');

contextBridge.exposeInMainWorld('electronAPI', {
  // Keyboard events
  onGlobalKeyDown: (callback) => {
    ipcRenderer.on('global-keydown', (_event, data) => callback(data));
  },
  onGlobalKeyUp: (callback) => {
    ipcRenderer.on('global-keyup', (_event, data) => callback(data));
  },

  // Mouse position and clicks
  onGlobalMouseMove: (callback) => {
    ipcRenderer.on('global-mousemove', (_event, data) => callback(data));
  },
  onGlobalMouseDown: (callback) => {
    ipcRenderer.on('global-mousedown', (_event, data) => callback(data));
  },
  onGlobalMouseUp: (callback) => {
    ipcRenderer.on('global-mouseup', (_event, data) => callback(data));
  },

  // Mouse wheel
  onGlobalWheel: (callback) => {
    ipcRenderer.on('global-wheel', (_event, data) => callback(data));
  },

  // Gamepad (native polling)
  onGlobalGamepadAxis: (callback) => {
    ipcRenderer.on('global-gamepad-axis', (_event, data) => callback(data));
  },
  onGlobalGamepadButton: (callback) => {
    ipcRenderer.on('global-gamepad-button', (_event, data) => callback(data));
  },

  // App state
  isReadonly: () => {
    return ipcRenderer.sendSync('get-readonly-state');
  },

  // Utility: Check if global input hooks are available
  hasGlobalInput: () => {
    return ipcRenderer.sendSync('has-global-input');
  }
});

console.log('[Preload] Preload script loaded successfully!');
console.log('[Preload] electronAPI exposed to window object');
