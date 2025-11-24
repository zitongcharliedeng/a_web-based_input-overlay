#!/usr/bin/env node

/**
 * SDL Bridge - Separate Node.js process providing ALL SDL inputs via TCP IPC
 *
 * Why separate process:
 * - SDL requires main thread (worker_threads incompatible)
 * - SDL events don't fire in Electron's main process (Chromium event loop conflict)
 * - Binary search test proved: SDL works in standalone Node.js, fails in Electron
 * - Thousands of projects use SDL in separate process from Electron
 *
 * Why TCP instead of stdio:
 * - stdio has 64KB kernel buffer causing Win32k crashes at 60fps
 * - TCP has automatic flow control and backpressure handling
 * - Non-blocking writes prevent deadlocks
 *
 * Architecture:
 * - This process: Pure Node.js with SDL in main thread
 * - Electron: TCP server receiving gamepad/keyboard/mouse state
 * - Protocol: Newline-delimited JSON over TCP
 */

import * as net from 'net';

// ═══════════════════════════════════════════════════════════════════════════
// SDL TYPE DEFINITIONS - @kmamal/sdl lacks official TypeScript types
// ═══════════════════════════════════════════════════════════════════════════

interface SDLControllerDevice {
	name: string;
	path?: string;
}

interface SDLControllerAxes {
	leftStickX: number;
	leftStickY: number;
	rightStickX: number;
	rightStickY: number;
	leftTrigger: number;
	rightTrigger: number;
}

interface SDLControllerButtons {
	a: boolean;
	b: boolean;
	x: boolean;
	y: boolean;
	leftShoulder: boolean;
	rightShoulder: boolean;
	back: boolean;
	start: boolean;
	leftStick: boolean;
	rightStick: boolean;
	dpadUp: boolean;
	dpadDown: boolean;
	dpadLeft: boolean;
	dpadRight: boolean;
	guide: boolean;
}

interface SDLController {
	device: SDLControllerDevice;
	axes: SDLControllerAxes;
	buttons: SDLControllerButtons;
	closed: boolean;
	on(event: 'axisMotion', callback: (event: { axis: number; value: number }) => void): void;
	on(event: 'buttonDown', callback: (event: { button: number }) => void): void;
	on(event: 'buttonUp', callback: (event: { button: number }) => void): void;
	on(event: 'close', callback: () => void): void;
	close(): void;
}

interface SDLControllerAPI {
	devices: SDLControllerDevice[];
	openDevice(device: SDLControllerDevice): SDLController;
	on(event: 'deviceAdd', callback: (device: SDLControllerDevice) => void): void;
	on(event: 'deviceRemove', callback: (device: SDLControllerDevice) => void): void;
}

interface SDLKeyEvent {
	scancode: number;
	key?: string;
}

interface SDLMouseMoveEvent {
	x: number;
	y: number;
}

interface SDLMouseButtonEvent {
	x: number;
	y: number;
	button: number;
}

interface SDLMouseWheelEvent {
	x?: number;
	y?: number;
}

interface SDLWindow {
	destroy(): void;
	on(event: 'keyDown', callback: (event: SDLKeyEvent) => void): void;
	on(event: 'keyUp', callback: (event: SDLKeyEvent) => void): void;
	on(event: 'mouseMove', callback: (event: SDLMouseMoveEvent) => void): void;
	on(event: 'mouseButtonDown', callback: (event: SDLMouseButtonEvent) => void): void;
	on(event: 'mouseButtonUp', callback: (event: SDLMouseButtonEvent) => void): void;
	on(event: 'mouseWheel', callback: (event: SDLMouseWheelEvent) => void): void;
}

interface SDLVideoAPI {
	createWindow(options: {
		title: string;
		width: number;
		height: number;
		hidden?: boolean;
	}): SDLWindow;
}

interface SDL {
	controller?: SDLControllerAPI;
	video?: SDLVideoAPI;
}

// Load SDL (requires @kmamal/sdl installed)
const sdl = require('@kmamal/sdl') as SDL;

process.env['SDL_JOYSTICK_ALLOW_BACKGROUND_EVENTS'] = '1';

// Set process title for Task Manager identification
process.title = 'Input Overlay SDL Bridge';

// ═══════════════════════════════════════════════════════════════════════════
// TYPE DEFINITIONS - Match DOM API for seamless integration
// ═══════════════════════════════════════════════════════════════════════════

interface GamepadButton {
	pressed: boolean;
	value: number;
}

interface GamepadState {
	axes: number[];
	buttons: GamepadButton[];
	connected: boolean;
	timestamp: number;
	id: string;
	index: number;
	mapping: 'standard' | '';
}

interface KeyboardEvent {
	code: string;
	key: string;
	keyCode: number;
	timestamp: number;
}

interface MouseMoveEvent {
	x: number;
	y: number;
	timestamp: number;
}

interface MouseButtonEvent {
	x: number;
	y: number;
	button: number;
	timestamp: number;
}

interface MouseWheelEvent {
	deltaX: number;
	deltaY: number;
	deltaZ: number;
	timestamp: number;
}

type BridgeMessage =
	| { type: 'log'; message: string }
	| { type: 'gamepad-state'; index: number; state: GamepadState }
	| { type: 'keyboard-down'; event: KeyboardEvent }
	| { type: 'keyboard-up'; event: KeyboardEvent }
	| { type: 'mouse-move'; event: MouseMoveEvent }
	| { type: 'mouse-down'; event: MouseButtonEvent }
	| { type: 'mouse-up'; event: MouseButtonEvent }
	| { type: 'mouse-wheel'; event: MouseWheelEvent }
	| { type: 'heartbeat'; stats: { gamepads: number; windows: number } };

// ═══════════════════════════════════════════════════════════════════════════
// TCP COMMUNICATION
// ═══════════════════════════════════════════════════════════════════════════

let socket: net.Socket | null = null;

function log(message: string): void {
	send({ type: 'log', message: `[SDL Bridge] ${message}` });
}

function send(data: BridgeMessage): void {
	if (!socket || socket.destroyed) return;

	try {
		// JSON with newline delimiter for parsing
		socket.write(JSON.stringify(data) + '\n');
	} catch (err) {
		const error = err as Error;
		console.error('[SDL Bridge] Send error:', error.message);
	}
}

// ═══════════════════════════════════════════════════════════════════════════
// GAMEPAD SUPPORT - SDL Controller API
// ═══════════════════════════════════════════════════════════════════════════

const controllers = new Map<number, SDLController>();

function sendGamepadState(index: number, controller: SDLController): void {
	if (controller.closed) return;

	const axes = controller.axes;
	const buttons = controller.buttons;

	// Map SDL controller to W3C Gamepad API format
	const state: GamepadState = {
		axes: [
			axes.leftStickX ?? 0,
			axes.leftStickY ?? 0,
			axes.rightStickX ?? 0,
			axes.rightStickY ?? 0,
		],
		buttons: [
			{ pressed: buttons.a ?? false, value: buttons.a ? 1 : 0 },
			{ pressed: buttons.b ?? false, value: buttons.b ? 1 : 0 },
			{ pressed: buttons.x ?? false, value: buttons.x ? 1 : 0 },
			{ pressed: buttons.y ?? false, value: buttons.y ? 1 : 0 },
			{ pressed: buttons.leftShoulder ?? false, value: buttons.leftShoulder ? 1 : 0 },
			{ pressed: buttons.rightShoulder ?? false, value: buttons.rightShoulder ? 1 : 0 },
			{ pressed: false, value: axes.leftTrigger ?? 0 },  // Triggers are axes
			{ pressed: false, value: axes.rightTrigger ?? 0 },
			{ pressed: buttons.back ?? false, value: buttons.back ? 1 : 0 },
			{ pressed: buttons.start ?? false, value: buttons.start ? 1 : 0 },
			{ pressed: buttons.leftStick ?? false, value: buttons.leftStick ? 1 : 0 },
			{ pressed: buttons.rightStick ?? false, value: buttons.rightStick ? 1 : 0 },
			{ pressed: buttons.dpadUp ?? false, value: buttons.dpadUp ? 1 : 0 },
			{ pressed: buttons.dpadDown ?? false, value: buttons.dpadDown ? 1 : 0 },
			{ pressed: buttons.dpadLeft ?? false, value: buttons.dpadLeft ? 1 : 0 },
			{ pressed: buttons.dpadRight ?? false, value: buttons.dpadRight ? 1 : 0 },
			{ pressed: buttons.guide ?? false, value: buttons.guide ? 1 : 0 },
		],
		connected: true,
		timestamp: Date.now(),
		id: `SDL Gamepad (${controller.device?.name ?? 'Unknown'})`,
		index,
		mapping: 'standard',
	};

	send({ type: 'gamepad-state', index, state });
}

function initControllers(): void {
	if (!sdl.controller) {
		log('SDL controller API not available');
		return;
	}

	const devices = sdl.controller!.devices;
	log(`Found ${devices.length} controller(s)`);

	devices.forEach((device: SDLControllerDevice, index: number) => {
		try {
			const controller = sdl.controller!.openDevice(device);
			controllers.set(index, controller);
			log(`Opened controller ${index}: ${device.name}`);

			// Event-driven updates (this is what makes SDL work!)
			controller.on('axisMotion', () => sendGamepadState(index, controller));
			controller.on('buttonDown', () => sendGamepadState(index, controller));
			controller.on('buttonUp', () => sendGamepadState(index, controller));

			controller.on('close', () => {
				log(`Controller ${index} disconnected`);
				send({
					type: 'gamepad-state',
					index,
					state: {
						axes: [],
						buttons: [],
						connected: false,
						timestamp: Date.now(),
						id: '',
						index,
						mapping: '',
					},
				});
				controllers.delete(index);
			});

			// Send initial state
			sendGamepadState(index, controller);
		} catch (err) {
			const error = err as Error;
			log(`Failed to open controller ${index}: ${error.message}`);
		}
	});

	// Hot-plug support
	sdl.controller!.on('deviceAdd', (device: SDLControllerDevice) => {
		log(`Controller connected: ${device.name}`);
		const index = controllers.size;
		try {
			const controller = sdl.controller!.openDevice(device);
			controllers.set(index, controller);
			controller.on('axisMotion', () => sendGamepadState(index, controller));
			controller.on('buttonDown', () => sendGamepadState(index, controller));
			controller.on('buttonUp', () => sendGamepadState(index, controller));
			controller.on('close', () => controllers.delete(index));
			sendGamepadState(index, controller);
		} catch (err) {
			const error = err as Error;
			log(`Failed to open hot-plugged controller: ${error.message}`);
		}
	});

	sdl.controller!.on('deviceRemove', (device: SDLControllerDevice) => {
		log(`Controller removed: ${device.name}`);
	});
}

// ═══════════════════════════════════════════════════════════════════════════
// KEYBOARD & MOUSE SUPPORT - SDL Window Events
// ═══════════════════════════════════════════════════════════════════════════

// SDL scancode to DOM KeyboardEvent.code mapping
const SDL_SCANCODE_TO_CODE: Record<number, string> = {
	// Letters
	4: 'KeyA', 5: 'KeyB', 6: 'KeyC', 7: 'KeyD', 8: 'KeyE', 9: 'KeyF',
	10: 'KeyG', 11: 'KeyH', 12: 'KeyI', 13: 'KeyJ', 14: 'KeyK', 15: 'KeyL',
	16: 'KeyM', 17: 'KeyN', 18: 'KeyO', 19: 'KeyP', 20: 'KeyQ', 21: 'KeyR',
	22: 'KeyS', 23: 'KeyT', 24: 'KeyU', 25: 'KeyV', 26: 'KeyW', 27: 'KeyX',
	28: 'KeyY', 29: 'KeyZ',
	// Numbers
	30: 'Digit1', 31: 'Digit2', 32: 'Digit3', 33: 'Digit4', 34: 'Digit5',
	35: 'Digit6', 36: 'Digit7', 37: 'Digit8', 38: 'Digit9', 39: 'Digit0',
	// Special keys
	40: 'Enter', 41: 'Escape', 42: 'Backspace', 43: 'Tab', 44: 'Space',
	79: 'ArrowRight', 80: 'ArrowLeft', 81: 'ArrowDown', 82: 'ArrowUp',
	225: 'ShiftLeft', 229: 'ShiftRight',
	224: 'ControlLeft', 228: 'ControlRight',
	226: 'AltLeft', 230: 'AltRight',
};

let sdlWindow: SDLWindow | null = null;

function initKeyboardMouse(): void {
	if (!sdl.video) {
		log('SDL video API not available (keyboard/mouse requires window)');
		return;
	}

	try {
		// Create hidden 1x1 window to receive keyboard/mouse events
		sdlWindow = sdl.video.createWindow({
			title: 'SDL Input Bridge',
			width: 1,
			height: 1,
			hidden: true,
		});
		log('Created hidden SDL window for keyboard/mouse input');

		sdlWindow.on('keyDown', (event: SDLKeyEvent) => {
			const code = SDL_SCANCODE_TO_CODE[event.scancode] ?? `Unknown${event.scancode}`;
			send({
				type: 'keyboard-down',
				event: {
					code,
					key: event.key ?? code,
					keyCode: event.scancode,
					timestamp: Date.now(),
				},
			});
		});

		sdlWindow.on('keyUp', (event: SDLKeyEvent) => {
			const code = SDL_SCANCODE_TO_CODE[event.scancode] ?? `Unknown${event.scancode}`;
			send({
				type: 'keyboard-up',
				event: {
					code,
					key: event.key ?? code,
					keyCode: event.scancode,
					timestamp: Date.now(),
				},
			});
		});

		sdlWindow.on('mouseMove', (event: SDLMouseMoveEvent) => {
			send({
				type: 'mouse-move',
				event: {
					x: event.x,
					y: event.y,
					timestamp: Date.now(),
				},
			});
		});

		sdlWindow.on('mouseButtonDown', (event: SDLMouseButtonEvent) => {
			send({
				type: 'mouse-down',
				event: {
					x: event.x,
					y: event.y,
					button: event.button,
					timestamp: Date.now(),
				},
			});
		});

		sdlWindow.on('mouseButtonUp', (event: SDLMouseButtonEvent) => {
			send({
				type: 'mouse-up',
				event: {
					x: event.x,
					y: event.y,
					button: event.button,
					timestamp: Date.now(),
				},
			});
		});

		sdlWindow.on('mouseWheel', (event: SDLMouseWheelEvent) => {
			send({
				type: 'mouse-wheel',
				event: {
					deltaX: event.x ?? 0,
					deltaY: event.y ?? 0,
					deltaZ: 0,
					timestamp: Date.now(),
				},
			});
		});
	} catch (err) {
		const error = err as Error;
		log(`Failed to initialize keyboard/mouse: ${error.message}`);
	}
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN - Connect to Electron via TCP
// ═══════════════════════════════════════════════════════════════════════════

const port = parseInt(process.argv[2] ?? '54321');

socket = net.connect(port, '127.0.0.1', () => {
	log('Connected to Electron');

	try {
		initControllers();
		initKeyboardMouse();
		log('SDL bridge ready');
	} catch (error) {
		const err = error as Error;
		log(`FATAL: ${err.message}`);
		process.exit(1);
	}
});

socket.on('error', (err: Error) => {
	console.error('[SDL Bridge] Socket error:', err.message);
	process.exit(1);
});

socket.on('close', () => {
	console.log('[SDL Bridge] Connection closed');
	controllers.forEach(c => !c.closed && c.close());
	if (sdlWindow) sdlWindow.destroy();
	process.exit(0);
});

// Graceful shutdown
process.on('SIGTERM', () => {
	log('Shutting down...');
	controllers.forEach(c => !c.closed && c.close());
	if (sdlWindow) sdlWindow.destroy();
	if (socket) socket.end();
	process.exit(0);
});

process.on('SIGINT', () => {
	log('Interrupted');
	controllers.forEach(c => !c.closed && c.close());
	if (sdlWindow) sdlWindow.destroy();
	if (socket) socket.end();
	process.exit(0);
});

// Heartbeat every 5 seconds
setInterval(() => {
	send({
		type: 'heartbeat',
		stats: {
			gamepads: controllers.size,
			windows: sdlWindow ? 1 : 0,
		},
	});
}, 5000);
