import { app, BrowserWindow, ipcMain, IpcMainEvent } from 'electron';
import * as path from 'path';

process.env.SDL_JOYSTICK_ALLOW_BACKGROUND_EVENTS = '1';

if (process.platform === 'linux') {
	app.commandLine.appendSwitch('gtk-version', '3');
}

const isReadonly = process.argv.includes('--in-clickthrough-readonly-mode');
const enableFrame = process.argv.includes('--with-window-frame');
const enableDevTools = process.argv.includes('--with-dev-console');
let globalInputAvailable = false;

interface UIOHookKeyEvent {
	keycode: number;
	rawcode: number;
}

interface UIOHookMouseButtonEvent {
	button: number;
	x: number;
	y: number;
}

interface UIOHookMouseMoveEvent {
	x: number;
	y: number;
}

interface UIOHookWheelEvent {
	rotation: number;
	direction: number;
	x: number;
	y: number;
}

interface UIOHook {
	on(event: 'keydown', callback: (event: UIOHookKeyEvent) => void): void;
	on(event: 'keyup', callback: (event: UIOHookKeyEvent) => void): void;
	on(event: 'mousedown', callback: (event: UIOHookMouseButtonEvent) => void): void;
	on(event: 'mouseup', callback: (event: UIOHookMouseButtonEvent) => void): void;
	on(event: 'mousemove', callback: (event: UIOHookMouseMoveEvent) => void): void;
	on(event: 'wheel', callback: (event: UIOHookWheelEvent) => void): void;
	start(): void;
	stop(): void;
}

interface SDLAxes {
	leftStickX?: number;
	leftStickY?: number;
	rightStickX?: number;
	rightStickY?: number;
	leftTrigger?: number;
	rightTrigger?: number;
}

interface SDLButtons {
	a?: boolean;
	b?: boolean;
	x?: boolean;
	y?: boolean;
	leftShoulder?: boolean;
	rightShoulder?: boolean;
	back?: boolean;
	start?: boolean;
	leftStick?: boolean;
	rightStick?: boolean;
	dpadUp?: boolean;
	dpadDown?: boolean;
	dpadLeft?: boolean;
	dpadRight?: boolean;
	guide?: boolean;
}

interface SDLController {
	axes: SDLAxes;
	buttons: SDLButtons;
}

interface SDLDevice {
	name: string;
}

interface SDL {
	controller: {
		devices: SDLDevice[];
		openDevice(device: SDLDevice): SDLController;
	};
}

let uIOhook: UIOHook | null = null;
let mainWindow: BrowserWindow | null = null;

try {
	const uiohook = require('uiohook-napi');
	uIOhook = uiohook.uIOhook as UIOHook;
	globalInputAvailable = true;
	console.log('[Main] ✓ uiohook-napi loaded successfully');
} catch (error) {
	if (error instanceof Error) {
		console.log('[Main] ✗ uiohook-napi not available:', error.message);
	}
	console.log('[Main] Global input hooks disabled (will use DOM events only)');
}

let sdl: SDL | null = null;
let sdlController: SDLController | null = null;
let gamepadAvailable = false;

try {
	sdl = require('@kmamal/sdl') as SDL;
	gamepadAvailable = true;
	console.log('[Main] ✓ @kmamal/sdl loaded (bundled SDL2, cross-platform)');
} catch (error) {
	if (error instanceof Error) {
		console.log('[Main] ✗ @kmamal/sdl not available:', error.message);
	}
	console.log('[Main] Native gamepad polling disabled (will use Web Gamepad API only)');
}

ipcMain.on('get-readonly-state', (event: IpcMainEvent) => {
	event.returnValue = isReadonly;
});

ipcMain.on('has-global-input', (event: IpcMainEvent) => {
	event.returnValue = globalInputAvailable;
});

console.log('[Main] Starting overlay...');
console.log('[Main] Readonly mode:', isReadonly);
console.log('[Main] Preload script path:', path.join(__dirname, 'preload.js'));

function createWindow(): BrowserWindow {
	const width = 1600;
	const height = 600;

	const win = new BrowserWindow({
		width: width,
		height: height,
		transparent: true,
		frame: enableFrame,
		alwaysOnTop: true,
		skipTaskbar: false,
		backgroundColor: '#40404040',
		webPreferences: {
			nodeIntegration: false,
			contextIsolation: true,
			preload: path.join(__dirname, 'preload.js')
		}
	});

	win.setAlwaysOnTop(true, 'screen-saver', 1);

	win.loadFile(path.join(__dirname, '..', 'webApp', 'index.html'));

	if (isReadonly) {
		win.setIgnoreMouseEvents(true);
		console.log('[Main] Readonly mode - click-through enabled, UI editing disabled');

		const keepOnTop = setInterval(() => {
			if (!win.isDestroyed()) {
				win.moveTop();
			}
		}, 1000);

		win.on('closed', () => {
			clearInterval(keepOnTop);
		});
	} else {
		console.log('[Main] Interactive mode - can drag and edit objects');
	}

	if (enableDevTools) {
		console.log('[Main] DevTools enabled (transparency will break)');
		win.webContents.openDevTools();
	}

	return win;
}

app.whenReady().then(() => {
	mainWindow = createWindow();

	if (uIOhook) {
		console.log('[Main] Starting global input hooks...');

		let keycode0Count = 0;

		uIOhook.on('keydown', (event: UIOHookKeyEvent) => {
			const data = {
				keycode: event.keycode,
				rawcode: event.rawcode,
				timestamp: Date.now()
			};

			if (data.keycode === 0) {
				keycode0Count++;
				if (keycode0Count === 1 || keycode0Count % 10 === 0) {
					console.log('[Main] Keycode 0 detected (possibly joystick?) - count:', keycode0Count);
				}
			} else {
				console.log('[Main] Global keydown:', data.keycode);
			}

			mainWindow?.webContents.send('global-keydown', data);
		});

		uIOhook.on('keyup', (event: UIOHookKeyEvent) => {
			const data = {
				keycode: event.keycode,
				rawcode: event.rawcode,
				timestamp: Date.now()
			};

			if (data.keycode !== 0) {
				console.log('[Main] Global keyup:', data.keycode);
			}

			mainWindow?.webContents.send('global-keyup', data);
		});

		uIOhook.on('mousedown', (event: UIOHookMouseButtonEvent) => {
			const data = {
				button: event.button,
				x: event.x,
				y: event.y,
				timestamp: Date.now()
			};
			console.log('[Main] Global mousedown:', data.button);
			mainWindow?.webContents.send('global-mousedown', data);
		});

		uIOhook.on('mouseup', (event: UIOHookMouseButtonEvent) => {
			const data = {
				button: event.button,
				x: event.x,
				y: event.y,
				timestamp: Date.now()
			};
			console.log('[Main] Global mouseup:', data.button);
			mainWindow?.webContents.send('global-mouseup', data);
		});

		uIOhook.on('mousemove', (event: UIOHookMouseMoveEvent) => {
			const data = {
				x: event.x,
				y: event.y,
				timestamp: Date.now()
			};
			mainWindow?.webContents.send('global-mousemove', data);
		});

		uIOhook.on('wheel', (event: UIOHookWheelEvent) => {
			const data = {
				rotation: event.rotation,
				direction: event.direction,
				x: event.x,
				y: event.y,
				timestamp: Date.now()
			};
			console.log('[Main] Global wheel:', data.rotation, data.direction);
			mainWindow?.webContents.send('global-wheel', data);
		});

		uIOhook.start();
		console.log('[Main] ✓ Global input hooks started');
	}

	if (sdl) {
		console.log('[Main] Searching for SDL controllers...');

		const devices = sdl.controller.devices;
		if (devices.length > 0) {
			const device = devices[0];
			console.log('[Main] Found controller:', device.name);

			try {
				sdlController = sdl.controller.openDevice(device);
				console.log('[Main] Controller opened successfully');

				const gamepadState = {
					axes: [0, 0, 0, 0],
					buttons: Array(17).fill(null).map(() => ({ pressed: false, value: 0 })),
					timestamp: Date.now(),
					connected: true
				};

				const pollInterval = setInterval(() => {
					if (!sdlController) {
						clearInterval(pollInterval);
						return;
					}

					const axes = sdlController.axes;
					gamepadState.axes[0] = axes.leftStickX ?? 0;
					gamepadState.axes[1] = axes.leftStickY ?? 0;
					gamepadState.axes[2] = axes.rightStickX ?? 0;
					gamepadState.axes[3] = axes.rightStickY ?? 0;

					const buttons = sdlController.buttons;
					gamepadState.buttons[0] = { pressed: buttons.a ?? false, value: buttons.a ? 1.0 : 0 };
					gamepadState.buttons[1] = { pressed: buttons.b ?? false, value: buttons.b ? 1.0 : 0 };
					gamepadState.buttons[2] = { pressed: buttons.x ?? false, value: buttons.x ? 1.0 : 0 };
					gamepadState.buttons[3] = { pressed: buttons.y ?? false, value: buttons.y ? 1.0 : 0 };
					gamepadState.buttons[4] = { pressed: buttons.leftShoulder ?? false, value: buttons.leftShoulder ? 1.0 : 0 };
					gamepadState.buttons[5] = { pressed: buttons.rightShoulder ?? false, value: buttons.rightShoulder ? 1.0 : 0 };
					gamepadState.buttons[6] = { pressed: (axes.leftTrigger ?? 0) > 0.1, value: Math.max(0, axes.leftTrigger ?? 0) };
					gamepadState.buttons[7] = { pressed: (axes.rightTrigger ?? 0) > 0.1, value: Math.max(0, axes.rightTrigger ?? 0) };
					gamepadState.buttons[8] = { pressed: buttons.back ?? false, value: buttons.back ? 1.0 : 0 };
					gamepadState.buttons[9] = { pressed: buttons.start ?? false, value: buttons.start ? 1.0 : 0 };
					gamepadState.buttons[10] = { pressed: buttons.leftStick ?? false, value: buttons.leftStick ? 1.0 : 0 };
					gamepadState.buttons[11] = { pressed: buttons.rightStick ?? false, value: buttons.rightStick ? 1.0 : 0 };
					gamepadState.buttons[12] = { pressed: buttons.dpadUp ?? false, value: buttons.dpadUp ? 1.0 : 0 };
					gamepadState.buttons[13] = { pressed: buttons.dpadDown ?? false, value: buttons.dpadDown ? 1.0 : 0 };
					gamepadState.buttons[14] = { pressed: buttons.dpadLeft ?? false, value: buttons.dpadLeft ? 1.0 : 0 };
					gamepadState.buttons[15] = { pressed: buttons.dpadRight ?? false, value: buttons.dpadRight ? 1.0 : 0 };
					gamepadState.buttons[16] = { pressed: buttons.guide ?? false, value: buttons.guide ? 1.0 : 0 };

					gamepadState.timestamp = Date.now();
					mainWindow?.webContents.send('global-gamepad-state', gamepadState);
				}, 16);

				console.log('[Main] ✓ SDL gamepad polling started (60fps via setInterval)');
			} catch (error) {
				if (error instanceof Error) {
					console.log('[Main] ✗ Failed to open controller:', error.message);
				}
			}
		} else {
			console.log('[Main] No controllers detected');
		}
	}

	app.on('activate', () => {
		if (BrowserWindow.getAllWindows().length === 0) {
			createWindow();
		}
	});
});

app.on('window-all-closed', () => {
	if (uIOhook) {
		console.log('[Main] Stopping global input hooks...');
		uIOhook.stop();
	}

	if (process.platform !== 'darwin') {
		app.quit();
	}
});
