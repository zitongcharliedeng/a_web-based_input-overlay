var keyboard = {}

// Check if running in Tauri
if (window.__TAURI__) {
    // Tauri mode: Listen to Rust backend events (works when unfocused!)
    window.__TAURI__.event.listen('input-event', function(event) {
        const data = event.payload;

        if (data.type === 'KeyDown') {
            keyboard[data.code] = true;
        } else if (data.type === 'KeyUp') {
            keyboard[data.code] = false;
        }
    });
    console.log('Keyboard: Tauri mode (global input capture)');
} else {
    // Browser mode: Fallback to DOM events (for development/testing)
    document.addEventListener('keydown', function(e) {
        if (keyboard[ e.code ] !== true) {
            keyboard[ e.code ] = true;
        }
    });

    document.addEventListener('keyup', function(e) {
        if (keyboard[ e.code ] === true) {
            keyboard[ e.code ] = false;
        }
    });
    console.log('Keyboard: Browser mode (requires focus)');
}

export { keyboard };
