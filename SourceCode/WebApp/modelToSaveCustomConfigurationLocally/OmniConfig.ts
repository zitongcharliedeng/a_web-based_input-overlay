import type { CanvasObjectPosition, CanvasObjectHitbox } from '../viewWhichRendersConfigurationAndUi/canvasRenderer/canvasObjectTypes/BaseCanvasObject';
import type { DeepPartial } from '../_helpers/TypeUtilities';

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

// Default configurations - single source of truth for all default values
// These constants are used by constructors and spawn functions

export const LinearInputIndicatorDefaults = {
	positionOnCanvas: { pxFromCanvasLeft: 0, pxFromCanvasTop: 0 },
	hitboxSize: { widthInPx: 100, lengthInPx: 100 },
	layerLevel: 10,
	input: {
		keyboard: { keyCode: null as string | null },
		mouse: { button: null as number | null, wheel: null as 'up' | 'down' | null },
		gamepad: {
			stick: { type: null as 'left' | 'right' | null, axis: null as 'X' | 'Y' | null, direction: null as 'positive' | 'negative' | null },
			button: { index: null as number | null }
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
			textAlign: "center" as CanvasTextAlign,
			fillStyle: "black",
			font: "30px Lucida Console",
			strokeStyle: "white",
			strokeWidth: 3
		},
		reverseFillDirection: false
	}
} as const;

export const PlanarInputIndicatorDefaults = {
	positionOnCanvas: { pxFromCanvasLeft: 0, pxFromCanvasTop: 0 },
	hitboxSize: { widthInPx: 200, lengthInPx: 200 },
	layerLevel: 10,
	input: {
		xAxes: { "0": true } as { [gamepadIndex: string]: boolean },
		yAxes: { "1": true } as { [gamepadIndex: string]: boolean },
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
} as const;

export const TextDefaults = {
	positionOnCanvas: { pxFromCanvasLeft: 0, pxFromCanvasTop: 0 },
	hitboxSize: { widthInPx: 200, lengthInPx: 50 },
	layerLevel: 20,
	text: "Sample text",
	textStyle: {
		textAlign: "center" as CanvasTextAlign,
		fillStyle: "black",
		font: "30px Lucida Console",
		strokeStyle: "white",
		strokeWidth: 3
	},
	shouldStroke: true
} as const;

export const ImageDefaults = {
	positionOnCanvas: { pxFromCanvasLeft: 0, pxFromCanvasTop: 0 },
	hitboxSize: { widthInPx: 100, lengthInPx: 100 },
	layerLevel: 0,
	src: "https://raw.githubusercontent.com/zitongcharliedeng/a_web-based_input-overlay/refs/heads/master/webApp/sceneRender/_assets/images/KeyDefault.png",
	opacity: 1.0
} as const;

export const WebEmbedDefaults = {
	positionOnCanvas: { pxFromCanvasLeft: 0, pxFromCanvasTop: 0 },
	hitboxSize: { widthInPx: 640, lengthInPx: 480 },
	layerLevel: 10,
	url: "https://www.twitch.tv/",
	opacity: 1.0
} as const;
