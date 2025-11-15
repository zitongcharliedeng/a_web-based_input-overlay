import { CanvasObject } from './BaseCanvasObject.js';
import { Vector } from '../../../_helpers/Vector.js';
import { canvas_properties, canvas_arc, canvas_line, canvas_arrow } from '../canvasDrawingHelpers.js';
import type { PlanarInputIndicatorConfig, PlanarInputIndicatorTemplate, CanvasObjectConfig } from '../../../modelToSaveCustomConfigurationLocally/OmniConfig.js';

interface AxisMapping {
	[axisIndex: number]: boolean;
}

interface StyleProperties {
	strokeStyle?: string;
	fillStyle?: string;
	lineWidth?: number;
}

interface PlanarInputConfig {
	xAxes?: AxisMapping;
	yAxes?: AxisMapping;
	invertX?: boolean;
	invertY?: boolean;
}

interface PlanarProcessingConfig {
	deadzone?: number;
	antiDeadzone?: number;
}

interface PlanarDisplayConfig {
	radius?: number;
	backgroundStyle?: StyleProperties;
	xLineStyle?: StyleProperties;
	yLineStyle?: StyleProperties;
	deadzoneStyle?: StyleProperties;
	inputVectorStyle?: StyleProperties;
	unitVectorStyle?: StyleProperties;
}

interface PlanarInputIndicator_RadialProperties {
	input?: PlanarInputConfig;
	processing?: PlanarProcessingConfig;
	display?: PlanarDisplayConfig;
}

interface PlanarInputConfigDefaults {
	xAxes: AxisMapping;
	yAxes: AxisMapping;
	invertX: boolean;
	invertY: boolean;
}

interface PlanarProcessingConfigDefaults {
	deadzone: number;
	antiDeadzone: number;
}

interface PlanarDisplayConfigDefaults {
	radius: number;
	backgroundStyle: StyleProperties;
	xLineStyle: StyleProperties;
	yLineStyle: StyleProperties;
	deadzoneStyle: StyleProperties;
	inputVectorStyle: StyleProperties;
	unitVectorStyle: StyleProperties;
}

interface PlanarInputIndicatorDefaults {
	input: PlanarInputConfigDefaults;
	processing: PlanarProcessingConfigDefaults;
	display: PlanarDisplayConfigDefaults;
}

const defaultPlanarInputIndicator_RadialProperties: PlanarInputIndicatorDefaults = {
	input: {
		xAxes: { 0: true },  // Left stick X axis
		yAxes: { 1: true },  // Left stick Y axis
		invertX: false,
		invertY: false
	},
	processing: {
		deadzone: 0.01,
		antiDeadzone: 0
	},
	display: {
		radius: 100,
		backgroundStyle: { strokeStyle: "#B4B4B4", lineWidth: 2, fillStyle: "rgba(0, 0, 0, 0)" },
		xLineStyle: { strokeStyle: "#FF0000", lineWidth: 2 },
		yLineStyle: { strokeStyle: "#00FF00", lineWidth: 2 },
		deadzoneStyle: { fillStyle: "#524d4d" },
		inputVectorStyle: { strokeStyle: "#FFFF00", lineWidth: 2 },
		unitVectorStyle: { strokeStyle: "#0000FF", lineWidth: 2 }
	}
};

class PlanarInputIndicator_Radial extends CanvasObject {
	static readonly TYPE = 'planarInputIndicator' as const;
	static readonly DISPLAY_NAME = 'PlanarInputIndicator_Radial';
	static readonly DEFAULT_TEMPLATE: PlanarInputIndicatorTemplate = {
		input: {
			xAxes: {},
			yAxes: {},
			invertX: false,
			invertY: false
		},
		processing: {
			deadzone: 0.01,
			antiDeadzone: 0
		},
		display: {
			radius: 100,
			stickRadius: 40,
			fillStyle: "#00ff00",
			fillStyleStick: "#ffffff",
			fillStyleBackground: "rgba(0, 0, 0, 0.5)",
			backgroundStyle: { lineWidth: 2, strokeStyle: "#B4B4B4", fillStyle: "rgba(0, 0, 0, 0)" },
			xLineStyle: { strokeStyle: "#FF0000", lineWidth: 2 },
			yLineStyle: { strokeStyle: "#00FF00", lineWidth: 2 },
			deadzoneStyle: { fillStyle: "#524d4d" },
			inputVectorStyle: { strokeStyle: "#FFFF00", lineWidth: 2 },
			unitVectorStyle: { strokeStyle: "#0000FF", lineWidth: 2 }
		}
	};

	static fromConfig(config: CanvasObjectConfig): PlanarInputIndicator_Radial {
		if (config.type !== 'planarInputIndicator') {
			throw new Error(`Invalid config type: expected planarInputIndicator, got ${config.type}`);
		}
		return new PlanarInputIndicator_Radial(
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

	defaultProperties: PlanarInputIndicator_RadialProperties = defaultPlanarInputIndicator_RadialProperties;
	className: string = "PlanarInputIndicator_Radial";

	inputVector!: Vector;
	previousX!: number;
	previousY!: number;

	input!: PlanarInputConfigDefaults;
	processing!: PlanarProcessingConfigDefaults;
	display!: PlanarDisplayConfigDefaults;

	constructor(id: string, x: number, y: number, width: number, height: number, properties?: PlanarInputIndicator_RadialProperties, layerLevel?: number) {
		super(
			id,
			{ pxFromCanvasTop: y, pxFromCanvasLeft: x },
			{ widthInPx: width, lengthInPx: height },
			"planarInputIndicator",
			layerLevel ?? 10
		);

		const props = properties ?? {};
		const defaults = defaultPlanarInputIndicator_RadialProperties;

		this.input = {
			xAxes: props.input?.xAxes ?? defaults.input.xAxes,
			yAxes: props.input?.yAxes ?? defaults.input.yAxes,
			invertX: props.input?.invertX ?? defaults.input.invertX,
			invertY: props.input?.invertY ?? defaults.input.invertY
		};

		this.processing = { ...defaults.processing, ...props.processing };

		this.display = {
			radius: props.display?.radius ?? defaults.display.radius,
			backgroundStyle: { ...defaults.display.backgroundStyle, ...props.display?.backgroundStyle },
			xLineStyle: { ...defaults.display.xLineStyle, ...props.display?.xLineStyle },
			yLineStyle: { ...defaults.display.yLineStyle, ...props.display?.yLineStyle },
			deadzoneStyle: { ...defaults.display.deadzoneStyle, ...props.display?.deadzoneStyle },
			inputVectorStyle: { ...defaults.display.inputVectorStyle, ...props.display?.inputVectorStyle },
			unitVectorStyle: { ...defaults.display.unitVectorStyle, ...props.display?.unitVectorStyle }
		};

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

export const defaultTemplateFor_PlanarInputIndicator: PlanarInputIndicatorTemplate = {
	input: {
		xAxes: {},
		yAxes: {},
		invertX: false,
		invertY: false
	},
	processing: {
		deadzone: 0.01,
		antiDeadzone: 0
	},
	display: {
		radius: 100,
		stickRadius: 40,
		fillStyle: "#00ff00",
		fillStyleStick: "#ffffff",
		fillStyleBackground: "rgba(0, 0, 0, 0.5)",
		backgroundStyle: { lineWidth: 2, strokeStyle: "#B4B4B4", fillStyle: "rgba(0, 0, 0, 0)" },
		xLineStyle: { strokeStyle: "#FF0000", lineWidth: 2 },
		yLineStyle: { strokeStyle: "#00FF00", lineWidth: 2 },
		deadzoneStyle: { fillStyle: "#524d4d" },
		inputVectorStyle: { strokeStyle: "#FFFF00", lineWidth: 2 },
		unitVectorStyle: { strokeStyle: "#0000FF", lineWidth: 2 }
	}
};
