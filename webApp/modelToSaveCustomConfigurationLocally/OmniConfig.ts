import type { CanvasObjectPosition, CanvasObjectHitbox } from '../viewWhichRendersConfigurationAndUi/canvasRenderer/canvasObjectTypes/BaseCanvasObject.js';

// Canvas configuration
export interface CanvasConfig {
	width: number;
	height: number;
	backgroundColor: string;
}

// Base config - all canvas objects have position, hitbox, and layer order
interface BaseCanvasObjectConfig {
	id: string;  // Unique identifier (UUID) for stable object identity
	positionOnCanvas: CanvasObjectPosition;
	hitboxSize: CanvasObjectHitbox;
	layerLevel: number;  // Z-index for rendering order (lower = behind, higher = front)
}

// LinearInputIndicator template - property defaults only (no id/position/size)
export interface LinearInputIndicatorTemplate {
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

// LinearInputIndicator configuration - full config with runtime fields
export interface LinearInputIndicatorConfig extends BaseCanvasObjectConfig {
	input: LinearInputIndicatorTemplate['input'];
	processing: LinearInputIndicatorTemplate['processing'];
	display: LinearInputIndicatorTemplate['display'];
}

// Style properties used in PlanarInputIndicator
export interface StyleProperties {
	strokeStyle?: string;
	fillStyle?: string;
	lineWidth?: number;
}

// PlanarInputIndicator template - property defaults only
export interface PlanarInputIndicatorTemplate {
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

// PlanarInputIndicator configuration - full config with runtime fields
export interface PlanarInputIndicatorConfig extends BaseCanvasObjectConfig {
	input: PlanarInputIndicatorTemplate['input'];
	processing: PlanarInputIndicatorTemplate['processing'];
	display: PlanarInputIndicatorTemplate['display'];
}

// Text template - property defaults only
export interface TextTemplate {
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

// Text configuration - full config with runtime fields
export interface TextConfig extends BaseCanvasObjectConfig {
	text: TextTemplate['text'];
	textStyle: TextTemplate['textStyle'];
	shouldStroke: TextTemplate['shouldStroke'];
}

// Image template - property defaults only
export interface ImageTemplate {
	src: string;  // URL or data URL
	opacity: number;  // 0.0 to 1.0
}

// Image configuration - full config with runtime fields
export interface ImageConfig extends BaseCanvasObjectConfig {
	src: ImageTemplate['src'];
	opacity: ImageTemplate['opacity'];
}

// WebEmbed template - property defaults only
export interface WebEmbedTemplate {
	url: string;  // URL to embed
	opacity: number;  // 0.0 to 1.0
}

// WebEmbed configuration - full config with runtime fields
export interface WebEmbedConfig extends BaseCanvasObjectConfig {
	url: WebEmbedTemplate['url'];
	opacity: WebEmbedTemplate['opacity'];
}

// Discriminated union for all object types
export type CanvasObjectConfig =
	| { linearInputIndicator: LinearInputIndicatorConfig }
	| { planarInputIndicator: PlanarInputIndicatorConfig }
	| { text: TextConfig }
	| { image: ImageConfig }
	| { webEmbed: WebEmbedConfig };

export interface OmniConfig {
	canvas: CanvasConfig;
	objects: CanvasObjectConfig[];
}
