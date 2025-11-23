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
			onGamepadStateUpdate: (callback: (data: { index: number; state: any }) => void) => void;
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

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * DESKTOP INPUT SOURCES - SDL & uiohook IPC Bridges
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * This module handles Electron-specific input sources:
 * - SDL gamepads (via IPC from main process, event-driven)
 * - uiohook global keyboard/mouse (via IPC, dispatches synthetic DOM events)
 *
 * Exported for use by inputReaders/index.ts unified interface.
 * The webapp should NEVER import from this module directly.
 */

/**
 * SDL Gamepad Cache (Event-Driven Updates)
 *
 * Updated by IPC events from main process SDL controller subsystem.
 * Read by inputReaders/index.ts to merge with DOM gamepads.
 *
 * Format: Sparse array [0-3] with Gamepad-compatible objects
 */
export const sdlGamepadCache: (any | null)[] = [null, null, null, null];

let bridgesInitialized = false;

/**
 * Initialize Electron IPC Bridges
 *
 * Sets up listeners for:
 * - SDL gamepad state updates (event-driven cache)
 * - uiohook keyboard events (synthetic DOM events)
 * - uiohook mouse events (synthetic DOM events + state updates)
 *
 * Called automatically by inputReaders/index.ts when module loads.
 * Safe to call multiple times (idempotent).
 */
export function initializeElectronBridges(): void {
	if (!window.electronAPI) {
		return; // Not running in Electron
	}

	// Guard against double initialization
	if (bridgesInitialized) {
		return;
	}
	bridgesInitialized = true;

	console.log('[ElectronBridge] Initializing IPC bridges for keyboard, mouse, and gamepad...');

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

	// Bridge SDL gamepad events to cache (event-driven architecture)
	let rendererIpcCount = 0;
	window.electronAPI.onGamepadStateUpdate((data: { index: number; state: any }) => {
		const { index, state } = data;
		rendererIpcCount++;

		// Log first 5 updates and then every 60th
		if (rendererIpcCount <= 5 || rendererIpcCount % 60 === 0) {
			console.log(`[Renderer IPC #${rendererIpcCount}] Controller ${index}:`, {
				axes: state.axes?.map((a: number) => a.toFixed(3)),
				connected: state.connected
			});
		}

		if (index >= 0 && index < 4) {
			if (state.connected) {
				// Update cache with Gamepad-compatible object
				sdlGamepadCache[index] = {
					axes: state.axes,
					buttons: state.buttons,
					connected: state.connected,
					timestamp: state.timestamp,
					id: state.id || `SDL2 Gamepad ${index}`,
					index,
					mapping: state.mapping || 'standard'
				} as unknown as Gamepad;
			} else {
				// Controller disconnected
				sdlGamepadCache[index] = null;
			}
		}
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

// Auto-initialize when module loads (if running in Electron)
initializeElectronBridges();
