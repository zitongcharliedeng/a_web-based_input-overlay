var gamepads = {};

if (window.__TAURI__) {
    // Tauri mode: Listen to Rust backend gamepad events (works when unfocused!)
    window.__TAURI__.event.listen('input-event', function(event) {
        const data = event.payload;

        if (data.type === 'GamepadAxis') {
            // code format: gamepad0_axis0, gamepad0_axis1, etc.
            gamepads[data.code] = data.value;
        } else if (data.type === 'GamepadButtonDown') {
            // code format: gamepad0_button0, gamepad0_button1, etc.
            gamepads[data.code] = true;
        } else if (data.type === 'GamepadButtonUp') {
            gamepads[data.code] = false;
        }
    });
    console.log('Gamepad: Tauri mode (global capture via gilrs)');
} else {
    // Browser mode: Poll Gamepad API (requires focus)
    gamepads.poll = function() {
        const pads = navigator.getGamepads();
        for (let i = 0; i < pads.length; i++) {
            if (pads[i]) {
                // Update axes
                for (let j = 0; j < pads[i].axes.length; j++) {
                    gamepads[`gamepad${i}_axis${j}`] = pads[i].axes[j];
                }
                // Update buttons
                for (let j = 0; j < pads[i].buttons.length; j++) {
                    gamepads[`gamepad${i}_button${j}`] = pads[i].buttons[j].pressed;
                }
            }
        }
    };

    // Auto-poll in requestAnimationFrame
    function pollGamepads() {
        gamepads.poll();
        requestAnimationFrame(pollGamepads);
    }
    pollGamepads();

    console.log('Gamepad: Browser mode (Gamepad API polling)');
}

export { gamepads };
