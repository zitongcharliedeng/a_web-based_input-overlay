// Mouse state object (matches keyboard pattern: simple key-value pairs)
const mouse = {
    // Position
    x: 0,
    y: 0,
    // Buttons (using standard MouseEvent.button values)
    // 0: Left, 1: Middle, 2: Right, 3: Back, 4: Forward
    buttons: {
        0: false,
        1: false,
        2: false,
        3: false,
        4: false
    },
    // Single-frame click events (reset each update)
    clicks: {
        0: false,
        1: false,
        2: false,
        3: false,
        4: false
    },
    // Wheel delta (scroll)
    wheelDelta: { x: 0, y: 0 },
    // Single-frame wheel events (like clicks)
    wheelEvents: {
        up: false,
        down: false
    },
    // Backward compatibility getters (old API - button1, button2, button3)
    get button1() { return this.buttons[0]; },
    get button2() { return this.buttons[1]; },
    get button3() { return this.buttons[2]; },
    get button1Click() { return this.clicks[0]; },
    get button2Click() { return this.clicks[1]; },
    get button3Click() { return this.clicks[2]; },
    // Update loop (called each frame)
    update(delta) {
        // Decay wheel delta
        this.wheelDelta.x *= 0.7 * delta;
        this.wheelDelta.y *= 0.7 * delta;
        // Reset click events (single-frame)
        this.clicks[0] = false;
        this.clicks[1] = false;
        this.clicks[2] = false;
        this.clicks[3] = false;
        this.clicks[4] = false;
        // Reset wheel events (single-frame)
        this.wheelEvents.up = false;
        this.wheelEvents.down = false;
    }
};
// Get canvas element
const canvas = document.getElementById('canvas');
// Mouse event listeners
canvas.addEventListener('mousedown', (e) => {
    // Update position
    mouse.x = e.x;
    mouse.y = e.y;
    // Update button state (e.button uses standard values 0-4)
    const button = e.button;
    if (mouse.buttons[button] === false) {
        mouse.buttons[button] = true;
        mouse.clicks[button] = true;
    }
});
canvas.addEventListener('mouseup', (e) => {
    // Update position
    mouse.x = e.x;
    mouse.y = e.y;
    // Update button state
    const button = e.button;
    if (mouse.buttons[button] === true) {
        mouse.buttons[button] = false;
    }
});
canvas.addEventListener('mousemove', (e) => {
    // Update position
    mouse.x = e.x;
    mouse.y = e.y;
});
canvas.addEventListener('wheel', (e) => {
    console.log('[mouse.ts] Wheel event! deltaY:', e.deltaY);
    // Update wheel delta
    mouse.wheelDelta.x = e.deltaX;
    mouse.wheelDelta.y = e.deltaY;
    // Set single-frame wheel events
    if (e.deltaY < 0) {
        console.log('[mouse.ts] Setting wheelEvents.up = true');
        mouse.wheelEvents.up = true;
    }
    else if (e.deltaY > 0) {
        console.log('[mouse.ts] Setting wheelEvents.down = true');
        mouse.wheelEvents.down = true;
    }
});
export { mouse };
