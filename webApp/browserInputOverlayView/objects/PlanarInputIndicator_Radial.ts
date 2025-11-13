import { CanvasObject } from './CanvasObject.js';
import { Vector } from '../_helpers/Vector.js';
import { applyProperties, deepMerge } from '../_helpers/applyProperties.js';
import { canvas_properties, canvas_arc, canvas_line, canvas_arrow } from '../_helpers/draw.js';

// Type definitions
interface AxisMapping {
	[axisIndex: number]: boolean;
}

interface StyleProperties {
	strokeStyle?: string;
	fillStyle?: string;
	lineWidth?: number;
}

interface PlanarInputConfig {
	xAxes: AxisMapping;
	yAxes: AxisMapping;
	invertX: boolean;
	invertY: boolean;
}

interface PlanarProcessingConfig {
	deadzone: number;
	antiDeadzone: number;
}

interface PlanarDisplayConfig {
	radius: number;
	backgroundStyle: StyleProperties;
	xLineStyle: StyleProperties;
	yLineStyle: StyleProperties;
	deadzoneStyle: StyleProperties;
	inputVectorStyle: StyleProperties;
	unitVectorStyle: StyleProperties;
}

interface PlanarInputIndicator_RadialProperties {
	input: PlanarInputConfig;
	processing: PlanarProcessingConfig;
	display: PlanarDisplayConfig;
}

// Pure defaults - minimal assumptions
const defaultPlanarInputIndicator_RadialProperties: PlanarInputIndicator_RadialProperties = {
	input: {
		xAxes: { 0: true },  // Left stick X axis
		yAxes: { 1: true },  // Left stick Y axis
		invertX: false,
		invertY: false
	},
	processing: {
		deadzone: 0,         // Pure: no deadzone by default
		antiDeadzone: 0      // Pure: no anti-deadzone
	},
	display: {
		radius: 100,
		backgroundStyle: { strokeStyle: "#000000", lineWidth: 2, fillStyle: "rgba(255, 255, 255, 0.1)" },
		xLineStyle: { strokeStyle: "#0000FF", lineWidth: 2 },
		yLineStyle: { strokeStyle: "#FF0000", lineWidth: 2 },
		deadzoneStyle: { fillStyle: "#FF0000" },
		inputVectorStyle: { strokeStyle: "#AA0000", lineWidth: 3 },
		unitVectorStyle: { strokeStyle: "#000000", lineWidth: 2 }
	}
};

class PlanarInputIndicator_Radial extends CanvasObject {
	defaultProperties: PlanarInputIndicator_RadialProperties = defaultPlanarInputIndicator_RadialProperties;
	className: string = "PlanarInputIndicator_Radial";

	xAxes: AxisMapping = defaultPlanarInputIndicator_RadialProperties.input.xAxes;
	yAxes: AxisMapping = defaultPlanarInputIndicator_RadialProperties.input.yAxes;
	invertX: boolean = defaultPlanarInputIndicator_RadialProperties.input.invertX;
	invertY: boolean = defaultPlanarInputIndicator_RadialProperties.input.invertY;

	deadzone: number = defaultPlanarInputIndicator_RadialProperties.processing.deadzone;
	antiDeadzone: number = defaultPlanarInputIndicator_RadialProperties.processing.antiDeadzone;

	radius: number = defaultPlanarInputIndicator_RadialProperties.display.radius;
	backgroundStyle: StyleProperties = defaultPlanarInputIndicator_RadialProperties.display.backgroundStyle;
	xLineStyle: StyleProperties = defaultPlanarInputIndicator_RadialProperties.display.xLineStyle;
	yLineStyle: StyleProperties = defaultPlanarInputIndicator_RadialProperties.display.yLineStyle;
	deadzoneStyle: StyleProperties = defaultPlanarInputIndicator_RadialProperties.display.deadzoneStyle;
	inputVectorStyle: StyleProperties = defaultPlanarInputIndicator_RadialProperties.display.inputVectorStyle;
	unitVectorStyle: StyleProperties = defaultPlanarInputIndicator_RadialProperties.display.unitVectorStyle;

	inputVector: Vector = new Vector(0, 0);
	previousX: number = 0;
	previousY: number = 0;

	input: PlanarInputConfig;
	processing: PlanarProcessingConfig;
	display: PlanarDisplayConfig;

	constructor(x: number, y: number, width: number, height: number, properties?: Partial<PlanarInputIndicator_RadialProperties>) {
		super(
			{ pxFromCanvasTop: y, pxFromCanvasLeft: x },
			{ widthInPx: width, lengthInPx: height },
			"planarInputIndicator"
		);

		const mergedProperties = deepMerge(defaultPlanarInputIndicator_RadialProperties, properties || {});
		applyProperties(this, mergedProperties);

		if (this.input) {
			this.xAxes = this.input.xAxes;
			this.yAxes = this.input.yAxes;
			this.invertX = this.input.invertX;
			this.invertY = this.input.invertY;
		}

		if (this.processing) {
			this.deadzone = this.processing.deadzone;
			this.antiDeadzone = this.processing.antiDeadzone;
		}

		if (this.display) {
			this.radius = this.display.radius;
			this.backgroundStyle = this.display.backgroundStyle;
			this.xLineStyle = this.display.xLineStyle;
			this.yLineStyle = this.display.yLineStyle;
			this.deadzoneStyle = this.display.deadzoneStyle;
			this.inputVectorStyle = this.display.inputVectorStyle;
			this.unitVectorStyle = this.display.unitVectorStyle;
		}

		this.inputVector = new Vector(0, 0);
		this.previousX = 0;
		this.previousY = 0;
	}

	update(delta: number): boolean {
		let xAxis = 0;
		let yAxis = 0;

		const gamepads = (window as any).gamepads;
		for (const id in gamepads) {
			const gamepad = gamepads[id];
			if (gamepad !== null && gamepad.axes) {
				for (let i = 0; i < gamepad.axes.length; i++) {
					if (this.xAxes[i]) {
						xAxis += gamepad.axes[i] || 0;
					}
					if (this.yAxes[i]) {
						yAxis += gamepad.axes[i] || 0;
					}
				}
			}
		}

		if (this.invertX) xAxis *= -1;
		if (this.invertY) yAxis *= -1;

		this.previousX = this.inputVector.x;
		this.previousY = this.inputVector.y;

		this.inputVector.x = Math.max(Math.min(xAxis, 1), -1);
		this.inputVector.y = Math.max(Math.min(yAxis, 1), -1);

		return this.previousX !== this.inputVector.x || this.previousY !== this.inputVector.y;
	}

	draw(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D): void {
		canvas_properties(ctx, { lineCap: "round" });
		ctx.transform(1, 0, 0, 1, this.radius, this.radius);

		ctx.beginPath();
		canvas_arc(ctx, 0, 0, this.radius, 0, 2 * Math.PI, this.backgroundStyle);
		ctx.stroke();
		ctx.fill();

		if (this.deadzone > 0) {
			ctx.beginPath();
			canvas_arc(ctx, 0, 0, this.radius * this.deadzone, 0, 2 * Math.PI, this.deadzoneStyle);
			ctx.fill();
		}

		ctx.beginPath();
		canvas_line(ctx, 0, 0, this.inputVector.x * this.radius, 0, this.xLineStyle);
		ctx.stroke();

		ctx.beginPath();
		canvas_line(ctx, 0, 0, 0, this.inputVector.y * this.radius, this.yLineStyle);
		ctx.stroke();

		if (this.inputVector.length() > this.deadzone) {
			const normalizedInput = this.inputVector.unit();
			const currentAngles = this.inputVector.toAngles();
			const clampedInput = Vector.fromAngles(currentAngles.theta, currentAngles.phi)
				.multiply((this.inputVector.length() - this.antiDeadzone) / (1 - this.antiDeadzone));

			ctx.beginPath();
			canvas_arrow(ctx, 0, 0, normalizedInput.x * this.radius, normalizedInput.y * this.radius, this.unitVectorStyle);
			ctx.stroke();

			ctx.beginPath();
			canvas_arrow(ctx, 0, 0, clampedInput.x * this.radius, clampedInput.y * this.radius, this.inputVectorStyle);
			ctx.stroke();
		}

		ctx.closePath();
	}
}

export { PlanarInputIndicator_Radial };
