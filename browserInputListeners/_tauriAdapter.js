/**
 * Tauri Input Adapter
 *
 * Silently bridges Tauri rdev global input events to the existing input system.
 * When running in Tauri, this adapter updates the keyboard and mouse objects
 * with data from rdev. When running as web app, this file does nothing.
 *
 * The rest of the app remains unchanged - it uses the same keyboard/mouse interface.
 */

async function initTauriAdapter() {
    try {
        // Only attempt to load Tauri API if available
        const { listen } = await import('@tauri-apps/api/event');
        const { invoke } = await import('@tauri-apps/api/tauri');

        // Import the input objects we'll update
        const { keyboard } = await import('./keyboard.js');

        // Start the rdev listener in the Tauri backend
        invoke('start_input_listener');

        // Subscribe to global input events
        listen('input-event', (event) => {
            const inputEvent = event.payload;

            // Route event to appropriate handler
            if (inputEvent.event_type === 'key_press') {
                handleKeyPress(inputEvent, keyboard);
            } else if (inputEvent.event_type === 'key_release') {
                handleKeyRelease(inputEvent, keyboard);
            } else if (inputEvent.event_type === 'mouse_move') {
                handleMouseMove(inputEvent);
            } else if (inputEvent.event_type === 'mouse_press') {
                handleMousePress(inputEvent);
            } else if (inputEvent.event_type === 'mouse_release') {
                handleMouseRelease(inputEvent);
            } else if (inputEvent.event_type === 'wheel') {
                handleMouseWheel(inputEvent);
            }
        });

        console.log('[TauriAdapter] ✓ Global input listener active (rdev)');

    } catch (err) {
        // Silently fail - Tauri API not available, using browser listeners instead
        console.log('[TauriAdapter] Browser mode (no global input)');
    }
}

function handleKeyPress(inputEvent, keyboard) {
    const keyCode = mapRdevKeyToCode(inputEvent.key);
    if (keyCode && keyboard[keyCode] !== true) {
        keyboard[keyCode] = true;
    }
}

function handleKeyRelease(inputEvent, keyboard) {
    const keyCode = mapRdevKeyToCode(inputEvent.key);
    if (keyCode && keyboard[keyCode] === true) {
        keyboard[keyCode] = false;
    }
}

function handleMouseMove(inputEvent) {
    // Mouse position is global, not relative to canvas
    // This might need adjustment depending on overlay placement
    if (window.mouseGlobal) {
        window.mouseGlobal.x = inputEvent.mouse_x || 0;
        window.mouseGlobal.y = inputEvent.mouse_y || 0;
    }
}

function handleMousePress(inputEvent) {
    if (window.mouseGlobal) {
        const buttonNumber = mapRdevButtonToNumber(inputEvent.button);
        const buttonKey = 'button' + buttonNumber;

        if (window.mouseGlobal[buttonKey] !== true) {
            window.mouseGlobal[buttonKey] = true;
            window.mouseGlobal[buttonKey + 'Click'] = true;
        }
    }
}

function handleMouseRelease(inputEvent) {
    if (window.mouseGlobal) {
        const buttonNumber = mapRdevButtonToNumber(inputEvent.button);
        const buttonKey = 'button' + buttonNumber;

        if (window.mouseGlobal[buttonKey] === true) {
            window.mouseGlobal[buttonKey] = false;
        }
    }
}

function handleMouseWheel(inputEvent) {
    if (window.mouseGlobal && inputEvent.key) {
        // Parse format: "dx=X,dy=Y"
        const match = inputEvent.key.match(/dx=([^,]+),dy=([^,]+)/);
        if (match) {
            window.mouseGlobal.wheelDelta.x = parseFloat(match[1]) || 0;
            window.mouseGlobal.wheelDelta.y = parseFloat(match[2]) || 0;
        }
    }
}

function mapRdevKeyToCode(rdevKey) {
    // rdev returns keys like: "KeyA", "Space", "ShiftLeft", etc.
    // These mostly match browser KeyboardEvent.code format already

    if (!rdevKey) return undefined;

    // Convert debug format if needed
    const keyStr = String(rdevKey).replace(/[{}"\s]/g, '');

    // Add mappings only where rdev format differs from browser code
    const keyMap = {
        // Add specific mappings as needed
        // For now, rdev format matches browser code format in most cases
    };

    return keyMap[keyStr] || keyStr;
}

function mapRdevButtonToNumber(rdevButton) {
    // rdev returns: "Left", "Right", "Middle"
    // Map to button numbers: 1, 3, 2 (to match MouseEvent.which)
    const map = {
        'Left': 1,
        'Right': 3,
        'Middle': 2,
    };
    return map[rdevButton] || 1;
}

// Initialize adapter when module loads
initTauriAdapter();

export { initTauriAdapter };
