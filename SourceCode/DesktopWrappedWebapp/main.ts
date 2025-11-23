import { app, BrowserWindow, ipcMain, IpcMainEvent, screen, session } from 'electron';
import * as path from 'path';
import * as fs from 'fs';

const APP_TITLE = 'A Real Web-based Input Overlay';

// Dev mode: Load from Vite dev server (npm run dev:webapp)
// Prod mode: Load from Vite preview server (npm run serve)
const isDev = process.argv.includes('--dev');
const VITE_DEV_SERVER_URL = 'http://localhost:5173';
const VITE_PREVIEW_SERVER_URL = 'http://localhost:4173';

process.env['SDL_JOYSTICK_ALLOW_BACKGROUND_EVENTS'] = '1';

if (process.platform === 'linux') {
	app.commandLine.appendSwitch('gtk-version', '3');
}

let isReadonly = process.argv.includes('--in-clickthrough-readonly-mode');
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
	closed: boolean;
	on(event: string, callback: (eventType: string) => void): void;
	close(): void;
	device?: SDLDevice;
	name?: string;
}

interface SDLDevice {
	name: string;
}

interface SDL {
	controller: {
		devices: SDLDevice[];
		openDevice(device: SDLDevice): SDLController;
		on(event: 'deviceAdd', callback: (device: SDLDevice) => void): void;
		on(event: 'deviceRemove', callback: (device: SDLDevice) => void): void;
	};
}

let uIOhook: UIOHook | null = null;
let mainWindow: BrowserWindow | null = null;
let gamepadPollInterval: NodeJS.Timeout | null = null;
let keepOnTopInterval: NodeJS.Timeout | null = null;

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

// SDL Controller Management (Event-Driven Architecture)
let sdl: SDL | null = null;
const controllerMap = new Map<number, { instance: any; index: number; device: SDLDevice }>();

// Batching state for IPC optimization (coalesce events within same tick)
const pendingUpdates = new Map<number, any>();
let flushScheduled = false;

try {
	sdl = require('@kmamal/sdl') as SDL;
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

// IPC handler for runtime mode toggle (from canvas menu button)
ipcMain.on('toggle-readonly-mode', (_event: IpcMainEvent) => {
	console.log('[Main] Toggling to readonly clickthrough mode');
	isReadonly = true;

	if (mainWindow) {
		mainWindow.setIgnoreMouseEvents(true);
		console.log('[Main] Clickthrough enabled - use Task Manager to close app');
	}
});

console.log('[Main] Starting overlay in interactive mode...');
console.log('[Main] Readonly mode:', isReadonly);
console.log('[Main] Preload script path:', path.join(__dirname, 'preload.js'));

// Helper: Find available controller index (0-3) with recycling
function getAvailableIndex(): number | null {
	const usedIndices = new Set(Array.from(controllerMap.values()).map(e => e.index));
	for (let i = 0; i < 4; i++) {
		if (!usedIndices.has(i)) return i;
	}
	return null; // All 4 slots occupied
}

// Helper: Read SDL controller state into Gamepad-compatible format
function readSDLState(instance: any, index: number) {
	return {
		axes: [
			instance.axes.leftStickX ?? 0,
			instance.axes.leftStickY ?? 0,
			instance.axes.rightStickX ?? 0,
			instance.axes.rightStickY ?? 0
		],
		buttons: [
			{ pressed: instance.buttons.a ?? false, value: instance.buttons.a ? 1 : 0 },
			{ pressed: instance.buttons.b ?? false, value: instance.buttons.b ? 1 : 0 },
			{ pressed: instance.buttons.x ?? false, value: instance.buttons.x ? 1 : 0 },
			{ pressed: instance.buttons.y ?? false, value: instance.buttons.y ? 1 : 0 },
			{ pressed: instance.buttons.leftShoulder ?? false, value: instance.buttons.leftShoulder ? 1 : 0 },
			{ pressed: instance.buttons.rightShoulder ?? false, value: instance.buttons.rightShoulder ? 1 : 0 },
			{ pressed: false, value: instance.axes.leftTrigger ?? 0 },
			{ pressed: false, value: instance.axes.rightTrigger ?? 0 },
			{ pressed: instance.buttons.back ?? false, value: instance.buttons.back ? 1 : 0 },
			{ pressed: instance.buttons.start ?? false, value: instance.buttons.start ? 1 : 0 },
			{ pressed: instance.buttons.leftStick ?? false, value: instance.buttons.leftStick ? 1 : 0 },
			{ pressed: instance.buttons.rightStick ?? false, value: instance.buttons.rightStick ? 1 : 0 },
			{ pressed: instance.buttons.dpadUp ?? false, value: instance.buttons.dpadUp ? 1 : 0 },
			{ pressed: instance.buttons.dpadDown ?? false, value: instance.buttons.dpadDown ? 1 : 0 },
			{ pressed: instance.buttons.dpadLeft ?? false, value: instance.buttons.dpadLeft ? 1 : 0 },
			{ pressed: instance.buttons.dpadRight ?? false, value: instance.buttons.dpadRight ? 1 : 0 },
			{ pressed: instance.buttons.guide ?? false, value: instance.buttons.guide ? 1 : 0 }
		],
		timestamp: Date.now(),
		connected: true,
		id: `SDL2 Gamepad (${instance.device?.name ?? 'Unknown'})`,
		index,
		mapping: 'standard'
	};
}

// Helper: Safe IPC send (checks window lifecycle)
function safeSend(channel: string, data: any): void {
	try {
		if (mainWindow && !mainWindow.isDestroyed()) {
			mainWindow.webContents.send(channel, data);
		}
	} catch (err) {
		console.error(`[SDL IPC] Failed to send ${channel}:`, err);
	}
}

// Batched IPC sender (coalesces updates within same event loop tick)
let ipcBatchCount = 0;
function scheduleUpdate(index: number, state: any): void {
	pendingUpdates.set(index, state);

	if (!flushScheduled) {
		flushScheduled = true;
		setImmediate(() => {
			ipcBatchCount++;
			const updateCount = pendingUpdates.size;

			if (ipcBatchCount <= 5 || ipcBatchCount % 60 === 0) {
				console.log(`[IPC Batch #${ipcBatchCount}] Sending ${updateCount} controller update(s)`);
			}

			pendingUpdates.forEach((st, idx) => {
				safeSend('gamepad-state-update', { index: idx, state: st });
			});
			pendingUpdates.clear();
			flushScheduled = false;
		});
	}
}

// Open and configure a controller with event-driven architecture
function openController(device: SDLDevice): void {
	if (!sdl) return;

	// Check if already open
	for (const entry of controllerMap.values()) {
		if (entry.device === device) {
			console.log(`[SDL] Device already open, skipping:`, device.name);
			return;
		}
	}

	const index = getAvailableIndex();
	if (index === null) {
		console.warn(`[SDL] All controller slots full, cannot open:`, device.name);
		return;
	}

	try {
		const instance = sdl.controller.openDevice(device);
		const deviceId = controllerMap.size; // Use map size as unique ID
		controllerMap.set(deviceId, { instance, index, device });

		console.log(`[SDL] Opened controller at index ${index}:`, device.name);

		// CRITICAL: Subscribe to specific SDL events
		// Event types: 'axisMotion', 'buttonDown', 'buttonUp', 'close'
		let eventCount = 0;

		const handleEvent = (eventType: string) => {
			eventCount++;

			// Log first 10 events and then every 120th event
			if (eventCount <= 10 || eventCount % 120 === 0) {
				console.log(`[SDL Event #${eventCount}] Type: ${eventType}, Axes:`, {
					leftX: instance.axes.leftStickX?.toFixed(3),
					leftY: instance.axes.leftStickY?.toFixed(3),
					rightX: instance.axes.rightStickX?.toFixed(3),
					rightY: instance.axes.rightStickY?.toFixed(3)
				});
			}

			// Read current state (now populated thanks to event pump)
			const state = readSDLState(instance, index);
			scheduleUpdate(index, state);
		};

		// Register for all event types explicitly
		instance.on('axisMotion', () => handleEvent('axisMotion'));
		instance.on('buttonDown', () => handleEvent('buttonDown'));
		instance.on('buttonUp', () => handleEvent('buttonUp'));

		// Handle controller disconnection
		instance.on('close', () => {
			console.log(`[SDL] Controller ${index} closed`);
			safeSend('gamepad-state-update', {
				index,
				state: { connected: false, axes: [], buttons: [], timestamp: Date.now() }
			});
			controllerMap.delete(deviceId);
		});

		// Send initial state
		console.log(`[SDL] Sending initial state for controller ${index}`);
		const initialState = readSDLState(instance, index);
		console.log(`[SDL] Initial axes:`, initialState.axes);
		scheduleUpdate(index, initialState);

	} catch (err) {
		console.error(`[SDL] Failed to open device:`, device.name, err);
	}
}

// Close a controller by device reference
function closeController(device: SDLDevice): void {
	for (const [deviceId, entry] of controllerMap.entries()) {
		if (entry.device === device) {
			try {
				entry.instance.close(); // Triggers 'close' event
			} catch (err) {
				console.error(`[SDL] Error closing device:`, err);
				controllerMap.delete(deviceId); // Clean up anyway
			}
			return;
		}
	}
}

async function createWindow(): Promise<BrowserWindow> {
	// Get primary display dimensions
	const primaryDisplay = screen.getPrimaryDisplay();
	const { width, height } = primaryDisplay.workAreaSize;

	const win = new BrowserWindow({
		width: width,
		height: height,
		transparent: true,
		frame: enableFrame,
		alwaysOnTop: true,
		skipTaskbar: false,
		backgroundColor: '#00000000',
		title: APP_TITLE,
		webPreferences: {
			nodeIntegration: false,
			contextIsolation: true,
			preload: path.join(__dirname, 'preload.js'),
			autoplayPolicy: 'no-user-gesture-required',
			webSecurity: true
		}
	});

	win.setAlwaysOnTop(true, 'screen-saver', 1);

	// URL will be loaded in app.whenReady() after server starts

	if (isReadonly) {
		win.setIgnoreMouseEvents(true);
		console.log('[Main] Readonly mode - click-through enabled, UI editing disabled');

		keepOnTopInterval = setInterval(() => {
			if (win.isDestroyed()) return;
			win.moveTop();
		}, 1000);
	} else {
		console.log('[Main] Interactive mode - can drag and edit objects');
	}

	// Clean up on window close
	win.on('closed', () => {
		console.log('[Main] Window closed - cleaning up...');

		if (keepOnTopInterval) {
			clearInterval(keepOnTopInterval);
			keepOnTopInterval = null;
		}

		if (gamepadPollInterval) {
			clearInterval(gamepadPollInterval);
			gamepadPollInterval = null;
		}

		if (uIOhook) {
			console.log('[Main] Stopping global input hooks...');
			uIOhook.stop();
		}

		mainWindow = null;
	});

	if (enableDevTools) {
		console.log('[Main] DevTools enabled (transparency will break)');
		win.webContents.openDevTools();
	}

	return win;
}

function startInputHooks(): void {
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

	if (sdl?.controller) {
		console.log('[SDL] Initializing event-driven gamepad support...');

		try {
			// Open all currently connected devices
			const devices = sdl.controller.devices;
			console.log(`[SDL] Found ${devices.length} controller(s)`);

			devices.forEach((device: SDLDevice) => {
				openController(device);
			});

			// Hot-plug support: listen for device add/remove events
			sdl.controller.on('deviceAdd', (device: SDLDevice) => {
				console.log('[SDL] Device added:', device.name);
				openController(device);
			});

			sdl.controller.on('deviceRemove', (device: SDLDevice) => {
				console.log('[SDL] Device removed:', device.name);
				closeController(device);
			});

			console.log('[SDL] ✓ Event-driven gamepad support initialized');
		} catch (error) {
			console.error('[SDL] Failed to initialize gamepad support:', error);
		}
	}
}

app.whenReady().then(async () => {
	session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
		const responseHeaders: Record<string, string | string[]> = details.responseHeaders || {};
		for (const header in responseHeaders) {
			if (header.toLowerCase() === 'x-frame-options') {
				delete responseHeaders[header];
			}
		}
		callback({ cancel: false, responseHeaders });
	});

	const appURL = isDev ? VITE_DEV_SERVER_URL : VITE_PREVIEW_SERVER_URL;
	console.log(`[Main] Loading from ${appURL}`);
	if (isDev) {
		console.log('[Main] Dev mode - ensure "npm run dev:webapp" is running');
	} else {
		console.log('[Main] Prod mode - ensure "npm run serve" is running');
	}

	mainWindow = await createWindow();
	await mainWindow.loadURL(appURL);
	startInputHooks();

	app.on('activate', async () => {
		if (BrowserWindow.getAllWindows().length === 0) {
			mainWindow = await createWindow();
			await mainWindow.loadURL(appURL);
			startInputHooks();
		}
	});
});

app.on('window-all-closed', () => {
	// Cleanup already done in window 'closed' handler
	if (process.platform !== 'darwin') {
		app.quit();
	}
});
