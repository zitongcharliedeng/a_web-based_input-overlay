import { CanvasObjectInstance } from './BaseCanvasObject';
import { Vector } from '../../../_helpers/Vector';
import { deepMerge } from '../_helpers/deepMerge';
import { canvas_properties, canvas_arc, canvas_line, canvas_arrow } from '../canvasDrawingHelpers';
import type { DeepPartial } from '../../../_helpers/TypeUtilities';
import { PlanarInputIndicatorSchema, type PlanarInputIndicatorConfig } from '../../../modelToSaveCustomConfigurationLocally/configSchema';

export class PlanarInputIndicator extends CanvasObjectInstance {
	// Single source of truth: Zod schema with defaults
	static readonly configDefaults: PlanarInputIndicatorConfig = PlanarInputIndicatorSchema.parse({});

	override readonly config: PlanarInputIndicatorConfig;
	runtimeState: {
		inputVector: Vector;
		previousX: number;
		previousY: number;
	};

	constructor(configOverrides: DeepPartial<PlanarInputIndicatorConfig>, objArrayIdx: number) {
		const config = deepMerge(PlanarInputIndicator.configDefaults, configOverrides || {});
		super(objArrayIdx);
		this.config = config;
		this.runtimeState = {
			inputVector: new Vector(0, 0),
			previousX: 0,
			previousY: 0
		};
	}

	override update(): boolean {
		let xAxis = 0;
		let yAxis = 0;

		// Keyboard input (digital - adds +1 or -1)
		const keyboard = window.keyboard;
		if (keyboard) {
			const xKeyPos = this.config.input.xKeyCodePositive;
			const xKeyNeg = this.config.input.xKeyCodeNegative;
			const yKeyPos = this.config.input.yKeyCodePositive;
			const yKeyNeg = this.config.input.yKeyCodeNegative;

			if (xKeyPos && keyboard[xKeyPos]) xAxis += 1;
			if (xKeyNeg && keyboard[xKeyNeg]) xAxis -= 1;
			if (yKeyPos && keyboard[yKeyPos]) yAxis += 1;
			if (yKeyNeg && keyboard[yKeyNeg]) yAxis -= 1;
		}

		// Gamepad input (analog)
		const gamepads = window.gamepads;
		if (gamepads) {
			for (let i = 0; i < gamepads.length; i++) {
				const gamepad = gamepads[i];
				if (!gamepad) continue;
			if (gamepad.axes) {
				for (let i = 0; i < gamepad.axes.length; i++) {
					const axisValue = gamepad.axes[i];
					if (this.config.input.xAxes[i] && axisValue !== undefined) {
						xAxis += axisValue;
					}
					if (this.config.input.yAxes[i] && axisValue !== undefined) {
						yAxis += axisValue;
					}
				}
			}
			}
		}

		if (this.config.input.invertX) xAxis *= -1;
		if (this.config.input.invertY) yAxis *= -1;

		this.runtimeState.previousX = this.runtimeState.inputVector.x;
		this.runtimeState.previousY = this.runtimeState.inputVector.y;

		this.runtimeState.inputVector.x = Math.max(Math.min(xAxis, 1), -1);
		this.runtimeState.inputVector.y = Math.max(Math.min(yAxis, 1), -1);

		return this.runtimeState.previousX !== this.runtimeState.inputVector.x || this.runtimeState.previousY !== this.runtimeState.inputVector.y;
	}

	override draw(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D): void {
		canvas_properties(ctx, { lineCap: "round" });
		const radius = this.config.display.radius;
		ctx.transform(1, 0, 0, 1, radius, radius);

		ctx.beginPath();
		canvas_arc(ctx, 0, 0, radius, 0, 2 * Math.PI, this.config.display.backgroundStyle);
		ctx.stroke();
		ctx.fill();

		const deadzone = this.config.processing.deadzone;
		if (deadzone > 0) {
			ctx.beginPath();
			canvas_arc(ctx, 0, 0, radius * deadzone, 0, 2 * Math.PI, this.config.display.deadzoneStyle);
			ctx.fill();
		}

		ctx.beginPath();
		if (this.config.display.xLineStyle.opacity !== undefined) {
			ctx.globalAlpha = this.config.display.xLineStyle.opacity;
		}
		canvas_line(ctx, 0, 0, this.runtimeState.inputVector.x * radius, 0, this.config.display.xLineStyle);
		ctx.stroke();
		ctx.globalAlpha = 1.0;

		ctx.beginPath();
		if (this.config.display.yLineStyle.opacity !== undefined) {
			ctx.globalAlpha = this.config.display.yLineStyle.opacity;
		}
		canvas_line(ctx, 0, 0, 0, this.runtimeState.inputVector.y * radius, this.config.display.yLineStyle);
		ctx.stroke();
		ctx.globalAlpha = 1.0;

		if (this.runtimeState.inputVector.length() > deadzone) {
			const normalizedInput = this.runtimeState.inputVector.unit();
			const currentAngles = this.runtimeState.inputVector.toAngles();
			const antiDeadzone = this.config.processing.antiDeadzone;
			const clampedInput = Vector.fromAngles(currentAngles.theta, currentAngles.phi)
				.multiply((this.runtimeState.inputVector.length() - antiDeadzone) / (1 - antiDeadzone));

			ctx.beginPath();
			if (this.config.display.unitVectorStyle.opacity !== undefined) {
				ctx.globalAlpha = this.config.display.unitVectorStyle.opacity;
			}
			canvas_arrow(ctx, 0, 0, normalizedInput.x * radius, normalizedInput.y * radius, this.config.display.unitVectorStyle);
			ctx.stroke();
			ctx.globalAlpha = 1.0;

			ctx.beginPath();
			if (this.config.display.inputVectorStyle.opacity !== undefined) {
				ctx.globalAlpha = this.config.display.inputVectorStyle.opacity;
			}
			canvas_arrow(ctx, 0, 0, clampedInput.x * radius, clampedInput.y * radius, this.config.display.inputVectorStyle);
			ctx.stroke();
			ctx.globalAlpha = 1.0;
		}

		// Crosshair dot (center origin marker)
		ctx.beginPath();
		canvas_arc(ctx, 0, 0, 2, 0, 2 * Math.PI, this.config.display.crosshairStyle);
		ctx.fill();
		ctx.stroke();

		ctx.closePath();
	}
}
