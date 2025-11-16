import type { CanvasObjectPosition, CanvasObjectHitbox } from '../viewWhichRendersConfigurationAndUi/canvasRenderer/canvasObjectTypes/BaseCanvasObject';

// Utility type: Deep Partial - makes all nested properties optional
type DeepPartial<T> = T extends object ? {
	[P in keyof T]?: DeepPartial<T[P]>;
} : T;

// Canvas configuration
export interface CanvasConfig {
	width: number;
	height: number;
	backgroundColor: string;
}

// Base config - all canvas objects have position, hitbox, and layer order
// Note: Array index is used as object identifier (no separate id field needed)
interface BaseCanvasObjectConfig {
	positionOnCanvas?: CanvasObjectPosition;
	hitboxSize?: CanvasObjectHitbox;
	layerLevel?: number;  // Z-index for rendering order (lower = behind, higher = front)
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
			textAlign: CanvasTextAlign;
			fillStyle: string;
			font: string;
			strokeStyle: string;
			strokeWidth: number;
		};
		reverseFillDirection: boolean;
	};
}

// LinearInputIndicator configuration - full config with runtime fields (DeepPartial for partial configs)
export interface LinearInputIndicatorConfig extends BaseCanvasObjectConfig {
	input?: DeepPartial<LinearInputIndicatorTemplate['input']>;
	processing?: DeepPartial<LinearInputIndicatorTemplate['processing']>;
	display?: DeepPartial<LinearInputIndicatorTemplate['display']>;
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

// PlanarInputIndicator configuration - full config with runtime fields (DeepPartial for partial configs)
export interface PlanarInputIndicatorConfig extends BaseCanvasObjectConfig {
	input?: DeepPartial<PlanarInputIndicatorTemplate['input']>;
	processing?: DeepPartial<PlanarInputIndicatorTemplate['processing']>;
	display?: DeepPartial<PlanarInputIndicatorTemplate['display']>;
}

// Text template - property defaults only
export interface TextTemplate {
	text: string;
	textStyle: {
		textAlign: CanvasTextAlign;
		fillStyle: string;
		font: string;
		strokeStyle: string;
		strokeWidth: number;
	};
	shouldStroke: boolean;
}

// Text configuration - full config with runtime fields (DeepPartial for partial configs)
export interface TextConfig extends BaseCanvasObjectConfig {
	text?: TextTemplate['text'];
	textStyle?: DeepPartial<TextTemplate['textStyle']>;
	shouldStroke?: TextTemplate['shouldStroke'];
}

// Image template - property defaults only
export interface ImageTemplate {
	src: string;  // URL or data URL
	opacity: number;  // 0.0 to 1.0
}

// Image configuration - full config with runtime fields
export interface ImageConfig extends BaseCanvasObjectConfig {
	src?: ImageTemplate['src'];
	opacity?: ImageTemplate['opacity'];
}

// WebEmbed template - property defaults only
export interface WebEmbedTemplate {
	url: string;  // URL to embed
	opacity: number;  // 0.0 to 1.0
}

// WebEmbed configuration - full config with runtime fields
export interface WebEmbedConfig extends BaseCanvasObjectConfig {
	url?: WebEmbedTemplate['url'];
	opacity?: WebEmbedTemplate['opacity'];
}

// Discriminated union for all object types (NixOS-style: type as key)
// Array index is used as object ID
export type CanvasObjectConfig =
	| { linearInputIndicator: LinearInputIndicatorConfig }
	| { planarInputIndicator: PlanarInputIndicatorConfig }
	| { text: TextConfig }
	| { image: ImageConfig }
	| { webEmbed: WebEmbedConfig };

// Exhaustive type checking helper (compiler enforces all cases handled)
export function assertNever(value: never): never {
	throw new Error(`Unhandled discriminated union member: ${JSON.stringify(value)}`);
}

export interface OmniConfig {
	canvas: CanvasConfig;
	objects: CanvasObjectConfig[];
}
