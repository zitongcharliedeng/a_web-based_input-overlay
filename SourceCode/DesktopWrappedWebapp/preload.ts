import { contextBridge, ipcRenderer } from 'electron';

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

interface GamepadButton {
	pressed: boolean;
	value: number;
}

interface GlobalGamepadState {
	axes: number[];
	buttons: GamepadButton[];
	timestamp: number;
	connected: boolean;
}

declare global {
	interface Window {
		electronAPI: {
			onGlobalKeyDown: (callback: (data: GlobalKeyEvent) => void) => void;
			onGlobalKeyUp: (callback: (data: GlobalKeyEvent) => void) => void;
			onGlobalMouseMove: (callback: (data: GlobalMouseMoveEvent) => void) => void;
			onGlobalMouseDown: (callback: (data: GlobalMouseButtonEvent) => void) => void;
			onGlobalMouseUp: (callback: (data: GlobalMouseButtonEvent) => void) => void;
			onGlobalWheel: (callback: (data: GlobalWheelEvent) => void) => void;
			onGlobalGamepadState: (callback: (state: GlobalGamepadState) => void) => void;
			isReadonly: () => boolean;
			hasGlobalInput: () => boolean;
		};
	}
}

console.log('[Preload] Loading preload script...');

contextBridge.exposeInMainWorld('electronAPI', {
	onGlobalKeyDown: (callback: (data: GlobalKeyEvent) => void): void => {
		ipcRenderer.on('global-keydown', (_event, data: GlobalKeyEvent) => callback(data));
	},
	onGlobalKeyUp: (callback: (data: GlobalKeyEvent) => void): void => {
		ipcRenderer.on('global-keyup', (_event, data: GlobalKeyEvent) => callback(data));
	},

	onGlobalMouseMove: (callback: (data: GlobalMouseMoveEvent) => void): void => {
		ipcRenderer.on('global-mousemove', (_event, data: GlobalMouseMoveEvent) => callback(data));
	},
	onGlobalMouseDown: (callback: (data: GlobalMouseButtonEvent) => void): void => {
		ipcRenderer.on('global-mousedown', (_event, data: GlobalMouseButtonEvent) => callback(data));
	},
	onGlobalMouseUp: (callback: (data: GlobalMouseButtonEvent) => void): void => {
		ipcRenderer.on('global-mouseup', (_event, data: GlobalMouseButtonEvent) => callback(data));
	},

	onGlobalWheel: (callback: (data: GlobalWheelEvent) => void): void => {
		ipcRenderer.on('global-wheel', (_event, data: GlobalWheelEvent) => callback(data));
	},

	onGlobalGamepadState: (callback: (state: GlobalGamepadState) => void): void => {
		ipcRenderer.on('global-gamepad-state', (_event, state: GlobalGamepadState) => callback(state));
	},

	isReadonly: (): boolean => {
		return ipcRenderer.sendSync('get-readonly-state') as boolean;
	},

	hasGlobalInput: (): boolean => {
		return ipcRenderer.sendSync('has-global-input') as boolean;
	}
});

console.log('[Preload] Preload script loaded successfully!');
console.log('[Preload] electronAPI exposed to window object');
