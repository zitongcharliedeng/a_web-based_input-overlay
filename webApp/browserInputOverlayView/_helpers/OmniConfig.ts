// Omniconfig - Single source of truth for entire overlay scene
// NixOS-style: declarative, explicit (no hidden defaults), type-as-key, spawn templates

import type { CanvasObjectPosition, CanvasObjectHitbox } from '../objects/CanvasObject.js';

// Canvas configuration
export interface CanvasConfig {
	width: number;
	height: number;
	backgroundColor: string;
}

// Base config - all canvas objects have position and hitbox
interface BaseCanvasObjectConfig {
	positionOnCanvas: CanvasObjectPosition;
	hitboxSize: CanvasObjectHitbox;
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
	};
	display: {
		text: string;
		backgroundImage: string;
		fillStyle: string;
		fillStyleBackground: string;
		fontStyle: {
			textAlign: string;
			fillStyle: string;
			font: string;
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
	};
	shouldStroke: boolean;
}

// Discriminated union for all object types
export type CanvasObjectConfig =
	| { linearInputIndicator: LinearInputIndicatorConfig }
	| { planarInputIndicator: PlanarInputIndicatorConfig }
	| { text: TextConfig };

// Root omniconfig structure
export interface OmniConfig {
	canvas: CanvasConfig;
	objects: CanvasObjectConfig[];
}

// ============================================================================
// SPAWN TEMPLATES - Match patterns used in current test scene
// ============================================================================

// Common display defaults
const DEFAULT_KEY_IMAGE_URL = "https://raw.githubusercontent.com/zitongcharliedeng/a_web-based_input-overlay/refs/heads/master/webApp/browserInputOverlayView/_assets/images/KeyDefault.png";

const DEFAULT_DISPLAY = {
	text: "",
	backgroundImage: DEFAULT_KEY_IMAGE_URL,
	fillStyle: "#00ff00",
	fillStyleBackground: "#222222",
	fontStyle: {
		textAlign: "center",
		fillStyle: "white",
		font: "30px Lucida Console"
	},
	reverseFillDirection: false
};

// Pattern 1: Multi-input (keyboard + mouse + gamepad stick)
export function spawnMultiInputLinearIndicator(params: {
	positionOnCanvas: CanvasObjectPosition;
	hitboxSize: CanvasObjectHitbox;
	keyCode: string;
	mouseButton: number;
	stickType: 'left' | 'right';
	stickAxis: 'X' | 'Y';
	stickDirection: 'positive' | 'negative';
	linkedAxis: number;  // -1 for no compensation, 0/1/2/3 for compensation
	text: string;
}): LinearInputIndicatorConfig {
	return {
		positionOnCanvas: params.positionOnCanvas,
		hitboxSize: params.hitboxSize,
		input: {
			keyboard: { keyCode: params.keyCode },
			mouse: { button: params.mouseButton, wheel: null },
			gamepad: {
				stick: { type: params.stickType, axis: params.stickAxis, direction: params.stickDirection },
				button: { index: null }
			}
		},
		processing: {
			linkedAxis: params.linkedAxis,
			multiplier: 1,
			antiDeadzone: 0
		},
		display: {
			...DEFAULT_DISPLAY,
			text: params.text
		}
	};
}

// Pattern 2: Gamepad stick only
export function spawnGamepadStickLinearIndicator(params: {
	positionOnCanvas: CanvasObjectPosition;
	hitboxSize: CanvasObjectHitbox;
	stickType: 'left' | 'right';
	stickAxis: 'X' | 'Y';
	stickDirection: 'positive' | 'negative';
	linkedAxis: number;
	text: string;
}): LinearInputIndicatorConfig {
	return {
		positionOnCanvas: params.positionOnCanvas,
		hitboxSize: params.hitboxSize,
		input: {
			keyboard: { keyCode: null },
			mouse: { button: null, wheel: null },
			gamepad: {
				stick: { type: params.stickType, axis: params.stickAxis, direction: params.stickDirection },
				button: { index: null }
			}
		},
		processing: {
			linkedAxis: params.linkedAxis,
			multiplier: 1,
			antiDeadzone: 0
		},
		display: {
			...DEFAULT_DISPLAY,
			text: params.text
		}
	};
}

// Pattern 3: Keyboard only (digital)
export function spawnKeyboardLinearIndicator(params: {
	positionOnCanvas: CanvasObjectPosition;
	hitboxSize: CanvasObjectHitbox;
	keyCode: string;
	text: string;
}): LinearInputIndicatorConfig {
	return {
		positionOnCanvas: params.positionOnCanvas,
		hitboxSize: params.hitboxSize,
		input: {
			keyboard: { keyCode: params.keyCode },
			mouse: { button: null, wheel: null },
			gamepad: {
				stick: { type: null, axis: null, direction: null },
				button: { index: null }
			}
		},
		processing: {
			linkedAxis: -1,
			multiplier: 1,
			antiDeadzone: 0
		},
		display: {
			...DEFAULT_DISPLAY,
			text: params.text
		}
	};
}

// Pattern 4: Gamepad button only
export function spawnGamepadButtonLinearIndicator(params: {
	positionOnCanvas: CanvasObjectPosition;
	hitboxSize: CanvasObjectHitbox;
	buttonIndex: number;
	text: string;
}): LinearInputIndicatorConfig {
	return {
		positionOnCanvas: params.positionOnCanvas,
		hitboxSize: params.hitboxSize,
		input: {
			keyboard: { keyCode: null },
			mouse: { button: null, wheel: null },
			gamepad: {
				stick: { type: null, axis: null, direction: null },
				button: { index: params.buttonIndex }
			}
		},
		processing: {
			linkedAxis: -1,
			multiplier: 1,
			antiDeadzone: 0
		},
		display: {
			...DEFAULT_DISPLAY,
			text: params.text
		}
	};
}

// Pattern 5: Planar indicator (joystick visualization)
export function spawnPlanarIndicator(params: {
	positionOnCanvas: CanvasObjectPosition;
	hitboxSize: CanvasObjectHitbox;
	xAxes: { [gamepadIndex: number]: boolean };
	yAxes: { [gamepadIndex: number]: boolean };
}): PlanarInputIndicatorConfig {
	return {
		positionOnCanvas: params.positionOnCanvas,
		hitboxSize: params.hitboxSize,
		input: {
			xAxes: params.xAxes,
			yAxes: params.yAxes,
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
	};
}

// Pattern 6: Text label
export function spawnTextLabel(params: {
	positionOnCanvas: CanvasObjectPosition;
	hitboxSize: CanvasObjectHitbox;
	text: string;
	font?: string;
}): TextConfig {
	return {
		positionOnCanvas: params.positionOnCanvas,
		hitboxSize: params.hitboxSize,
		text: params.text,
		textStyle: {
			textAlign: "left",
			fillStyle: "#FFFFFF",
			font: params.font || "20px Lucida Console"
		},
		shouldStroke: false
	};
}
