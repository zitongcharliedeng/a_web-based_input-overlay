/**
 * Unified Input Interface - Single source of truth for ALL inputs
 * Combines: DOM Gamepad API + SDL gamepads (Electron) + uiohook (Electron)
 */

import { keyboard as webKeyboard } from './_web/keyboard';
import { mouse as webMouse } from './_web/mouse';
import { sdlGamepadCache } from './_desktop';

const originalGetGamepads = navigator.getGamepads.bind(navigator);

// Activate DOM Gamepad API (W3C spec requires event listeners for lazy init)
if (typeof window !== 'undefined') {
	window.addEventListener('gamepadconnected', () => {});
	window.addEventListener('gamepaddisconnected', () => {});
	originalGetGamepads();
}

export function getGamepads(): (Gamepad | null)[] {
	const domGamepads = Array.from(originalGetGamepads());
	const sdlIndices = Object.keys(sdlGamepadCache).map(Number);
	const maxSlot = Math.max(sdlIndices.length ? Math.max(...sdlIndices) : -1, domGamepads.length - 1);

	const result: (Gamepad | null)[] = [];
	for (let i = 0; i <= maxSlot; i++) {
		const sdl = sdlGamepadCache[i];
		const dom = domGamepads[i];

		if (sdl?.connected) {
			// Return snapshot to prevent race conditions from IPC mutations
			result[i] = {
				axes: [...sdl.axes],
				buttons: sdl.buttons.map(b => ({ pressed: b.pressed, touched: b.touched, value: b.value })),
				connected: true,
				timestamp: sdl.timestamp,
				id: sdl.id,
				index: sdl.index,
				mapping: sdl.mapping,
				hapticActuators: [],
				vibrationActuator: null
			} as unknown as Gamepad;
		} else if (dom?.connected) {
			result[i] = dom;
		} else {
			result[i] = null;
		}
	}
	return result;
}

export const keyboard = webKeyboard;
export const mouse = webMouse;
