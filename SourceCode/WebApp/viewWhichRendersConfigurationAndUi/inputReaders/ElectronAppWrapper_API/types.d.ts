/**
 * Type definitions for Electron API exposed via contextBridge
 * Must match the types defined in DesktopWrappedWebapp/preload.ts
 */

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

export {};
