/**
 * Electron IPC Bridge - SDL gamepad + uiohook keyboard/mouse
 * Only runs when window.electronAPI is available (Electron environment).
 *
 * TODO: Hotplug origin bug - joystick position at replug becomes new origin
 *   1. Holding joystick during hotplug shifts the interpreted origin to that position
 *   2. Full circle motion renders as rounded triangle instead of circle
 *   3. Affects both PlanarInputIndicator and AnalogWASD components equally
 *   Root cause unknown - other apps don't have this issue with same controller.
 *   Not a calibration issue (raw SDL data should already be centered).
 */

interface SDLGamepadState {
	axes: number[];
	buttons: { pressed: boolean; touched: boolean; value: number }[];
	connected: boolean;
	timestamp: number;
	id?: string;
	mapping?: string;
}

declare global {
	interface Window {
		electronAPI?: {
			onGlobalKeyDown: (cb: (data: { keycode: number }) => void) => void;
			onGlobalKeyUp: (cb: (data: { keycode: number }) => void) => void;
			onGlobalMouseMove: (cb: (data: { x: number; y: number }) => void) => void;
			onGlobalMouseDown: (cb: (data: { button: number }) => void) => void;
			onGlobalMouseUp: (cb: (data: { button: number }) => void) => void;
			onGlobalWheel: (cb: (data: { rotation: number }) => void) => void;
			onSDLGamepadState: (cb: (data: { index: number; state: SDLGamepadState }) => void) => void;
			onGamepadStateUpdate: (cb: (data: { index: number; state: SDLGamepadState }) => void) => void;
			isAppInReadonlyClickthroughMode: () => boolean;
			hasGlobalInput: () => boolean;
		};
		mouse?: {
			x: number;
			y: number;
			buttons: Record<number, boolean>;
			clicks: Record<number, boolean>;
			wheelDelta: { x: number; y: number };
			wheelEvents: { up: boolean; down: boolean };
		};
	}
}

const UIOHOOK_TO_CODE: Record<number, string> = {
	30: 'KeyA', 48: 'KeyB', 46: 'KeyC', 32: 'KeyD', 18: 'KeyE', 33: 'KeyF', 34: 'KeyG', 35: 'KeyH',
	23: 'KeyI', 36: 'KeyJ', 37: 'KeyK', 38: 'KeyL', 50: 'KeyM', 49: 'KeyN', 24: 'KeyO', 25: 'KeyP',
	16: 'KeyQ', 19: 'KeyR', 31: 'KeyS', 20: 'KeyT', 22: 'KeyU', 47: 'KeyV', 17: 'KeyW', 45: 'KeyX',
	21: 'KeyY', 44: 'KeyZ', 2: 'Digit1', 3: 'Digit2', 4: 'Digit3', 5: 'Digit4', 6: 'Digit5',
	7: 'Digit6', 8: 'Digit7', 9: 'Digit8', 10: 'Digit9', 11: 'Digit0', 57: 'Space', 28: 'Enter',
	1: 'Escape', 14: 'Backspace', 15: 'Tab', 42: 'ShiftLeft', 54: 'ShiftRight', 29: 'ControlLeft',
	97: 'ControlRight', 56: 'AltLeft', 100: 'AltRight', 103: 'ArrowUp', 108: 'ArrowDown',
	105: 'ArrowLeft', 106: 'ArrowRight', 57416: 'ArrowUp', 57424: 'ArrowDown',
	57419: 'ArrowLeft', 57421: 'ArrowRight'
};

const UIOHOOK_BUTTON_MAP: Record<number, number> = { 1: 0, 3: 1, 2: 2, 4: 3, 5: 4 };

export const sdlGamepadCache: Record<number, Gamepad | null> = {};

let initialized = false;

function updateCache(index: number, state: SDLGamepadState): void {
	if (index < 0) return;
	if (!state.connected) {
		sdlGamepadCache[index] = null;
		return;
	}
	sdlGamepadCache[index] = {
		axes: state.axes?.map(Number) ?? [],
		buttons: state.buttons?.map(b => ({
			pressed: Boolean(b.pressed),
			touched: Boolean(b.touched),
			value: Number(b.value)
		})) ?? [],
		connected: true,
		timestamp: state.timestamp,
		id: state.id ?? `SDL2 Gamepad ${index}`,
		index,
		mapping: state.mapping ?? 'standard',
		hapticActuators: [],
		vibrationActuator: null
	} as unknown as Gamepad;
}

export function initializeElectronBridges(): void {
	if (!window.electronAPI || initialized) return;
	initialized = true;

	const api = window.electronAPI;

	// Keyboard: dispatch synthetic DOM events
	api.onGlobalKeyDown(({ keycode }) => {
		const code = UIOHOOK_TO_CODE[keycode];
		if (code) document.dispatchEvent(new KeyboardEvent('keydown', { code, bubbles: true }));
	});
	api.onGlobalKeyUp(({ keycode }) => {
		const code = UIOHOOK_TO_CODE[keycode];
		if (code) document.dispatchEvent(new KeyboardEvent('keyup', { code, bubbles: true }));
	});

	// Gamepad: update cache
	api.onSDLGamepadState(({ index, state }) => updateCache(index, state));
	api.onGamepadStateUpdate(({ index, state }) => updateCache(index, state));

	// Mouse: update window.mouse state
	api.onGlobalMouseDown(({ button }) => {
		const btn = UIOHOOK_BUTTON_MAP[button];
		if (btn !== undefined && window.mouse?.buttons[btn] === false) {
			window.mouse.buttons[btn] = true;
			window.mouse.clicks[btn] = true;
		}
	});
	api.onGlobalMouseUp(({ button }) => {
		const btn = UIOHOOK_BUTTON_MAP[button];
		if (btn !== undefined && window.mouse?.buttons[btn] === true) {
			window.mouse.buttons[btn] = false;
		}
	});
	api.onGlobalMouseMove(({ x, y }) => {
		if (window.mouse) { window.mouse.x = x; window.mouse.y = y; }
	});
	api.onGlobalWheel(({ rotation }) => {
		if (window.mouse?.wheelDelta) window.mouse.wheelDelta.y = -rotation;
		if (window.mouse?.wheelEvents) {
			if (rotation < 0) window.mouse.wheelEvents.up = true;
			else if (rotation > 0) window.mouse.wheelEvents.down = true;
		}
	});
}

initializeElectronBridges();
