import { CanvasObjectInstance } from './BaseCanvasObject';
import { canvas_fill_rec, canvas_text, canvas_properties } from '../canvasDrawingHelpers';
import { deepMerge } from '../_helpers/deepMerge';
import type { DeepPartial } from '../../../_helpers/TypeUtilities';
import { LinearInputIndicatorSchema, type LinearInputIndicatorConfig } from '../../../modelToSaveCustomConfigurationLocally/configSchema';

type GamepadStickInput = {
	type: 'left' | 'right' | null;
	axis: 'X' | 'Y' | null;
	direction: 'positive' | 'negative' | null;
};

function asConventionalGamepadAxisNumber(stick: GamepadStickInput): number | null {
	if (stick.type === null || stick.axis === null) return null;
	return (stick.type === "left" ? 0 : 2) + (stick.axis === "X" ? 0 : 1);
}

export class LinearInputIndicator extends CanvasObjectInstance {
	// Single source of truth: Zod schema with defaults
	static readonly configDefaults: LinearInputIndicatorConfig = LinearInputIndicatorSchema.parse({});

	override readonly config: LinearInputIndicatorConfig;
	runtimeState: {
		value: number;
		previousValue: number;
		opacity: number;
	};

	constructor(configOverrides: DeepPartial<LinearInputIndicatorConfig>, objArrayIdx: number) {
		const config = deepMerge(LinearInputIndicator.configDefaults, configOverrides || {});
		super(objArrayIdx);
		this.config = config;
		this.runtimeState = {
			value: 0,
			previousValue: 0,
			opacity: 1.0
		};
	}

	private applyOpacityToColor(color: string, opacity: number): string {
		const rgbaMatch = color.match(/^rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)$/);
		if (rgbaMatch) {
			const r = rgbaMatch[1];
			const g = rgbaMatch[2];
			const b = rgbaMatch[3];
			const a = rgbaMatch[4] ? parseFloat(rgbaMatch[4]) : 1.0;
			const newAlpha = a * opacity;
			return `rgba(${r}, ${g}, ${b}, ${newAlpha})`;
		}

		const hexMatch = color.match(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/);
		if (hexMatch && hexMatch[1]) {
			let hex = hexMatch[1];
			if (hex.length === 3) {
				hex = hex.split('').map(char => char + char).join('');
			}
			const r = parseInt(hex.substring(0, 2), 16);
			const g = parseInt(hex.substring(2, 4), 16);
			const b = parseInt(hex.substring(4, 6), 16);
			return `rgba(${r}, ${g}, ${b}, ${opacity})`;
		}

		return color;
	}

	override update(delta: number): boolean {
		let value = 0;
		let compensationAxisValue = 0;

		const keyboard = window.keyboard;
		const keyCode = this.config.input.keyboard.keyCode;
		value += (keyCode && keyboard[keyCode]) ? 1 : 0;

		const mouse = window.mouse;
		const mouseButton = this.config.input.mouse.button;
		if (mouseButton !== null && mouse.buttons[mouseButton]) {
			value += 1;
		}

		const mouseWheel = this.config.input.mouse.wheel;
		if (mouseWheel !== null && mouse.wheelEvents) {
			if (mouseWheel === "up" && mouse.wheelEvents.up) {
				value += 1;
			} else if (mouseWheel === "down" && mouse.wheelEvents.down) {
				value += 1;
			}
		}

		const antiDeadzone = this.config.processing.antiDeadzone;
		let newAntiDeadzone = Math.max(0, antiDeadzone - compensationAxisValue * 0.5);

		const gamepads = window.gamepads;
		if (gamepads) {
			for (let i = 0; i < gamepads.length; i++) {
				const gamepad = gamepads[i];
				if (!gamepad) continue;

				const stick = this.config.input.gamepad.stick;
				const axisNumber = asConventionalGamepadAxisNumber(stick);
				if (gamepad.axes && axisNumber !== null) {
					const axisValue = gamepad.axes[axisNumber];
					const invertedAxis = (stick.direction === "negative");
					const radialCompensationAxis = this.config.processing.radialCompensationAxis;
					const compensationValue = radialCompensationAxis >= 0 ? gamepad.axes[radialCompensationAxis] : undefined;

					if (axisValue !== null && axisValue !== undefined
						&& ((invertedAxis === true && axisValue < 0)
						|| (invertedAxis === false && axisValue > 0))) {
						if (radialCompensationAxis >= 0 && compensationValue !== undefined) {
							value += Math.abs(axisValue) * Math.sqrt(1 + 2 * Math.pow(Math.abs(compensationValue), 2));
						} else if (radialCompensationAxis < 0) {
							value += (Math.abs(axisValue) - newAntiDeadzone) / (1 - newAntiDeadzone);
						}
					}

					if (radialCompensationAxis >= 0 && compensationValue !== undefined) {
						compensationAxisValue += Math.abs(compensationValue);
					}
				}

				const buttonIndex = this.config.input.gamepad.button.index;
				if (gamepad.buttons && buttonIndex !== null) {
					const button = gamepad.buttons[buttonIndex];
					if (button) {
						value += button.value;
					}
				}
			}
		}

		if (newAntiDeadzone >= 1.0) newAntiDeadzone = 0.999;
		const multiplier = this.config.processing.multiplier;
		const rawValue = Math.max(Math.min((value - newAntiDeadzone) / (1 - newAntiDeadzone) * multiplier, 1), 0);

		const fadeOutDuration = this.config.processing.fadeOutDuration;
		if (rawValue > 0) {
			this.runtimeState.value = rawValue;
			this.runtimeState.opacity = 1.0;
		} else if (fadeOutDuration > 0 && this.runtimeState.value > 0) {
			const decayRate = 1.0 / fadeOutDuration;
			this.runtimeState.opacity = this.runtimeState.opacity * Math.exp(-decayRate * delta);

			if (this.runtimeState.opacity < 0.001) {
				this.runtimeState.opacity = 0;
				this.runtimeState.value = 0;
			}
		} else {
			this.runtimeState.value = 0;
			this.runtimeState.opacity = 1.0;
		}

		return true;
	}

	override draw(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D): void {
		const fillStyleBackground = this.config.display.fillStyleBackground;
		ctx.beginPath();
		canvas_fill_rec(ctx, 0, 0, this.config.hitboxSize.widthInPx, this.config.hitboxSize.lengthInPx, { fillStyle: fillStyleBackground });

		const fillStyle = this.config.display.fillStyle;
		const fillStyleWithOpacity = this.applyOpacityToColor(fillStyle, this.runtimeState.opacity);

		const reverseFillDirection = this.config.display.fillDirection === 'reversed';
		ctx.beginPath();
		if (reverseFillDirection)
			canvas_fill_rec(ctx, 0, this.config.hitboxSize.lengthInPx, this.config.hitboxSize.widthInPx, -this.config.hitboxSize.lengthInPx * this.runtimeState.value, { fillStyle: fillStyleWithOpacity });
		else
			canvas_fill_rec(ctx, 0, 0, this.config.hitboxSize.widthInPx, this.config.hitboxSize.lengthInPx * this.runtimeState.value, { fillStyle: fillStyleWithOpacity });

		const keyText = this.config.display.text;
		const fontStyle = this.config.display.fontStyle;
		const textX = this.config.hitboxSize.widthInPx * 0.5;
		const textY = this.config.hitboxSize.lengthInPx * 0.5;
		canvas_properties(ctx, fontStyle);
		ctx.strokeStyle = fontStyle.strokeStyle ?? "white";
		ctx.lineWidth = fontStyle.strokeWidth ?? 3;
		ctx.strokeText(keyText, textX, textY);
		canvas_text(ctx, textX, textY, keyText, fontStyle);
	}
}
