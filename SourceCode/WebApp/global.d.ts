// Global type extensions for window object

import type { keyboard } from './viewWhichRendersConfigurationAndUi/inputReaders/keyboard';
import type { mouse } from './viewWhichRendersConfigurationAndUi/inputReaders/mouse';

declare global {
	interface Window {
		gamepads: (Gamepad | null)[] | null;
		keyboard: typeof keyboard;
		mouse: typeof mouse;
		_gamepadDebugLogged?: boolean;
	}
}

export {};
