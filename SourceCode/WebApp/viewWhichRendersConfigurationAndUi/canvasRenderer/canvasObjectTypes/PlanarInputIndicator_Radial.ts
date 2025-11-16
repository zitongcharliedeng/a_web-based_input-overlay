import { CanvasObject } from './BaseCanvasObject';
import { Vector } from '../../../_helpers/Vector';
import { deepMerge } from '../_helpers/deepMerge';
import { canvas_properties, canvas_arc, canvas_line, canvas_arrow } from '../canvasDrawingHelpers';
import type { PlanarInputIndicatorConfig, PlanarInputIndicatorTemplate, CanvasObjectConfig } from '../../../modelToSaveCustomConfigurationLocally/OmniConfig';
import { PlanarInputIndicatorDefaults } from '../../../modelToSaveCustomConfigurationLocally/OmniConfig';


class PlanarInputIndicator_Radial extends CanvasObject {
	static readonly TYPE = 'planarInputIndicator' as const;
	static readonly DISPLAY_NAME = 'PlanarInputIndicator_Radial';

	static fromConfig(config: CanvasObjectConfig, objArrayIdx: number): PlanarInputIndicator_Radial {
		if (!('planarInputIndicator' in config)) {
			throw new Error('Invalid config for PlanarInputIndicator_Radial: expected { planarInputIndicator: {...} }');
		}
		return new PlanarInputIndicator_Radial(config.planarInputIndicator, objArrayIdx);
	}

	inputVector: Vector;
	previousX: number;
	previousY: number;

	input: PlanarInputIndicatorTemplate['input'];
	processing: PlanarInputIndicatorTemplate['processing'];
	display: PlanarInputIndicatorTemplate['display'];

	constructor(config: Partial<PlanarInputIndicatorConfig>, objArrayIdx: number) {
		const merged = deepMerge(PlanarInputIndicatorDefaults, config);

		super(
			objArrayIdx,
			merged.positionOnCanvas,
			merged.hitboxSize,
			"planarInputIndicator",
			merged.layerLevel
		);

		this.input = merged.input;
		this.processing = merged.processing;
		this.display = merged.display;

		this.inputVector = new Vector(0, 0);
		this.previousX = 0;
		this.previousY = 0;
	}

	update(): boolean {
		let xAxis = 0;
		let yAxis = 0;

		const gamepads = window.gamepads;
		if (gamepads) {
			for (let i = 0; i < gamepads.length; i++) {
				const gamepad = gamepads[i];
				if (!gamepad) continue;
			if (gamepad.axes) {
				for (let i = 0; i < gamepad.axes.length; i++) {
					const axisValue = gamepad.axes[i];
					if (this.input.xAxes[i] && axisValue !== undefined) {
						xAxis += axisValue;
					}
					if (this.input.yAxes[i] && axisValue !== undefined) {
						yAxis += axisValue;
					}
				}
			}
			}
		}

		if (this.input.invertX) xAxis *= -1;
		if (this.input.invertY) yAxis *= -1;

		this.previousX = this.inputVector.x;
		this.previousY = this.inputVector.y;

		this.inputVector.x = Math.max(Math.min(xAxis, 1), -1);
		this.inputVector.y = Math.max(Math.min(yAxis, 1), -1);

		return this.previousX !== this.inputVector.x || this.previousY !== this.inputVector.y;
	}

	draw(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D): void {
		canvas_properties(ctx, { lineCap: "round" });
		const radius = this.display.radius;
		ctx.transform(1, 0, 0, 1, radius, radius);

		ctx.beginPath();
		canvas_arc(ctx, 0, 0, radius, 0, 2 * Math.PI, this.display.backgroundStyle);
		ctx.stroke();
		ctx.fill();

		const deadzone = this.processing.deadzone;
		if (deadzone > 0) {
			ctx.beginPath();
			canvas_arc(ctx, 0, 0, radius * deadzone, 0, 2 * Math.PI, this.display.deadzoneStyle);
			ctx.fill();
		}

		ctx.beginPath();
		canvas_line(ctx, 0, 0, this.inputVector.x * radius, 0, this.display.xLineStyle);
		ctx.stroke();

		ctx.beginPath();
		canvas_line(ctx, 0, 0, 0, this.inputVector.y * radius, this.display.yLineStyle);
		ctx.stroke();

		if (this.inputVector.length() > deadzone) {
			const normalizedInput = this.inputVector.unit();
			const currentAngles = this.inputVector.toAngles();
			const antiDeadzone = this.processing.antiDeadzone;
			const clampedInput = Vector.fromAngles(currentAngles.theta, currentAngles.phi)
				.multiply((this.inputVector.length() - antiDeadzone) / (1 - antiDeadzone));

			ctx.beginPath();
			canvas_arrow(ctx, 0, 0, normalizedInput.x * radius, normalizedInput.y * radius, this.display.unitVectorStyle);
			ctx.stroke();

			ctx.beginPath();
			canvas_arrow(ctx, 0, 0, clampedInput.x * radius, clampedInput.y * radius, this.display.inputVectorStyle);
			ctx.stroke();
		}

		ctx.closePath();
	}
}

export { PlanarInputIndicator_Radial };
