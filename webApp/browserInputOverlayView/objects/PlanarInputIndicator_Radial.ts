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

// PlanarInputIndicator_Radial - 2D joystick visualization with radial display
function PlanarInputIndicator_Radial(x: number, y: number, width: number, height: number, properties?: Partial<PlanarInputIndicator_RadialProperties>) {

	// Framework properties
	this.x = x;
	this.y = y;
	this.width = width;
	this.height = height;
	this.defaultProperties = defaultPlanarInputIndicator_RadialProperties;
	this.className = "PlanarInputIndicator_Radial";

	// Merge properties using deep merge for nested objects
	const mergedProperties = deepMerge(defaultPlanarInputIndicator_RadialProperties, properties || {});
	applyProperties(this, mergedProperties);

	// Extract nested properties for internal use
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

	// Current input state
	this.inputVector = new Vector(0, 0);
	this.previousX = 0;
	this.previousY = 0;
}

// Update loop - reads gamepad axes and updates input vector
PlanarInputIndicator_Radial.prototype.update = function (delta: number): boolean {
	let xAxis = 0;
	let yAxis = 0;

	// Accumulate input from all mapped gamepad axes
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

	// Apply axis inversion
	if (this.invertX) xAxis *= -1;
	if (this.invertY) yAxis *= -1;

	// Store previous state
	this.previousX = this.inputVector.x;
	this.previousY = this.inputVector.y;

	// Update input vector (clamped to -1..1 range)
	this.inputVector.x = Math.max(Math.min(xAxis, 1), -1);
	this.inputVector.y = Math.max(Math.min(yAxis, 1), -1);

	// Return true if input changed (triggers redraw)
	return this.previousX !== this.inputVector.x || this.previousY !== this.inputVector.y;
}

// Draw function - visualizes 2D input as radial display
PlanarInputIndicator_Radial.prototype.draw = function (canvas: any, ctx: any): void {
	canvas_properties(ctx, { lineCap: "round" });
	ctx.transform(1, 0, 0, 1, this.radius, this.radius);

	// Background circle
	ctx.beginPath();
	canvas_arc(ctx, 0, 0, this.radius, 0, 2 * Math.PI, this.backgroundStyle);
	ctx.stroke();
	ctx.fill();

	// Deadzone circle (if deadzone > 0)
	if (this.deadzone > 0) {
		ctx.beginPath();
		canvas_arc(ctx, 0, 0, this.radius * this.deadzone, 0, 2 * Math.PI, this.deadzoneStyle);
		ctx.fill();
	}

	// X axis line
	ctx.beginPath();
	canvas_line(ctx, 0, 0, this.inputVector.x * this.radius, 0, this.xLineStyle);
	ctx.stroke();

	// Y axis line
	ctx.beginPath();
	canvas_line(ctx, 0, 0, 0, this.inputVector.y * this.radius, this.yLineStyle);
	ctx.stroke();

	// Draw vectors if input is outside deadzone
	if (this.inputVector.length() > this.deadzone) {
		const normalizedInput = this.inputVector.unit();
		const currentAngles = this.inputVector.toAngles();
		const clampedInput = Vector.fromAngles(currentAngles.theta, currentAngles.phi)
			.multiply((this.inputVector.length() - this.antiDeadzone) / (1 - this.antiDeadzone));

		// Unit vector (direction at max magnitude)
		ctx.beginPath();
		canvas_arrow(ctx, 0, 0, normalizedInput.x * this.radius, normalizedInput.y * this.radius, this.unitVectorStyle);
		ctx.stroke();

		// Input vector (actual magnitude with anti-deadzone applied)
		ctx.beginPath();
		canvas_arrow(ctx, 0, 0, clampedInput.x * this.radius, clampedInput.y * this.radius, this.inputVectorStyle);
		ctx.stroke();
	}

	ctx.closePath();
}

export { PlanarInputIndicator_Radial };
