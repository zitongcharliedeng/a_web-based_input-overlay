

// Mouse state object (matches keyboard pattern: simple key-value pairs)
var mouse = {
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

	// Update loop (called each frame)
	update: function(delta) {
		// Decay wheel delta
		this.wheelDelta.x *= 0.7 * delta;
		this.wheelDelta.y *= 0.7 * delta;

		// Reset click events (single-frame)
		this.clicks[0] = false;
		this.clicks[1] = false;
		this.clicks[2] = false;
		this.clicks[3] = false;
		this.clicks[4] = false;
	}
};

// Mouse event listeners
canvas.addEventListener('mousedown', function(e) {
	// Update position
	mouse.x = e.x;
	mouse.y = e.y;

	// Update button state (e.button uses standard values 0-4)
	if (mouse.buttons[e.button] === false) {
		mouse.buttons[e.button] = true;
		mouse.clicks[e.button] = true;
	}
});

canvas.addEventListener('mouseup', function(e) {
	// Update position
	mouse.x = e.x;
	mouse.y = e.y;

	// Update button state
	if (mouse.buttons[e.button] === true) {
		mouse.buttons[e.button] = false;
	}
});

canvas.addEventListener('mousemove', function(e) {
	// Update position
	mouse.x = e.x;
	mouse.y = e.y;
});

canvas.addEventListener('wheel', function(e) {
	// Update wheel delta
	mouse.wheelDelta.x = e.deltaX;
	mouse.wheelDelta.y = e.deltaY;
});

export { mouse };
