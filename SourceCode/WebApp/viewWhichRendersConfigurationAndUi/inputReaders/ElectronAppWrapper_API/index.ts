/**
 * Electron API Bridge - Bridges uiohook and SDL events to Web APIs
 *
 * This module overrides navigator.getGamepads() and dispatches synthetic DOM events
 * to bridge Electron's uiohook (global keyboard/mouse) and SDL (gamepad) to standard Web APIs.
 *
 * Only runs when window.electronAPI is available (Electron environment).
 */

// Type definitions for Electron API exposed via contextBridge (must match DesktopWrappedWebapp/preload.ts)
interface GlobalKeyEvent {
	keycode: number;
	rawcode: number;
	timestamp: number;
}

interface GlobalMouseMoveEvent {
	x: number;
	y: number;
	timestamp: number;
}

interface GlobalMouseButtonEvent {
	button: number;
	x: number;
	y: number;
	timestamp: number;
}

interface GlobalWheelEvent {
	rotation: number;
	direction: number;
	x: number;
	y: number;
	timestamp: number;
}

interface GlobalGamepadState {
	axes: number[];
	buttons: GamepadButton[];
	timestamp: number;
	connected: boolean;
}

declare global {
	interface Window {
		electronAPI?: {
			onGlobalKeyDown: (callback: (data: GlobalKeyEvent) => void) => void;
			onGlobalKeyUp: (callback: (data: GlobalKeyEvent) => void) => void;
			onGlobalMouseMove: (callback: (data: GlobalMouseMoveEvent) => void) => void;
			onGlobalMouseDown: (callback: (data: GlobalMouseButtonEvent) => void) => void;
			onGlobalMouseUp: (callback: (data: GlobalMouseButtonEvent) => void) => void;
			onGlobalWheel: (callback: (data: GlobalWheelEvent) => void) => void;
			onGlobalGamepadState: (callback: (state: GlobalGamepadState) => void) => void;
			isAppInReadonlyClickthroughMode: () => boolean;
			hasGlobalInput: () => boolean;
		};
	}
}

// uiohook keycode to KeyboardEvent.code mapping
const UIOHOOK_TO_KEYCODE: Record<number, string> = {
	// Letters
	30: 'KeyA', 48: 'KeyB', 46: 'KeyC', 32: 'KeyD', 18: 'KeyE',
	33: 'KeyF', 34: 'KeyG', 35: 'KeyH', 23: 'KeyI', 36: 'KeyJ',
	37: 'KeyK', 38: 'KeyL', 50: 'KeyM', 49: 'KeyN', 24: 'KeyO',
	25: 'KeyP', 16: 'KeyQ', 19: 'KeyR', 31: 'KeyS', 20: 'KeyT',
	22: 'KeyU', 47: 'KeyV', 17: 'KeyW', 45: 'KeyX', 21: 'KeyY',
	44: 'KeyZ',
	// Numbers
	2: 'Digit1', 3: 'Digit2', 4: 'Digit3', 5: 'Digit4', 6: 'Digit5',
	7: 'Digit6', 8: 'Digit7', 9: 'Digit8', 10: 'Digit9', 11: 'Digit0',
	// Special keys
	57: 'Space', 28: 'Enter', 1: 'Escape', 14: 'Backspace',
	15: 'Tab', 42: 'ShiftLeft', 54: 'ShiftRight',
	29: 'ControlLeft', 97: 'ControlRight',
	56: 'AltLeft', 100: 'AltRight',
	// Arrow keys (uiohook scan codes)
	103: 'ArrowUp', 108: 'ArrowDown', 105: 'ArrowLeft', 106: 'ArrowRight',
	// Arrow keys (alternative VC_* codes - 0xE048, 0xE050, 0xE04B, 0xE04D)
	57416: 'ArrowUp', 57424: 'ArrowDown', 57419: 'ArrowLeft', 57421: 'ArrowRight'
};

// SDL gamepad state from main process (sdl2-gamecontroller)
// sdl2-gamecontroller runs SDL_PumpEvents() in separate thread
// This works with Electron's event loop and provides unfocused input
let sdlGamepadState: Gamepad | null = null;
let bridgesInitialized = false;

/**
 * Merge native browser gamepads with SDL gamepads (additive pattern)
 * Council-approved architecture: Never override native APIs, always merge
 *
 * Benefits:
 * - Both native and SDL gamepads work simultaneously
 * - If SDL breaks, native still works
 * - If native breaks, SDL still works
 * - No monkey-patching (clean)
 */
export function getMergedGamepads(): (Gamepad | null)[] {
	// Always start with native gamepads (never block native API)
	const native = navigator.getGamepads();
	const merged = Array.from(native);

	// Add SDL gamepad to index 0 if available and connected
	if (sdlGamepadState && sdlGamepadState.connected) {
		// SDL takes priority at index 0 (most games expect gamepad at index 0)
		merged[0] = sdlGamepadState;
	}

	return merged;
}

// Initialize electron API bridges
export function initializeElectronBridges(): void {
	if (!window.electronAPI) {
		return; // Not running in Electron
	}

	// Guard against double initialization
	if (bridgesInitialized) {
		console.warn('[ElectronBridge] Already initialized, skipping');
		return;
	}
	bridgesInitialized = true;

	// Bridge uiohook events to synthetic DOM KeyboardEvents
	window.electronAPI.onGlobalKeyDown((data: { keycode: number }) => {
		const code = UIOHOOK_TO_KEYCODE[data.keycode];
		if (code) {
			document.dispatchEvent(new KeyboardEvent('keydown', {
				code: code,
				bubbles: true,
				cancelable: true
			}));
		}
	});

	window.electronAPI.onGlobalKeyUp((data: { keycode: number }) => {
		const code = UIOHOOK_TO_KEYCODE[data.keycode];
		if (code) {
			document.dispatchEvent(new KeyboardEvent('keyup', {
				code: code,
				bubbles: true,
				cancelable: true
			}));
		}
	});

	// Bridge SDL gamepad events to navigator.getGamepads()
	window.electronAPI.onGlobalGamepadState((state: {
		axes: number[];
		buttons: GamepadButton[];
		connected: boolean;
		timestamp: number;
	}) => {
		// Store state with proper Gamepad interface properties
		sdlGamepadState = {
			axes: state.axes,
			buttons: state.buttons,
			connected: state.connected,
			timestamp: state.timestamp,
			id: 'SDL2 Gamepad (sdl2-gamecontroller)',
			index: 0,
			mapping: 'standard'
		} as unknown as Gamepad;
	});

	// Bridge uiohook mouse events to mouse state object
	window.electronAPI.onGlobalMouseDown((data: { button: number }) => {
		// Convert uiohook button values (1-5) to standard values (0-4)
		// uiohook: 1=Left, 2=Right, 3=Middle, 4=Back, 5=Forward
		// standard: 0=Left, 1=Middle, 2=Right, 3=Back, 4=Forward
		const buttonMap: Record<number, number> = { 1: 0, 3: 1, 2: 2, 4: 3, 5: 4 };
		const button = buttonMap[data.button];

		if (button !== undefined && window.mouse && window.mouse.buttons) {
			if (window.mouse.buttons[button] === false) {
				window.mouse.buttons[button] = true;
				window.mouse.clicks[button] = true;
			}
		}
	});

	window.electronAPI.onGlobalMouseUp((data: { button: number }) => {
		const buttonMap: Record<number, number> = { 1: 0, 3: 1, 2: 2, 4: 3, 5: 4 };
		const button = buttonMap[data.button];

		if (button !== undefined && window.mouse && window.mouse.buttons) {
			if (window.mouse.buttons[button] === true) {
				window.mouse.buttons[button] = false;
			}
		}
	});

	window.electronAPI.onGlobalMouseMove((data: { x: number; y: number }) => {
		// Update position (for future velocity tracking)
		if (window.mouse) {
			window.mouse.x = data.x;
			window.mouse.y = data.y;
		}
	});

	window.electronAPI.onGlobalWheel((data: { rotation: number }) => {
		// Update wheel delta (negate to match DOM WheelEvent.deltaY convention)
		if (window.mouse && window.mouse.wheelDelta) {
			// DOM convention: negative = scroll up, positive = scroll down
			// uiohook rotation: positive = scroll down, negative = scroll up (verified)
			window.mouse.wheelDelta.y = -data.rotation;
		}
		// Set single-frame wheel events (match DOM convention)
		if (window.mouse && window.mouse.wheelEvents) {
			if (data.rotation < 0) {
				window.mouse.wheelEvents.up = true;
			} else if (data.rotation > 0) {
				window.mouse.wheelEvents.down = true;
			}
		}
	});
}

// Note: Function is called explicitly from default.ts to ensure Vite doesn't tree-shake it
// Do NOT call here to avoid double initialization
