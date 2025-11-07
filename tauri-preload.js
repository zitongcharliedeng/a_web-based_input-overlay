console.log('[Tauri Preload] Loading Tauri bridge...');

const isTauri = window.__TAURI__ !== undefined;

if (isTauri) {
    const { invoke, event } = window.__TAURI__;
    const { listen } = event;

    window.electronAPI = {
        onGlobalKeyDown: (callback) => {
            listen('global-keydown', (tauriEvent) => callback(tauriEvent.payload));
        },
        onGlobalKeyUp: (callback) => {
            listen('global-keyup', (tauriEvent) => callback(tauriEvent.payload));
        },
        onGlobalMouseMove: (callback) => {
            listen('global-mousemove', (tauriEvent) => callback(tauriEvent.payload));
        },
        onGlobalMouseDown: (callback) => {
            listen('global-mousedown', (tauriEvent) => callback(tauriEvent.payload));
        },
        onGlobalMouseUp: (callback) => {
            listen('global-mouseup', (tauriEvent) => callback(tauriEvent.payload));
        },
        onGlobalWheel: (callback) => {
            listen('global-wheel', (tauriEvent) => callback(tauriEvent.payload));
        },
        isReadonly: () => {
            let result = false;
            invoke('is_readonly').then(r => result = r);
            return result;
        },
        hasGlobalInput: () => {
            let result = false;
            invoke('has_global_input').then(r => result = r);
            return result;
        }
    };

    console.log('[Tauri Preload] ✓ Tauri bridge loaded!');
} else {
    console.log('[Tauri Preload] ✗ Not running in Tauri');
}
