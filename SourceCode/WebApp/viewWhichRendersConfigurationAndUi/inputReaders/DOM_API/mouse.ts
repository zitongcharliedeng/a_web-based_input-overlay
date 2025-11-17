
// Type definitions
interface MouseButtons {
	[key: number]: boolean;
	0: boolean;
	1: boolean;
	2: boolean;
	3: boolean;
	4: boolean;
}

interface MouseClicks {
	[key: number]: boolean;
	0: boolean;
	1: boolean;
	2: boolean;
	3: boolean;
	4: boolean;
}

interface WheelDelta {
	x: number;
	y: number;
}

interface WheelEvents {
	up: boolean;
	down: boolean;
}

interface MouseState {
	x: number;
	y: number;
	buttons: MouseButtons;
	clicks: MouseClicks;
	wheelDelta: WheelDelta;
	wheelEvents: WheelEvents;  // Single-frame wheel events
	update(delta: number): void;
}

// Mouse state object (matches keyboard pattern: simple key-value pairs)
const mouse: MouseState = {
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

	// Update loop (called each frame)
	update(delta: number): void {
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
const canvas = document.getElementById('canvas') as HTMLCanvasElement;

// Mouse event listeners
canvas.addEventListener('mousedown', (e: MouseEvent) => {
	// Update position
	mouse.x = e.x;
	mouse.y = e.y;

	// Update button state (e.button uses standard values 0-4)
	const button = e.button as 0 | 1 | 2 | 3 | 4;
	if (mouse.buttons[button] === false) {
		mouse.buttons[button] = true;
		mouse.clicks[button] = true;
	}
});

canvas.addEventListener('mouseup', (e: MouseEvent) => {
	// Update position
	mouse.x = e.x;
	mouse.y = e.y;

	// Update button state
	const button = e.button as 0 | 1 | 2 | 3 | 4;
	if (mouse.buttons[button] === true) {
		mouse.buttons[button] = false;
	}
});

canvas.addEventListener('mousemove', (e: MouseEvent) => {
	// Update position
	mouse.x = e.x;
	mouse.y = e.y;
});

canvas.addEventListener('wheel', (e: WheelEvent) => {
	// Update wheel delta
	mouse.wheelDelta.x = e.deltaX;
	mouse.wheelDelta.y = e.deltaY;

	// Set single-frame wheel events
	if (e.deltaY < 0) {
		mouse.wheelEvents.up = true;
	} else if (e.deltaY > 0) {
		mouse.wheelEvents.down = true;
	}
});

// Prevent context menu on right-click
canvas.addEventListener('contextmenu', (e: MouseEvent) => {
	e.preventDefault();
});

export { mouse };
