
// Global declarations (defined in other JS files)
declare var keyboard: any;
declare var gamepads: any;
declare function applyProperties(target: any, source: any): void;
declare function canvas_fill_rec(ctx: any, x: number, y: number, width: number, height: number, style: any): void;
declare function canvas_text(ctx: any, x: number, y: number, text: string, style: any): void;

// Type definitions
interface GamepadStickInput {
	type: "left" | "right" | null;
	axis: "X" | "Y" | null;
	direction: "positive" | "negative" | null;
}

interface KeyboardInput {
	keyCode: string | null;
}

interface GamepadButtonInput {
	index: number | null;
}

interface InputConfig {
	keyboard: KeyboardInput;
	gamepad: {
		stick: GamepadStickInput;
		button: GamepadButtonInput;
	};
}

interface LinearInputIndicatorProperties {
	input: InputConfig;
	// NOT YET REFACTORED
	keyText: string;
	linkedAxis: number;
	reverseFillDirection: boolean;
	size: number;
	multiplier: number;
	antiDeadzone: number;
	backgroundImage: HTMLImageElement;  // TODO: Make user-customizable instead of hardcoded in scenes
	fillStyle: string;
	fillStyleBackground: string;
	fillSize: number;
	fontStyle: any;
}

// Default restorepoint properties
const defaultLinearInputIndicatorProperties: LinearInputIndicatorProperties = {
	// === INPUT DETECTION (refactored) ===
	input: {
		keyboard: {
			keyCode: null
		},
		gamepad: {
			stick: {
				type: null,
				axis: null,
				direction: null
			},
			button: {
				index: null
			}
		}
	},

	// === NOT YET REFACTORED - keeping old structure ===
    keyText: "SampleText",
	linkedAxis: -1,
	reverseFillDirection: false,
    size: 100,
    multiplier: 1,
    antiDeadzone: 0.0,
	backgroundImage: new Image(),
	fillStyle: "rgba(255, 255, 255, 0.5)",
	fillStyleBackground: "rgba(37, 37, 37, 0.43)",
	fillSize: 85,
	fontStyle: { textAlign: "center", fillStyle: "white", font: "30px Lucida Console" },
}

/**
 * Converts stick configuration to standard gamepad API axis index
 * Maps: left X=0, left Y=1, right X=2, right Y=3
 *
 * TODO: Right stick (type="right") is untested due to lack of hardware.
 *       Assumes symmetry with left stick. Test when right stick controller available.
 */
function asConventionalGamepadAxisNumber(stick: GamepadStickInput): number | null {
	if (stick.type === null || stick.axis === null) return null;
	return (stick.type === "left" ? 0 : 2) + (stick.axis === "X" ? 0 : 1);
}

// LinearInputIndicator - Visual representation of linear (0-1.0) input value
function LinearInputIndicator(x: number, y: number, width: number, height: number, properties?: Partial<LinearInputIndicatorProperties>) {

	// Framework properties
	this.x = x; this.y = y;
	this.width = width; this.height = height;
    this.defaultProperties = defaultLinearInputIndicatorProperties;
    this.className = "LinearInputIndicator";

	// Object properties
	applyProperties(this, defaultLinearInputIndicatorProperties);
	// Custom object properties
	applyProperties(this, properties);

	// Convert new input structure to internal properties for update() to use
	if (this.input) {
		// Keyboard
		this.keyCode = this.input.keyboard.keyCode;

		// Gamepad stick
		this.hasStickInput = (asConventionalGamepadAxisNumber(this.input.gamepad.stick) !== null);
		if (this.hasStickInput) {
			this.axis = asConventionalGamepadAxisNumber(this.input.gamepad.stick);
			this.revertedAxis = (this.input.gamepad.stick.direction === "negative");
		}

		// Gamepad button
		this.hasButtonInput = (this.input.gamepad.button.index !== null);
		if (this.hasButtonInput) {
			this.button = this.input.gamepad.button.index;
		}
	}

	// Object values
    this.value = 0;
    this._previousValue = 0;
}


// Update loop
LinearInputIndicator.prototype.update = function (delta) {

	var value = 0;
	var linkedValue = 0;

	// Get keyboard input
	value += keyboard[this.keyCode] ? 1 : 0;

	// Key antiDeadzone has to be lowered when a linked axis surpasses the antiDeadzone for better directional indications
	// This is a lazy way to achieve this, but works for now
	var newAntiDeadzone = Math.max(0, this.antiDeadzone - linkedValue * 0.5)

	// Get gamepad input
	for (var id in gamepads) {
		var gamepad = gamepads[id];
		if (gamepad !== null && gamepad.axes && this.hasStickInput) {

			if (gamepad.axes[this.axis]
			&& (this.revertedAxis === true && gamepad.axes[this.axis] < 0)
			|| (this.revertedAxis === false && gamepad.axes[this.axis] > 0)) {
				if (gamepad.axes[this.linkedAxis]) {

					//Converts circular back to square coordinates
					value += Math.abs(gamepad.axes[this.axis]) * Math.sqrt(1 + 2 * Math.pow(Math.abs(gamepad.axes[this.linkedAxis]), 2))
					
				} else {

					value += (Math.abs(gamepad.axes[this.axis]) - newAntiDeadzone) / (1 - newAntiDeadzone)
				}
			}


			if (gamepad.axes[this.linkedAxis]) {

				linkedValue += Math.abs(gamepad.axes[this.linkedAxis])
			}
		}
		if (gamepad !== null && gamepad.buttons && this.hasButtonInput) {

			if (gamepad.buttons[this.button]) {

				value += gamepad.buttons[this.button].value
			}
		}
	}

	// Update input
	this.value = Math.max(Math.min((value - newAntiDeadzone) / (1 - newAntiDeadzone) * this.multiplier, 1), 0);

	// Update position
	return true //Math.abs(this._previousValue - this.value) > this.antiDeadzone;
}


// Draw function
LinearInputIndicator.prototype.draw = function (canvas, ctx) {

	var fillOffset = -(this.fillSize-this.size)*.5

	// Fill background
    ctx.beginPath();
    canvas_fill_rec(ctx, fillOffset, fillOffset, this.fillSize, this.fillSize, {fillStyle:this.fillStyleBackground});

	// Fill value
    ctx.beginPath();
	if (this.reverseFillDirection == true)
		canvas_fill_rec(ctx, fillOffset, fillOffset + this.fillSize, this.fillSize, -this.fillSize * this.value, { fillStyle: this.fillStyle });
	else
		canvas_fill_rec(ctx, fillOffset, fillOffset, this.fillSize, this.fillSize * this.value, { fillStyle: this.fillStyle });


	ctx.drawImage(
		this.backgroundImage,
		0, 0,
		this.backgroundImage.width, this.backgroundImage.height,
		0, 0,
		this.size, this.size
	)

    // Print key text
    canvas_text(ctx, this.size*.5, this.size*.5, this.keyText, this.fontStyle);
}
