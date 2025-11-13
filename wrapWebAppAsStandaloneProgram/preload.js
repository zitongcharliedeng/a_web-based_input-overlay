"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
console.log('[Preload] Loading preload script...');
electron_1.contextBridge.exposeInMainWorld('electronAPI', {
    onGlobalKeyDown: (callback) => {
        electron_1.ipcRenderer.on('global-keydown', (_event, data) => callback(data));
    },
    onGlobalKeyUp: (callback) => {
        electron_1.ipcRenderer.on('global-keyup', (_event, data) => callback(data));
    },
    onGlobalMouseMove: (callback) => {
        electron_1.ipcRenderer.on('global-mousemove', (_event, data) => callback(data));
    },
    onGlobalMouseDown: (callback) => {
        electron_1.ipcRenderer.on('global-mousedown', (_event, data) => callback(data));
    },
    onGlobalMouseUp: (callback) => {
        electron_1.ipcRenderer.on('global-mouseup', (_event, data) => callback(data));
    },
    onGlobalWheel: (callback) => {
        electron_1.ipcRenderer.on('global-wheel', (_event, data) => callback(data));
    },
    onGlobalGamepadState: (callback) => {
        electron_1.ipcRenderer.on('global-gamepad-state', (_event, state) => callback(state));
    },
    isReadonly: () => {
        return electron_1.ipcRenderer.sendSync('get-readonly-state');
    },
    hasGlobalInput: () => {
        return electron_1.ipcRenderer.sendSync('has-global-input');
    }
});
console.log('[Preload] Preload script loaded successfully!');
console.log('[Preload] electronAPI exposed to window object');
