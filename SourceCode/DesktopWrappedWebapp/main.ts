import { app, BrowserWindow, ipcMain, IpcMainEvent, screen, session } from 'electron';
import * as path from 'path';
import * as fs from 'fs';

const APP_TITLE = 'A Real Web-based Input Overlay';

// Dev mode: Load from Vite dev server (npm run dev:webapp)
// Prod mode: Load from Vite preview server (npm run serve)
const isDev = process.argv.includes('--dev');
const VITE_DEV_SERVER_URL = 'http://localhost:5173';
const VITE_PREVIEW_SERVER_URL = 'http://localhost:4173';

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

let uIOhook: UIOHook | null = null;
let mainWindow: BrowserWindow | null = null;
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

// SDL removed: Chromium's Web Gamepad API works in Electron without native bindings
// See commit message for detailed explanation of why SDL is unnecessary

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

	// Gamepad support: Chromium's Web Gamepad API is used (no native SDL needed)
	console.log('[Main] Gamepad support: Using Web Gamepad API (navigator.getGamepads)');
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
