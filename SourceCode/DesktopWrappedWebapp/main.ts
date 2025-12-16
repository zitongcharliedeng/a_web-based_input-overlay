import { app, BrowserWindow, ipcMain, IpcMainEvent, screen, session } from 'electron';
import * as path from 'path';
import * as fs from 'fs';
import * as net from 'net';
import { spawn, ChildProcess } from 'child_process';

const APP_TITLE = 'A Real Web-based Input Overlay';

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

/**
 * SDL LIMITATION IN ELECTRON (DOCUMENTED FINDING):
 *
 * Extensive testing showed that @kmamal/sdl cannot receive Windows XInput gamepad events
 * when running inside Electron, despite:
 * - Event listeners registered (triggers switchToPollingFast)
 * - Hidden SDL window created (initializes event subsystem)
 * - Polling axes getters (triggers Globals.events.poll())
 * - SDL_JOYSTICK_ALLOW_BACKGROUND_EVENTS=1 environment variable
 *
 * Evidence:
 * - Standalone Node.js test: SDL works perfectly, axes update, events fire
 * - Electron app: SDL initializes, controller opens, but axes stay at 0.000 forever
 * - No SDL events ever fire (axisMotion, buttonDown, etc.)
 *
 * Root cause: Bindings.events_poll() receives ZERO gamepad events from Windows when
 * running in Electron's process environment. This appears to be a sandbox/process
 * isolation issue preventing SDL from accessing Windows XInput driver.
 *
 * OBS input-overlay comparison: OBS plugin is native C++ running in OBS's process,
 * not JavaScript in Electron's sandboxed renderer. Not a valid comparison.
 *
 * Solution: Use Chromium's native Gamepad API (navigator.getGamepads()) which works
 * in Electron because Chromium has direct gamepad support built-in.
 */

let uIOhook: UIOHook | null = null;
let mainWindow: BrowserWindow | null = null;
let gamepadPollInterval: NodeJS.Timeout | null = null;
let keepOnTopInterval: NodeJS.Timeout | null = null;
let sdlBridgeProcess: ChildProcess | null = null;
let sdlTcpServer: net.Server | null = null;
const SDL_TCP_PORT = 54321;

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

// SDL CHILD PROCESS ARCHITECTURE
// Binary search confirmed: SDL cannot work in Electron's main process
// Solution: Run SDL in separate Node.js process, communicate via TCP
// - SDL bridge runs in pure Node.js environment (main thread)
// - Event-driven gamepad updates sent to Electron via TCP
// - No stdio buffering issues (TCP has proper flow control)
console.log('[Main] SDL bridge will run in separate process...');

function sleep(ms: number): Promise<void> {
	return new Promise(resolve => setTimeout(resolve, ms));
}

async function isPortInUse(port: number): Promise<boolean> {
	return new Promise((resolve) => {
		const socket = new net.Socket();
		socket.setTimeout(1000);

		socket.once('connect', () => {
			socket.end();
			resolve(true);
		});

		socket.once('timeout', () => {
			socket.destroy();
			resolve(false);
		});

		socket.once('error', () => {
			socket.destroy();
			resolve(false);
		});

		socket.connect(port, '127.0.0.1');
	});
}

async function waitForPortFree(port: number, timeoutMs: number): Promise<boolean> {
	const startTime = Date.now();
	while (Date.now() - startTime < timeoutMs) {
		if (!(await isPortInUse(port))) {
			return true;
		}
		await sleep(100);
	}
	return false;
}

async function sendShutdownToOrphan(port: number): Promise<void> {
	return new Promise((resolve) => {
		const socket = new net.Socket();
		socket.setTimeout(2000);

		socket.once('connect', () => {
			console.log('[Main] Sending shutdown command to orphaned SDL bridge...');
			const shutdownMsg = JSON.stringify({ type: 'SHUTDOWN', pid: process.pid });
			socket.write(shutdownMsg + '\n');

			setTimeout(() => {
				socket.end();
				resolve();
			}, 1000);
		});

		socket.once('timeout', () => {
			socket.destroy();
			resolve();
		});

		socket.once('error', () => {
			socket.destroy();
			resolve();
		});

		socket.connect(port, '127.0.0.1');
	});
}

async function ensureCleanSDLBridge(): Promise<void> {
	console.log('[Main] Checking for orphaned SDL bridge processes...');

	const orphanExists = await isPortInUse(SDL_TCP_PORT);

	if (orphanExists) {
		console.log('[Main] Found orphaned SDL bridge, attempting graceful shutdown...');
		await sendShutdownToOrphan(SDL_TCP_PORT);

		const freed = await waitForPortFree(SDL_TCP_PORT, 5000);
		if (!freed) {
			console.error('[Main] WARNING: Orphaned SDL bridge did not shut down cleanly!');
			console.error('[Main] Port 54321 may still be in use. New bridge might fail to start.');
		} else {
			console.log('[Main] Orphaned SDL bridge cleaned up successfully');
		}
	} else {
		console.log('[Main] No orphaned SDL bridge detected');
	}
}

function startSDLBridge(): void {
	console.log('[Main] Starting SDL bridge...');

	// Step 1: Create TCP server for SDL bridge to connect to
	sdlTcpServer = net.createServer((client) => {
		console.log('[Main] SDL bridge connected via TCP');

		let buffer = '';

		client.on('data', (data: Buffer) => {
			buffer += data.toString();
			const lines = buffer.split('\n');
			buffer = lines.pop() || ''; // Keep incomplete line in buffer

			lines.forEach((line) => {
				if (!line.trim()) return;

				try {
					const message = JSON.parse(line);

					// Handle different message types
					switch (message.type) {
						case 'log':
							console.log(message.message);
							break;

						case 'gamepad-state':
							// Forward to renderer via IPC
							if (mainWindow && !mainWindow.isDestroyed()) {
								mainWindow.webContents.send('sdl-gamepad-state', {
									index: message.index,
									state: message.state,
								});
							}
							break;

						case 'keyboard-down':
							if (mainWindow && !mainWindow.isDestroyed()) {
								mainWindow.webContents.send('sdl-keyboard-down', message.event);
							}
							break;

						case 'keyboard-up':
							if (mainWindow && !mainWindow.isDestroyed()) {
								mainWindow.webContents.send('sdl-keyboard-up', message.event);
							}
							break;

						case 'mouse-move':
							if (mainWindow && !mainWindow.isDestroyed()) {
								mainWindow.webContents.send('sdl-mouse-move', message.event);
							}
							break;

						case 'mouse-down':
							if (mainWindow && !mainWindow.isDestroyed()) {
								mainWindow.webContents.send('sdl-mouse-down', message.event);
							}
							break;

						case 'mouse-up':
							if (mainWindow && !mainWindow.isDestroyed()) {
								mainWindow.webContents.send('sdl-mouse-up', message.event);
							}
							break;

						case 'mouse-wheel':
							if (mainWindow && !mainWindow.isDestroyed()) {
								mainWindow.webContents.send('sdl-mouse-wheel', message.event);
							}
							break;

						case 'heartbeat':
							// SDL bridge is alive
							break;

						default:
							console.log('[Main] Unknown SDL bridge message type:', (message as any).type);
					}
				} catch (err) {
					const error = err as Error;
					console.error('[Main] Failed to parse SDL bridge message:', error.message);
				}
			});
		});

		client.on('error', (err: Error) => {
			console.error('[Main] SDL bridge connection error:', err.message);
		});

		client.on('close', () => {
			console.log('[Main] SDL bridge disconnected');
		});
	});

	sdlTcpServer.listen(SDL_TCP_PORT, '127.0.0.1', () => {
		console.log(`[Main] TCP server listening on port ${SDL_TCP_PORT}`);

		// Step 2: Spawn SDL bridge process
		const bridgePath = path.join(__dirname, 'sdl-bridge.js');

		if (!fs.existsSync(bridgePath)) {
			console.error('[Main] SDL bridge not found:', bridgePath);
			console.error('[Main] Run "npm run build:desktop" to compile sdl-bridge.ts');
			return;
		}

		// In production, sdl-bridge.js is unpacked from asar to app.asar.unpacked/
		const actualBridgePath = app.isPackaged
			? bridgePath.replace('app.asar', 'app.asar.unpacked')
			: bridgePath;

		console.log('[Main] Spawning SDL bridge process:', actualBridgePath);

		// In production, extraResources puts node_modules in resources/
		// We need to tell node where to find them
		const resourcesPath = app.isPackaged
			? path.join(process.resourcesPath, 'node_modules')
			: path.join(__dirname, '..', 'node_modules');

		console.log('[Main] NODE_PATH for SDL bridge:', resourcesPath);

		sdlBridgeProcess = spawn('node', [
			actualBridgePath,
			SDL_TCP_PORT.toString(),
			process.pid.toString() // Pass parent PID for heartbeat monitoring
		], {
			stdio: ['ignore', 'pipe', 'pipe'], // Don't use stdin, capture stdout/stderr
			windowsHide: true, // Hide console window on Windows
			detached: false, // Keep attached to parent so it dies with Electron
			env: {
				...process.env,
				NODE_PATH: resourcesPath,
			},
		});

		sdlBridgeProcess.stdout?.on('data', (data: Buffer) => {
			console.log('[SDL Bridge stdout]', data.toString().trim());
		});

		sdlBridgeProcess.stderr?.on('data', (data: Buffer) => {
			console.error('[SDL Bridge stderr]', data.toString().trim());
		});

		sdlBridgeProcess.on('error', (err: Error) => {
			console.error('[Main] Failed to start SDL bridge:', err.message);
		});

		sdlBridgeProcess.on('exit', (code: number | null, signal: string | null) => {
			console.log(`[Main] SDL bridge exited with code ${code}, signal ${signal}`);
			sdlBridgeProcess = null;
		});
	});

	sdlTcpServer.on('error', (err: Error) => {
		console.error('[Main] TCP server error:', err.message);
	});
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

// SDL functions removed - using DOM Gamepad API

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

		// Cleanup SDL bridge
		if (sdlBridgeProcess) {
			console.log('[Main] Stopping SDL bridge process...');
			sdlBridgeProcess.kill('SIGTERM');
			sdlBridgeProcess = null;
		}

		if (sdlTcpServer) {
			console.log('[Main] Closing SDL TCP server...');
			sdlTcpServer.close();
			sdlTcpServer = null;
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

	// SDL disabled - using DOM Gamepad API
	console.log('[Main] Gamepad detection: Chromium will detect gamepads automatically');
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

	mainWindow = await createWindow();

	// Load bundled webapp (same for dev and prod - 100% parity)
	const htmlPath = app.isPackaged
		? path.join(process.resourcesPath, 'app.asar', 'WebApp', 'index.html')
		: path.join(__dirname, '..', 'WebApp', '_bundleAllCompiledJavascriptForWebapp', 'index.html');

	console.log(`[Main] Loading bundled webapp from: ${htmlPath}`);
	await mainWindow.loadFile(htmlPath);
	startInputHooks();

	// Clean up any orphaned SDL bridges from previous crashes
	await ensureCleanSDLBridge();

	// Start SDL bridge in separate process
	startSDLBridge();

	app.on('activate', async () => {
		if (BrowserWindow.getAllWindows().length === 0) {
			mainWindow = await createWindow();

			const htmlPath = app.isPackaged
				? path.join(process.resourcesPath, 'app.asar', 'WebApp', 'index.html')
				: path.join(__dirname, '..', 'WebApp', '_bundleAllCompiledJavascriptForWebapp', 'index.html');

			await mainWindow.loadFile(htmlPath);
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

// Ensure SDL bridge is killed when app quits
app.on('before-quit', () => {
	console.log('[Main] App quitting - cleaning up SDL bridge...');

	if (sdlBridgeProcess) {
		sdlBridgeProcess.kill('SIGTERM');
		sdlBridgeProcess = null;
	}

	if (sdlTcpServer) {
		sdlTcpServer.close();
		sdlTcpServer = null;
	}
});

// Force kill SDL bridge if still running after quit
app.on('will-quit', () => {
	if (sdlBridgeProcess) {
		console.log('[Main] Force killing SDL bridge...');
		sdlBridgeProcess.kill('SIGKILL'); // Force kill
	}
});
