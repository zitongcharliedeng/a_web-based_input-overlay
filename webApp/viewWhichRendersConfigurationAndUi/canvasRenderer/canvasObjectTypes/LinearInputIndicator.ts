
import { CanvasObject } from './BaseCanvasObject.js';
import { canvas_fill_rec, canvas_text, canvas_properties } from '../canvasDrawingHelpers.js';
import type { LinearInputIndicatorConfig, LinearInputIndicatorTemplate, CanvasObjectConfig } from '../../../modelToSaveCustomConfigurationLocally/OmniConfig.js';

// TODO: Move antiDeadzone/deadzone to global per-controller configuration (hardware-specific).
// Commercial joysticks have 0.5-2% center drift: Xbox/PS ~0.01, Switch ~0.015, cheap ~0.03.
// antiDeadzone compensates for analog stick resting position drift due to manufacturing tolerances.

const defaultLinearInputIndicatorProperties: LinearInputIndicatorTemplate = {
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
		radialCompensationAxis: -1,
		multiplier: 1,
		antiDeadzone: 0.01,
		fadeOutDuration: 0.2,
	},

	display: {
		text: "SampleText",
		reverseFillDirection: false,
		fillStyle: "rgba(255, 255, 255, 0.5)",
		fillStyleBackground: "rgba(37, 37, 37, 0.43)",
		fontStyle: { textAlign: "center", fillStyle: "black", font: "30px Lucida Console", strokeStyle: "white", strokeWidth: 3 },
	}
}

type GamepadStickInput = {
	type: 'left' | 'right' | null;
	axis: 'X' | 'Y' | null;
	direction: 'positive' | 'negative' | null;
};

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
	static readonly TYPE = 'linearInputIndicator' as const;
	static readonly DISPLAY_NAME = 'LinearInputIndicator';
	static readonly DEFAULT_TEMPLATE: LinearInputIndicatorTemplate = {
		input: {
			keyboard: { keyCode: null },
			mouse: { button: null, wheel: null },
			gamepad: {
				stick: { type: null, axis: null, direction: null },
				button: { index: null }
			}
		},
		processing: {
			radialCompensationAxis: -1,
			multiplier: 1,
			antiDeadzone: 0.01,
			fadeOutDuration: 0.2
		},
		display: {
			text: "",
			fillStyle: "#00ff00",
			fillStyleBackground: "#222222",
			fontStyle: {
				textAlign: "center",
				fillStyle: "black",
				font: "30px Lucida Console",
				strokeStyle: "white",
				strokeWidth: 3
			},
			reverseFillDirection: false
		}
	};

	static fromConfig(config: CanvasObjectConfig): LinearInputIndicator {
		if (config.type !== 'linearInputIndicator') {
			throw new Error(`Invalid config type: expected linearInputIndicator, got ${config.type}`);
		}
		return new LinearInputIndicator(
			config.id,
			config.positionOnCanvas.pxFromCanvasLeft,
			config.positionOnCanvas.pxFromCanvasTop,
			config.hitboxSize.widthInPx,
			config.hitboxSize.lengthInPx,
			{
				input: config.input,
				processing: config.processing,
				display: config.display
			},
			config.layerLevel
		);
	}

	defaultProperties: LinearInputIndicatorTemplate = defaultLinearInputIndicatorProperties;
	className: string = "LinearInputIndicator";

	// Internal properties from input config
	keyCode: string | null = null;
	mouseButton: number | null = null;
	mouseWheel: "up" | "down" | null = null;
	hasStickInput: boolean = false;
	axis: number | null = null;
	invertedAxis: boolean = false;
	hasButtonInput: boolean = false;
	button: number | null = null;

	// Internal properties from processing config
	radialCompensationAxis: number = -1;
	multiplier: number = 1;
	antiDeadzone: number = 0.0;
	fadeOutDuration: number = 0.0;

	// No fade state needed - pure signal processing

	// Internal properties from display config
	keyText: string = "SampleText";
	reverseFillDirection: boolean = false;
	fillStyle: string = "rgba(255, 255, 255, 0.5)";
	fillStyleBackground: string = "rgba(37, 37, 37, 0.43)";
	fontStyle: { textAlign: CanvasTextAlign; fillStyle: string; font: string; strokeStyle: string; strokeWidth: number } = { textAlign: "center", fillStyle: "black", font: "30px Lucida Console", strokeStyle: "white", strokeWidth: 3 };

	// Runtime values
	value: number = 0;
	_previousValue: number = 0;
	opacity: number = 1.0; // Fade opacity instead of value

	// Config properties (before flattening)
	input: LinearInputIndicatorTemplate['input'] = defaultLinearInputIndicatorProperties.input;
	processing: LinearInputIndicatorTemplate['processing'] = defaultLinearInputIndicatorProperties.processing;
	display: LinearInputIndicatorTemplate['display'] = defaultLinearInputIndicatorProperties.display;

	constructor(id: string, x: number, y: number, width: number, height: number, properties?: Partial<LinearInputIndicatorTemplate>, layerLevel?: number) {
		super(
			id,
			{ pxFromCanvasTop: y, pxFromCanvasLeft: x },
			{ widthInPx: width, lengthInPx: height },
			"linearInputIndicator",
			layerLevel ?? 10
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

	override syncProperties(): void {
		if (this.input) {
			this.keyCode = this.input.keyboard?.keyCode ?? null;
			this.mouseButton = this.input.mouse?.button ?? null;
			this.mouseWheel = this.input.mouse?.wheel ?? null;

			const stick = this.input.gamepad?.stick;
			this.hasStickInput = stick ? (asConventionalGamepadAxisNumber(stick) !== null) : false;
			if (this.hasStickInput && stick) {
				this.axis = asConventionalGamepadAxisNumber(stick);
				this.invertedAxis = (stick.direction === "negative");
			} else {
				this.hasStickInput = false;
				this.axis = null;
				this.invertedAxis = false;
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
			this.radialCompensationAxis = this.processing.radialCompensationAxis ?? -1;
			this.multiplier = this.processing.multiplier ?? 1;
			this.antiDeadzone = this.processing.antiDeadzone ?? 0.0;
			this.fadeOutDuration = this.processing.fadeOutDuration ?? 0.0;
		}

		if (this.display) {
			this.keyText = this.display.text ?? "SampleText";
			this.reverseFillDirection = this.display.reverseFillDirection ?? false;
			this.fillStyle = this.display.fillStyle ?? "rgba(255, 255, 255, 0.5)";
			this.fillStyleBackground = this.display.fillStyleBackground ?? "rgba(37, 37, 37, 0.43)";
			this.fontStyle = this.display.fontStyle ?? { textAlign: "center", fillStyle: "black", font: "30px Lucida Console", strokeStyle: "white", strokeWidth: 3 };
		}
	}

	private applyOpacityToColor(color: string, opacity: number): string {
		// Parse rgba(r, g, b, a) or rgb(r, g, b)
		const rgbaMatch = color.match(/^rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)$/);
		if (rgbaMatch) {
			const r = rgbaMatch[1];
			const g = rgbaMatch[2];
			const b = rgbaMatch[3];
			const a = rgbaMatch[4] ? parseFloat(rgbaMatch[4]) : 1.0;
			const newAlpha = a * opacity;
			return `rgba(${r}, ${g}, ${b}, ${newAlpha})`;
		}

		// Parse hex colors (#RRGGBB or #RGB)
		const hexMatch = color.match(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/);
		if (hexMatch && hexMatch[1]) {
			let hex = hexMatch[1];
			// Expand shorthand form (e.g. "03F") to full form (e.g. "0033FF")
			if (hex.length === 3) {
				hex = hex.split('').map(char => char + char).join('');
			}
			const r = parseInt(hex.substring(0, 2), 16);
			const g = parseInt(hex.substring(2, 4), 16);
			const b = parseInt(hex.substring(4, 6), 16);
			return `rgba(${r}, ${g}, ${b}, ${opacity})`;
		}

		// Fallback: return original color (shouldn't happen with our configs)
		return color;
	}

	update(delta: number): boolean {
		let value = 0;
		let compensationAxisValue = 0;

		// Get keyboard input
		const keyboard = window.keyboard;
		value += (this.keyCode && keyboard[this.keyCode]) ? 1 : 0;

		// Get mouse input
		const mouse = window.mouse;
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

		// Key antiDeadzone has to be lowered when a compensation axis surpasses the antiDeadzone for better directional indications
		// This is a lazy way to achieve this, but works for now
		let newAntiDeadzone = Math.max(0, this.antiDeadzone - compensationAxisValue * 0.5)

		// Get gamepad input
		const gamepads = window.gamepads;
		if (gamepads) {
			for (let i = 0; i < gamepads.length; i++) {
				const gamepad = gamepads[i];
				if (!gamepad) continue;
			if (gamepad.axes && this.hasStickInput && this.axis !== null) {
				const axisValue = gamepad.axes[this.axis];
				const compensationValue = this.radialCompensationAxis >= 0 ? gamepad.axes[this.radialCompensationAxis] : undefined;

				if (axisValue !== null && axisValue !== undefined
				&& ((this.invertedAxis === true && axisValue < 0)
				|| (this.invertedAxis === false && axisValue > 0))) {
					if (this.radialCompensationAxis >= 0 && compensationValue !== undefined) {

						//Converts circular back to square coordinates
						value += Math.abs(axisValue) * Math.sqrt(1 + 2 * Math.pow(Math.abs(compensationValue), 2))

					} else if (this.radialCompensationAxis < 0) {

						value += (Math.abs(axisValue) - newAntiDeadzone) / (1 - newAntiDeadzone)
					}
				}


				if (this.radialCompensationAxis >= 0 && compensationValue !== undefined) {

					compensationAxisValue += Math.abs(compensationValue)
				}
			}
			if (gamepad.buttons && this.hasButtonInput && this.button !== null) {
				const button = gamepad.buttons[this.button];
				if (button) {
					value += button.value
				}
			}
			}
		}

		// Calculate raw input value (clamped 0-1)
		// Guard against divide-by-zero
		if (newAntiDeadzone >= 1.0) newAntiDeadzone = 0.999;
		const rawValue = Math.max(Math.min((value - newAntiDeadzone) / (1 - newAntiDeadzone) * this.multiplier, 1), 0);

		// Signal processing approach: fade opacity, not fill amount
		if (rawValue > 0) {
			// Input active - instant response, full opacity
			this.value = rawValue;
			this.opacity = 1.0;
		} else if (this.fadeOutDuration > 0 && this.value > 0) {
			// Input inactive - keep fill at current value, fade opacity to 0
			// Decay rate: higher fadeOutDuration = slower decay
			const decayRate = 1.0 / this.fadeOutDuration;
			this.opacity = this.opacity * Math.exp(-decayRate * delta);

			// Clamp to 0 when very small (prevent floating point drift)
			if (this.opacity < 0.001) {
				this.opacity = 0;
				this.value = 0; // Clear value when fade complete
			}
		} else {
			// No fade - instant off
			this.value = 0;
			this.opacity = 1.0;
		}

		return true;
	}

	draw(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D): void {
		// Fill background
		ctx.beginPath();
		canvas_fill_rec(ctx, 0, 0, this.hitboxSize.widthInPx, this.hitboxSize.lengthInPx, {fillStyle:this.fillStyleBackground});

		// Fill value (vertical fill from bottom or top)
		// Apply opacity to fillStyle for fade effect
		const fillStyleWithOpacity = this.applyOpacityToColor(this.fillStyle, this.opacity);

		ctx.beginPath();
		if (this.reverseFillDirection == true)
			canvas_fill_rec(ctx, 0, this.hitboxSize.lengthInPx, this.hitboxSize.widthInPx, -this.hitboxSize.lengthInPx * this.value, { fillStyle: fillStyleWithOpacity });
		else
			canvas_fill_rec(ctx, 0, 0, this.hitboxSize.widthInPx, this.hitboxSize.lengthInPx * this.value, { fillStyle: fillStyleWithOpacity });

		// Print key text centered with configurable stroke outline
		const textX = this.hitboxSize.widthInPx * 0.5;
		const textY = this.hitboxSize.lengthInPx * 0.5;
		canvas_properties(ctx, this.fontStyle);
		ctx.strokeStyle = this.fontStyle.strokeStyle ?? "white";
		ctx.lineWidth = this.fontStyle.strokeWidth ?? 3;
		ctx.strokeText(this.keyText, textX, textY);
		canvas_text(ctx, textX, textY, this.keyText, this.fontStyle);
	}
}

export { LinearInputIndicator };

export const defaultTemplateFor_LinearInputIndicator: LinearInputIndicatorTemplate = {
	input: {
		keyboard: { keyCode: null },
		mouse: { button: null, wheel: null },
		gamepad: {
			stick: { type: null, axis: null, direction: null },
			button: { index: null }
		}
	},
	processing: {
		radialCompensationAxis: -1,
		multiplier: 1,
		antiDeadzone: 0.01,
		fadeOutDuration: 0.2
	},
	display: {
		text: "",
		fillStyle: "#00ff00",
		fillStyleBackground: "#222222",
		fontStyle: {
			textAlign: "center",
			fillStyle: "black",
			font: "30px Lucida Console",
			strokeStyle: "white",
			strokeWidth: 3
		},
		reverseFillDirection: false
	}
};
