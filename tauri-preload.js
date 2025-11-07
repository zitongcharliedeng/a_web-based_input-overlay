/**
 * Tauri preload shim - provides same API as Electron preload
 * This makes the browser code agnostic to whether it's running in Electron or Tauri
 *
 * Architecture:
 * - Tauri backend (Rust) captures OS-level input via rdev
 * - Events are emitted to frontend via Tauri event system
 * - This shim translates Tauri events to look like Electron IPC
 * - Browser code stays unchanged
 */

console.log('[Tauri Preload] Loading Tauri bridge...');

// Check if we're running in Tauri
const isTauri = window.__TAURI__ !== undefined;

if (isTauri) {
    const { invoke, event } = window.__TAURI__;
    const { listen } = event;

    // Expose same API as Electron preload
    window.electronAPI = {
        // Keyboard events
        onGlobalKeyDown: (callback) => {
            listen('global-keydown', (tauriEvent) => {
                callback(tauriEvent.payload);
            });
        },
        onGlobalKeyUp: (callback) => {
            listen('global-keyup', (tauriEvent) => {
                callback(tauriEvent.payload);
            });
        },

        // Mouse position and clicks
        onGlobalMouseMove: (callback) => {
            listen('global-mousemove', (tauriEvent) => {
                callback(tauriEvent.payload);
            });
        },
        onGlobalMouseDown: (callback) => {
            listen('global-mousedown', (tauriEvent) => {
                callback(tauriEvent.payload);
            });
        },
        onGlobalMouseUp: (callback) => {
            listen('global-mouseup', (tauriEvent) => {
                callback(tauriEvent.payload);
            });
        },

        // Mouse wheel
        onGlobalWheel: (callback) => {
            listen('global-wheel', (tauriEvent) => {
                callback(tauriEvent.payload);
            });
        },

        // App state (async in Tauri, but we make it look synchronous)
        isReadonly: () => {
            // Note: Tauri's invoke is async, but we return a promise
            // The original Electron API was sync, but this should work
            let result = false;
            invoke('is_readonly').then(r => result = r);
            return result;
        },

        // Utility: Check if global input hooks are available
        hasGlobalInput: () => {
            let result = false;
            invoke('has_global_input').then(r => result = r);
            return result;
        }
    };

    console.log('[Tauri Preload] ✓ Tauri bridge loaded successfully!');
    console.log('[Tauri Preload] electronAPI exposed to window object');
} else {
    console.log('[Tauri Preload] ✗ Not running in Tauri (web version)');
}
