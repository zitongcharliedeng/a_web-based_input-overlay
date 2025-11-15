
import { CanvasObject } from './BaseCanvasObject.js';
import { canvas_fill_rec, canvas_text, canvas_properties } from '../canvasDrawingHelpers.js';
import type { LinearInputIndicatorConfig, LinearInputIndicatorTemplate, CanvasObjectConfig } from '../../../modelToSaveCustomConfigurationLocally/OmniConfig.js';

// TODO: Move antiDeadzone/deadzone to global per-controller configuration (hardware-specific).
// Commercial joysticks have 0.5-2% center drift: Xbox/PS ~0.01, Switch ~0.015, cheap ~0.03.
// antiDeadzone compensates for analog stick resting position drift due to manufacturing tolerances.

const SMART_DEFAULTS = {
	id: '',  // Will be overridden by UUID or user config
	positionOnCanvas: { pxFromCanvasLeft: 0, pxFromCanvasTop: 0 },
	hitboxSize: { widthInPx: 100, lengthInPx: 100 },
	layerLevel: 10,
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
			textAlign: "center" satisfies CanvasTextAlign,
			fillStyle: "black",
			font: "30px Lucida Console",
			strokeStyle: "white",
			strokeWidth: 3
		},
		reverseFillDirection: false
	}
};

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
		input: SMART_DEFAULTS.input,
		processing: SMART_DEFAULTS.processing,
		display: {
			...SMART_DEFAULTS.display,
			fontStyle: {
				...SMART_DEFAULTS.display.fontStyle,
				textAlign: SMART_DEFAULTS.display.fontStyle.textAlign as CanvasTextAlign
			}
		}
	};

	static readonly TEMPLATES = {
		W: {
			input: { keyboard: { keyCode: "KeyW" } },
			display: { text: "W" }
		},
		A: {
			input: { keyboard: { keyCode: "KeyA" } },
			display: { text: "A" }
		},
		S: {
			input: { keyboard: { keyCode: "KeyS" } },
			display: { text: "S", reverseFillDirection: true }
		},
		D: {
			input: { keyboard: { keyCode: "KeyD" } },
			display: { text: "D" }
		},
		SPACE: {
			input: { keyboard: { keyCode: "Space" } },
			display: { text: "␣" }
		},
		MOUSE_LEFT: {
			input: { mouse: { button: 0 } },
			display: { text: "LMB" }
		},
		MOUSE_RIGHT: {
			input: { mouse: { button: 2 } },
			display: { text: "RMB" }
		},
		GAMEPAD_A: {
			input: { gamepad: { button: { index: 0 } } },
			display: { text: "A" }
		}
	};

	static spawn(templateName: keyof typeof LinearInputIndicator.TEMPLATES, overrides?: Partial<LinearInputIndicatorConfig>): LinearInputIndicator {
		const template = LinearInputIndicator.TEMPLATES[templateName];

		// Deep merge template with overrides using explicit spreading
		const merged: Partial<LinearInputIndicatorConfig> = {
			...template as any,
			...overrides,
			input: {
				keyboard: { ...(template as any).input?.keyboard, ...overrides?.input?.keyboard },
				mouse: { ...(template as any).input?.mouse, ...overrides?.input?.mouse },
				gamepad: {
					stick: { ...(template as any).input?.gamepad?.stick, ...overrides?.input?.gamepad?.stick },
					button: { ...(template as any).input?.gamepad?.button, ...overrides?.input?.gamepad?.button }
				}
			},
			processing: { ...(template as any).processing, ...overrides?.processing },
			display: {
				...(template as any).display,
				...overrides?.display,
				fontStyle: { ...(template as any).display?.fontStyle, ...overrides?.display?.fontStyle }
			}
		};

		return new LinearInputIndicator(merged);
	}

	static fromConfig(config: CanvasObjectConfig): LinearInputIndicator {
		if (config.type !== 'linearInputIndicator') {
			throw new Error(`Invalid config type: expected linearInputIndicator, got ${config.type}`);
		}
		return new LinearInputIndicator(config);
	}

	className: string = "LinearInputIndicator";

	// Nested config properties (NO flattening)
	input: LinearInputIndicatorTemplate['input'];
	processing: LinearInputIndicatorTemplate['processing'];
	display: LinearInputIndicatorTemplate['display'];

	// Runtime values
	value: number = 0;
	_previousValue: number = 0;
	opacity: number = 1.0; // Fade opacity instead of value

	constructor(config?: Partial<LinearInputIndicatorConfig>) {
		// Deep merge config with SMART_DEFAULTS
		const merged: LinearInputIndicatorConfig = {
			...SMART_DEFAULTS,
			...config,
			input: {
				keyboard: { ...SMART_DEFAULTS.input.keyboard, ...config?.input?.keyboard },
				mouse: { ...SMART_DEFAULTS.input.mouse, ...config?.input?.mouse },
				gamepad: {
					stick: { ...SMART_DEFAULTS.input.gamepad.stick, ...config?.input?.gamepad?.stick },
					button: { ...SMART_DEFAULTS.input.gamepad.button, ...config?.input?.gamepad?.button }
				}
			},
			processing: { ...SMART_DEFAULTS.processing, ...config?.processing },
			display: {
				...SMART_DEFAULTS.display,
				...config?.display,
				fontStyle: {
					...SMART_DEFAULTS.display.fontStyle,
					...config?.display?.fontStyle,
					textAlign: (config?.display?.fontStyle?.textAlign || SMART_DEFAULTS.display.fontStyle.textAlign) as CanvasTextAlign
				}
			},
			positionOnCanvas: { ...SMART_DEFAULTS.positionOnCanvas, ...config?.positionOnCanvas },
			hitboxSize: { ...SMART_DEFAULTS.hitboxSize, ...config?.hitboxSize }
		};

		// Generate UUID if id not provided
		const finalId = merged.id || self.crypto?.randomUUID?.() || `linear-${Date.now()}-${Math.random()}`;

		super(
			finalId,
			merged.positionOnCanvas,
			merged.hitboxSize,
			"linearInputIndicator",
			merged.layerLevel
		);

		// Store nested config (NO flattening to top-level this.keyCode etc.)
		this.input = merged.input;
		this.processing = merged.processing;
		this.display = merged.display;

		// Initialize runtime values
		this.value = 0;
		this._previousValue = 0;
		this.opacity = 1.0;
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
		const keyCode = this.input.keyboard.keyCode;
		value += (keyCode && keyboard[keyCode]) ? 1 : 0;

		// Get mouse input
		const mouse = window.mouse;
		const mouseButton = this.input.mouse.button;
		if (mouseButton !== null && mouse.buttons[mouseButton]) {
			value += 1;
		}

		// Get mouse wheel input (single-frame events)
		const mouseWheel = this.input.mouse.wheel;
		if (mouseWheel !== null && mouse.wheelEvents) {
			if (mouseWheel === "up" && mouse.wheelEvents.up) {
				value += 1;
			} else if (mouseWheel === "down" && mouse.wheelEvents.down) {
				value += 1;
			}
		}

		// Compute antiDeadzone (adjusted by compensation axis)
		const antiDeadzone = this.processing.antiDeadzone;
		let newAntiDeadzone = Math.max(0, antiDeadzone - compensationAxisValue * 0.5);

		// Get gamepad input
		const gamepads = window.gamepads;
		if (gamepads) {
			for (let i = 0; i < gamepads.length; i++) {
				const gamepad = gamepads[i];
				if (!gamepad) continue;

				// Gamepad stick input
				const stick = this.input.gamepad.stick;
				const axisNumber = asConventionalGamepadAxisNumber(stick);
				if (gamepad.axes && axisNumber !== null) {
					const axisValue = gamepad.axes[axisNumber];
					const invertedAxis = (stick.direction === "negative");
					const radialCompensationAxis = this.processing.radialCompensationAxis;
					const compensationValue = radialCompensationAxis >= 0 ? gamepad.axes[radialCompensationAxis] : undefined;

					if (axisValue !== null && axisValue !== undefined
						&& ((invertedAxis === true && axisValue < 0)
						|| (invertedAxis === false && axisValue > 0))) {
						if (radialCompensationAxis >= 0 && compensationValue !== undefined) {
							// Converts circular back to square coordinates
							value += Math.abs(axisValue) * Math.sqrt(1 + 2 * Math.pow(Math.abs(compensationValue), 2));
						} else if (radialCompensationAxis < 0) {
							value += (Math.abs(axisValue) - newAntiDeadzone) / (1 - newAntiDeadzone);
						}
					}

					if (radialCompensationAxis >= 0 && compensationValue !== undefined) {
						compensationAxisValue += Math.abs(compensationValue);
					}
				}

				// Gamepad button input
				const buttonIndex = this.input.gamepad.button.index;
				if (gamepad.buttons && buttonIndex !== null) {
					const button = gamepad.buttons[buttonIndex];
					if (button) {
						value += button.value;
					}
				}
			}
		}

		// Calculate raw input value (clamped 0-1)
		if (newAntiDeadzone >= 1.0) newAntiDeadzone = 0.999;
		const multiplier = this.processing.multiplier;
		const rawValue = Math.max(Math.min((value - newAntiDeadzone) / (1 - newAntiDeadzone) * multiplier, 1), 0);

		// Signal processing: fade opacity, not fill amount
		const fadeOutDuration = this.processing.fadeOutDuration;
		if (rawValue > 0) {
			// Input active - instant response, full opacity
			this.value = rawValue;
			this.opacity = 1.0;
		} else if (fadeOutDuration > 0 && this.value > 0) {
			// Input inactive - keep fill at current value, fade opacity to 0
			const decayRate = 1.0 / fadeOutDuration;
			this.opacity = this.opacity * Math.exp(-decayRate * delta);

			if (this.opacity < 0.001) {
				this.opacity = 0;
				this.value = 0;
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
		const fillStyleBackground = this.display.fillStyleBackground;
		ctx.beginPath();
		canvas_fill_rec(ctx, 0, 0, this.hitboxSize.widthInPx, this.hitboxSize.lengthInPx, { fillStyle: fillStyleBackground });

		// Fill value (vertical fill from bottom or top)
		// Apply opacity to fillStyle for fade effect
		const fillStyle = this.display.fillStyle;
		const fillStyleWithOpacity = this.applyOpacityToColor(fillStyle, this.opacity);

		const reverseFillDirection = this.display.reverseFillDirection;
		ctx.beginPath();
		if (reverseFillDirection === true)
			canvas_fill_rec(ctx, 0, this.hitboxSize.lengthInPx, this.hitboxSize.widthInPx, -this.hitboxSize.lengthInPx * this.value, { fillStyle: fillStyleWithOpacity });
		else
			canvas_fill_rec(ctx, 0, 0, this.hitboxSize.widthInPx, this.hitboxSize.lengthInPx * this.value, { fillStyle: fillStyleWithOpacity });

		// Print key text centered with configurable stroke outline
		const keyText = this.display.text;
		const fontStyle = this.display.fontStyle;
		const textX = this.hitboxSize.widthInPx * 0.5;
		const textY = this.hitboxSize.lengthInPx * 0.5;
		canvas_properties(ctx, fontStyle);
		ctx.strokeStyle = fontStyle.strokeStyle ?? "white";
		ctx.lineWidth = fontStyle.strokeWidth ?? 3;
		ctx.strokeText(keyText, textX, textY);
		canvas_text(ctx, textX, textY, keyText, fontStyle);
	}
}

export { LinearInputIndicator };

// Deprecated: Use LinearInputIndicator.DEFAULT_TEMPLATE instead
export const defaultTemplateFor_LinearInputIndicator = LinearInputIndicator.DEFAULT_TEMPLATE;
