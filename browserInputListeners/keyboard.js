var keyboard = {}

// uiohook keycode to KeyboardEvent.code mapping
// Based on uiohook documentation
const UIOHOOK_TO_KEYCODE = {
  // Letters
  30: 'KeyA', 48: 'KeyB', 46: 'KeyC', 32: 'KeyD', 18: 'KeyE',
  33: 'KeyF', 34: 'KeyG', 35: 'KeyH', 23: 'KeyI', 36: 'KeyJ',
  37: 'KeyK', 38: 'KeyL', 50: 'KeyM', 49: 'KeyN', 24: 'KeyO',
  25: 'KeyP', 16: 'KeyQ', 19: 'KeyR', 31: 'KeyS', 20: 'KeyT',
  22: 'KeyU', 47: 'KeyV', 17: 'KeyW', 45: 'KeyX', 21: 'KeyY',
  44: 'KeyZ',

  // Numbers
  2: 'Digit1', 3: 'Digit2', 4: 'Digit3', 5: 'Digit4', 6: 'Digit5',
  7: 'Digit6', 8: 'Digit7', 9: 'Digit8', 10: 'Digit9', 11: 'Digit0',

  // Special keys
  57: 'Space', 28: 'Enter', 1: 'Escape', 14: 'Backspace',
  15: 'Tab', 42: 'ShiftLeft', 54: 'ShiftRight',
  29: 'ControlLeft', 97: 'ControlRight',
  56: 'AltLeft', 100: 'AltRight'
};

// DOM event listeners (works when focused)
document.addEventListener('keydown', function(e) {
    if (keyboard[e.code] !== true) {
        keyboard[e.code] = true;
    }
})

document.addEventListener('keyup', function(e) {
    if (keyboard[e.code] === true) {
        keyboard[e.code] = false;
    }
})

// Global input hooks (works when unfocused - Electron only)
if (window.electronAPI) {
    console.log('[Keyboard] Setting up global input hooks via uiohook');

    window.electronAPI.onGlobalKeyDown((data) => {
        const code = UIOHOOK_TO_KEYCODE[data.keycode];
        if (code && keyboard[code] !== true) {
            keyboard[code] = true;
            console.log('[Keyboard] Global keydown:', code, '(uiohook keycode:', data.keycode + ')');
        }
    });

    window.electronAPI.onGlobalKeyUp((data) => {
        const code = UIOHOOK_TO_KEYCODE[data.keycode];
        if (code && keyboard[code] === true) {
            keyboard[code] = false;
            console.log('[Keyboard] Global keyup:', code);
        }
    });
}

export { keyboard };
