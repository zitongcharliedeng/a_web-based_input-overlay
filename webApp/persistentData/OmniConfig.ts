import type { CanvasObjectPosition, CanvasObjectHitbox } from '../sceneRender/CanvasObjects/BaseCanvasObject.js';

// Canvas configuration
export interface CanvasConfig {
	width: number;
	height: number;
	backgroundColor: string;
}

// Base config - all canvas objects have position, hitbox, and layer order
interface BaseCanvasObjectConfig {
	positionOnCanvas: CanvasObjectPosition;
	hitboxSize: CanvasObjectHitbox;
	layerLevel: number;  // Z-index for rendering order (lower = behind, higher = front)
}

// LinearInputIndicator configuration - ALL fields required (explicit config)
export interface LinearInputIndicatorConfig extends BaseCanvasObjectConfig {
	input: {
		keyboard: { keyCode: string | null };
		mouse: { button: number | null; wheel: 'up' | 'down' | null };
		gamepad: {
			stick: { type: 'left' | 'right' | null; axis: 'X' | 'Y' | null; direction: 'positive' | 'negative' | null };
			button: { index: number | null };
		};
	};
	processing: {
		radialCompensationAxis: number;
		multiplier: number;
		antiDeadzone: number;
		fadeOutDuration: number;
	};
	display: {
		text: string;
		fillStyle: string;
		fillStyleBackground: string;
		fontStyle: {
			textAlign: string;
			fillStyle: string;
			font: string;
			strokeStyle: string;
			strokeWidth: number;
		};
		reverseFillDirection: boolean;
	};
}

// Style properties used in PlanarInputIndicator
export interface StyleProperties {
	strokeStyle?: string;
	fillStyle?: string;
	lineWidth?: number;
}

// PlanarInputIndicator configuration - ALL fields required (explicit config)
export interface PlanarInputIndicatorConfig extends BaseCanvasObjectConfig {
	input: {
		xAxes: { [gamepadIndex: string]: boolean };
		yAxes: { [gamepadIndex: string]: boolean };
		invertX: boolean;
		invertY: boolean;
	};
	processing: {
		deadzone: number;
		antiDeadzone: number;
	};
	display: {
		radius: number;
		stickRadius?: number;
		fillStyle?: string;
		fillStyleStick?: string;
		fillStyleBackground?: string;
		backgroundStyle: StyleProperties;
		xLineStyle: StyleProperties;
		yLineStyle: StyleProperties;
		deadzoneStyle: StyleProperties;
		inputVectorStyle: StyleProperties;
		unitVectorStyle: StyleProperties;
	};
}

// Text configuration - ALL fields required (explicit config)
export interface TextConfig extends BaseCanvasObjectConfig {
	text: string;
	textStyle: {
		textAlign: string;
		fillStyle: string;
		font: string;
		strokeStyle: string;
		strokeWidth: number;
	};
	shouldStroke: boolean;
}

// Image configuration - displays a static image (PNG/JPG/etc)
export interface ImageConfig extends BaseCanvasObjectConfig {
	src: string;  // URL or data URL
	opacity: number;  // 0.0 to 1.0
}

// Discriminated union for all object types
export type CanvasObjectConfig =
	| { linearInputIndicator: LinearInputIndicatorConfig }
	| { planarInputIndicator: PlanarInputIndicatorConfig }
	| { text: TextConfig }
	| { image: ImageConfig };

export interface OmniConfig {
	canvas: CanvasConfig;
	objects: CanvasObjectConfig[];
}
