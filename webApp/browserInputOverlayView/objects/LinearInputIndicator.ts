
import { CanvasObject } from './CanvasObject.js';
import { canvas_fill_rec, canvas_text } from '../_helpers/draw.js';

// Type definitions
interface Position {
	x: number;
	y: number;
}

interface Dimensions {
	width: number;
	height: number;
}

interface GamepadStickInput {
	type?: "left" | "right" | null;
	axis?: "X" | "Y" | null;
	direction?: "positive" | "negative" | null;
}

interface KeyboardInput {
	keyCode?: string | null;
}

interface GamepadButtonInput {
	index?: number | null;
}

interface MouseInput {
	button?: number | null;
	wheel?: "up" | "down" | null;
}

interface InputConfig {
	keyboard?: KeyboardInput;
	mouse?: MouseInput;
	gamepad?: {
		stick?: GamepadStickInput;
		button?: GamepadButtonInput;
	};
}

interface ProcessingConfig {
	linkedAxis?: number;
	multiplier?: number;
	antiDeadzone?: number;
}

interface DisplayConfig {
	text?: string;
	reverseFillDirection?: boolean;
	backgroundImage?: HTMLImageElement;
	fillStyle?: string;
	fillStyleBackground?: string;
	fontStyle?: unknown;
}

interface LinearInputIndicatorProperties {
	input?: InputConfig;
	processing?: ProcessingConfig;
	display?: DisplayConfig;
}

// Default restorepoint properties
const defaultLinearInputIndicatorProperties: LinearInputIndicatorProperties = {
	input: {
		keyboard: {
			keyCode: null
		},
		mouse: {
			button: null,
			wheel: null
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

	processing: {
		linkedAxis: -1,
		multiplier: 1,
		antiDeadzone: 0.0,
	},

	display: {
		text: "SampleText",
		reverseFillDirection: false,
		backgroundImage: new Image(),
		fillStyle: "rgba(255, 255, 255, 0.5)",
		fillStyleBackground: "rgba(37, 37, 37, 0.43)",
		fontStyle: { textAlign: "center", fillStyle: "white", font: "30px Lucida Console" },
	}
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

class LinearInputIndicator extends CanvasObject {
	defaultProperties: LinearInputIndicatorProperties = defaultLinearInputIndicatorProperties;
	className: string = "LinearInputIndicator";

	// Internal properties from input config
	keyCode: string | null = null;
	mouseButton: number | null = null;
	mouseWheel: "up" | "down" | null = null;
	hasStickInput: boolean = false;
	axis: number | null = null;
	revertedAxis: boolean = false;
	hasButtonInput: boolean = false;
	button: number | null = null;

	// Internal properties from processing config
	linkedAxis: number = -1;
	multiplier: number = 1;
	antiDeadzone: number = 0.0;

	// Internal properties from display config
	keyText: string = "SampleText";
	reverseFillDirection: boolean = false;
	backgroundImage: HTMLImageElement = new Image();
	fillStyle: string = "rgba(255, 255, 255, 0.5)";
	fillStyleBackground: string = "rgba(37, 37, 37, 0.43)";
	fontStyle: any = { textAlign: "center", fillStyle: "white", font: "30px Lucida Console" };

	// Runtime values
	value: number = 0;
	_previousValue: number = 0;

	// Config properties (before flattening)
	input: InputConfig = defaultLinearInputIndicatorProperties.input;
	processing: ProcessingConfig = defaultLinearInputIndicatorProperties.processing;
	display: DisplayConfig = defaultLinearInputIndicatorProperties.display;

	constructor(x: number, y: number, width: number, height: number, properties?: LinearInputIndicatorProperties) {
		super(
			{ pxFromCanvasTop: y, pxFromCanvasLeft: x },
			{ widthInPx: width, lengthInPx: height },
			"linearInputIndicator"
		);

		const props = properties ?? {};
		const defaults = defaultLinearInputIndicatorProperties;

		this.input = {
			keyboard: { ...defaults.input.keyboard, ...props.input?.keyboard },
			mouse: { ...defaults.input.mouse, ...props.input?.mouse },
			gamepad: {
				stick: { ...defaults.input.gamepad.stick, ...props.input?.gamepad?.stick },
				button: { ...defaults.input.gamepad.button, ...props.input?.gamepad?.button }
			}
		};

		this.processing = { ...defaults.processing, ...props.processing };
		this.display = { ...defaults.display, ...props.display };

		this.value = 0;
		this._previousValue = 0;

		this.syncProperties();
	}

	syncProperties(): void {
		if (this.input) {
			this.keyCode = this.input.keyboard?.keyCode ?? null;
			this.mouseButton = this.input.mouse?.button ?? null;
			this.mouseWheel = this.input.mouse?.wheel ?? null;

			const stick = this.input.gamepad?.stick;
			this.hasStickInput = stick ? (asConventionalGamepadAxisNumber(stick) !== null) : false;
			if (this.hasStickInput && stick) {
				this.axis = asConventionalGamepadAxisNumber(stick);
				this.revertedAxis = (stick.direction === "negative");
			} else {
				this.hasStickInput = false;
				this.axis = null;
				this.revertedAxis = false;
			}

			const buttonIndex = this.input.gamepad?.button?.index;
			this.hasButtonInput = (buttonIndex !== null && buttonIndex !== undefined);
			if (this.hasButtonInput) {
				this.button = buttonIndex ?? null;
			} else {
				this.hasButtonInput = false;
				this.button = null;
			}
		}

		if (this.processing) {
			this.linkedAxis = this.processing.linkedAxis ?? -1;
			this.multiplier = this.processing.multiplier ?? 1;
			this.antiDeadzone = this.processing.antiDeadzone ?? 0.0;
		}

		if (this.display) {
			this.keyText = this.display.text ?? "SampleText";
			this.reverseFillDirection = this.display.reverseFillDirection ?? false;
			this.backgroundImage = this.display.backgroundImage ?? new Image();
			this.fillStyle = this.display.fillStyle ?? "rgba(255, 255, 255, 0.5)";
			this.fillStyleBackground = this.display.fillStyleBackground ?? "rgba(37, 37, 37, 0.43)";
			this.fontStyle = this.display.fontStyle ?? { textAlign: "center", fillStyle: "white", font: "30px Lucida Console" };
		}
	}

	update(delta: number): boolean {
		var value = 0;
		var linkedValue = 0;

		// Get keyboard input
		const keyboard = (window as any).keyboard;
		value += keyboard[this.keyCode] ? 1 : 0;

		// Get mouse input
		const mouse = (window as any).mouse;
		if (this.mouseButton !== null && mouse.buttons[this.mouseButton]) {
			value += 1;
		}

		// Get mouse wheel input (single-frame events like clicks)
		if (this.mouseWheel !== null && mouse.wheelEvents) {
			if (this.mouseWheel === "up" && mouse.wheelEvents.up) {
				value += 1;
			} else if (this.mouseWheel === "down" && mouse.wheelEvents.down) {
				value += 1;
			}
		}

		// Key antiDeadzone has to be lowered when a linked axis surpasses the antiDeadzone for better directional indications
		// This is a lazy way to achieve this, but works for now
		var newAntiDeadzone = Math.max(0, this.antiDeadzone - linkedValue * 0.5)

		// Get gamepad input
		const gamepads = (window as any).gamepads;
		for (var id in gamepads) {
			var gamepad = gamepads[id];
			if (gamepad !== null && gamepad.axes && this.hasStickInput && this.axis !== null) {

				if (gamepad.axes[this.axis] !== null && gamepad.axes[this.axis] !== undefined
				&& ((this.revertedAxis === true && gamepad.axes[this.axis] < 0)
				|| (this.revertedAxis === false && gamepad.axes[this.axis] > 0))) {
					if (this.linkedAxis >= 0 && gamepad.axes[this.linkedAxis]) {

						//Converts circular back to square coordinates
						value += Math.abs(gamepad.axes[this.axis]) * Math.sqrt(1 + 2 * Math.pow(Math.abs(gamepad.axes[this.linkedAxis]), 2))

					} else if (this.linkedAxis < 0) {

						value += (Math.abs(gamepad.axes[this.axis]) - newAntiDeadzone) / (1 - newAntiDeadzone)
					}
				}


				if (this.linkedAxis >= 0 && gamepad.axes[this.linkedAxis]) {

					linkedValue += Math.abs(gamepad.axes[this.linkedAxis])
				}
			}
			if (gamepad !== null && gamepad.buttons && this.hasButtonInput && this.button !== null) {

				if (gamepad.buttons[this.button]) {

					value += gamepad.buttons[this.button].value
				}
			}
		}

		// Update input
		this.value = Math.max(Math.min((value - newAntiDeadzone) / (1 - newAntiDeadzone) * this.multiplier, 1), 0);

		return true;
	}

	draw(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D): void {
		// Fill background
		ctx.beginPath();
		canvas_fill_rec(ctx, 0, 0, this.hitboxSize.widthInPx, this.hitboxSize.lengthInPx, {fillStyle:this.fillStyleBackground});

		// Fill value (vertical fill from bottom or top)
		ctx.beginPath();
		if (this.reverseFillDirection == true)
			canvas_fill_rec(ctx, 0, this.hitboxSize.lengthInPx, this.hitboxSize.widthInPx, -this.hitboxSize.lengthInPx * this.value, { fillStyle: this.fillStyle });
		else
			canvas_fill_rec(ctx, 0, 0, this.hitboxSize.widthInPx, this.hitboxSize.lengthInPx * this.value, { fillStyle: this.fillStyle });

		// Draw background image scaled to dimensions
		try {
			ctx.drawImage(
				this.backgroundImage,
				0, 0,
				this.backgroundImage.width, this.backgroundImage.height,
				0, 0,
				this.hitboxSize.widthInPx, this.hitboxSize.lengthInPx
			);
		} catch (e) {
			// Image not loaded yet or failed to load - skip silently
			// Will retry next frame when image loads
		}

		// Print key text centered
		canvas_text(ctx, this.hitboxSize.widthInPx * 0.5, this.hitboxSize.lengthInPx * 0.5, this.keyText, this.fontStyle);
	}
}

export { LinearInputIndicator };
