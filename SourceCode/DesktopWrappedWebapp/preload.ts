import { contextBridge, ipcRenderer, type IpcRendererEvent } from 'electron';

// Spoof navigator.userAgent to look like Chrome (YouTube blocks Electron)
Object.defineProperty(navigator, 'userAgent', {
	get: () => 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
	configurable: true
});

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
			isAppInReadonlyClickthroughMode: () => boolean;
			hasGlobalInput: () => boolean;
			toggleReadonlyMode: () => void;
		};
	}
}

console.log('[Preload] Loading preload script...');

contextBridge.exposeInMainWorld('electronAPI', {
	onGlobalKeyDown: (callback: (data: GlobalKeyEvent) => void): void => {
		ipcRenderer.on('global-keydown', (_event: IpcRendererEvent, data: GlobalKeyEvent) => callback(data));
	},
	onGlobalKeyUp: (callback: (data: GlobalKeyEvent) => void): void => {
		ipcRenderer.on('global-keyup', (_event: IpcRendererEvent, data: GlobalKeyEvent) => callback(data));
	},

	onGlobalMouseMove: (callback: (data: GlobalMouseMoveEvent) => void): void => {
		ipcRenderer.on('global-mousemove', (_event: IpcRendererEvent, data: GlobalMouseMoveEvent) => callback(data));
	},
	onGlobalMouseDown: (callback: (data: GlobalMouseButtonEvent) => void): void => {
		ipcRenderer.on('global-mousedown', (_event: IpcRendererEvent, data: GlobalMouseButtonEvent) => callback(data));
	},
	onGlobalMouseUp: (callback: (data: GlobalMouseButtonEvent) => void): void => {
		ipcRenderer.on('global-mouseup', (_event: IpcRendererEvent, data: GlobalMouseButtonEvent) => callback(data));
	},

	onGlobalWheel: (callback: (data: GlobalWheelEvent) => void): void => {
		ipcRenderer.on('global-wheel', (_event: IpcRendererEvent, data: GlobalWheelEvent) => callback(data));
	},

	onGlobalGamepadState: (callback: (state: GlobalGamepadState) => void): void => {
		ipcRenderer.on('global-gamepad-state', (_event: IpcRendererEvent, state: GlobalGamepadState) => callback(state));
	},

	isAppInReadonlyClickthroughMode: (): boolean => {
		return ipcRenderer.sendSync('get-readonly-state') as boolean;
	},

	hasGlobalInput: (): boolean => {
		return ipcRenderer.sendSync('has-global-input') as boolean;
	},

	toggleReadonlyMode: (): void => {
		ipcRenderer.send('toggle-readonly-mode');
	}
});

console.log('[Preload] Preload script loaded successfully!');
console.log('[Preload] electronAPI exposed to window object');
