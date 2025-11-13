// Omniconfig - Single source of truth for entire overlay scene
// NixOS-style: declarative, explicit (no hidden defaults), type-as-key, spawn templates

import type { CanvasObjectPosition, CanvasObjectHitbox } from '../CanvasObject/index.js';

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
		linkedAxis: number;
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

// PlanarInputIndicator configuration - ALL fields required (explicit config)
export interface PlanarInputIndicatorConfig extends BaseCanvasObjectConfig {
	input: {
		xAxes: { [gamepadIndex: number]: boolean };
		yAxes: { [gamepadIndex: number]: boolean };
		invertX: boolean;
		invertY: boolean;
	};
	processing: {
		deadzone: number;
		antiDeadzone: number;
	};
	display: {
		radius: number;
		stickRadius: number;
		fillStyle: string;
		fillStyleStick: string;
		fillStyleBackground: string;
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

// Root omniconfig structure
export interface OmniConfig {
	canvas: CanvasConfig;
	objects: CanvasObjectConfig[];
}

// ============================================================================
// DEFAULT TEMPLATES - Complete configs with sensible defaults
// Usage: Spread and override what you need
// Position defaults to 0,0; size defaults to usable values
// Final omniconfig is always explicit and complete
// ============================================================================

// Common constants
const DEFAULT_KEY_IMAGE_URL = "https://raw.githubusercontent.com/zitongcharliedeng/a_web-based_input-overlay/refs/heads/master/webApp/browserInputOverlayView/_assets/images/KeyDefault.png";

// LinearInputIndicator default template - complete config
export const defaultTemplateFor_LinearInputIndicator: LinearInputIndicatorConfig = {
	positionOnCanvas: { pxFromCanvasLeft: 0, pxFromCanvasTop: 0 },
	hitboxSize: { widthInPx: 100, lengthInPx: 100 },  // Sensible default size
	layerLevel: 10,  // Front layer by default (background images should be 0-9)
	input: {
		keyboard: { keyCode: null },
		mouse: { button: null, wheel: null },
		gamepad: {
			stick: { type: null, axis: null, direction: null },
			button: { index: null }
		}
	},
	processing: {
		linkedAxis: -1,
		multiplier: 1,
		antiDeadzone: 0,
		fadeOutDuration: 0.2
	},
	display: {
		text: "",
		fillStyle: "#00ff00",
		fillStyleBackground: "#222222",
		fontStyle: {
			textAlign: "center",
			fillStyle: "black",
			font: "30px Lucida Console",
			strokeStyle: "white",
			strokeWidth: 3
		},
		reverseFillDirection: false
	}
} as const;

// PlanarInputIndicator default template - complete config
export const defaultTemplateFor_PlanarInputIndicator: PlanarInputIndicatorConfig = {
	positionOnCanvas: { pxFromCanvasLeft: 0, pxFromCanvasTop: 0 },
	hitboxSize: { widthInPx: 200, lengthInPx: 200 },  // Sensible default size
	layerLevel: 10,  // Front layer by default
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
		fillStyleBackground: "rgba(0, 0, 0, 0.5)"
	}
} as const;

// Text default template - complete config
export const defaultTemplateFor_Text: TextConfig = {
	positionOnCanvas: { pxFromCanvasLeft: 0, pxFromCanvasTop: 0 },
	hitboxSize: { widthInPx: 600, lengthInPx: 30 },  // Sensible default size for labels
	layerLevel: 20,  // Text usually on top
	text: "",
	textStyle: {
		textAlign: "left",
		fillStyle: "black",
		font: "20px Lucida Console",
		strokeStyle: "white",
		strokeWidth: 3
	},
	shouldStroke: true
} as const;

// Image default template - complete config
export const defaultTemplateFor_Image: ImageConfig = {
	positionOnCanvas: { pxFromCanvasLeft: 0, pxFromCanvasTop: 0 },
	hitboxSize: { widthInPx: 100, lengthInPx: 100 },  // Default size, actual size from image
	layerLevel: 0,  // Background layer by default
	src: DEFAULT_KEY_IMAGE_URL,
	opacity: 1.0
} as const;
