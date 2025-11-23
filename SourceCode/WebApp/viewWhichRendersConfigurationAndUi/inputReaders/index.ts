/**
 * ═══════════════════════════════════════════════════════════════════════════
 * UNIFIED INPUT INTERFACE - Single Source of Truth for ALL Inputs
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * This is the ONLY module the webapp should import from.
 * It combines ALL input sources into a single DOM-compatible interface.
 *
 * Input Sources (constructively merged):
 * ┌─────────────────────────────────────────────────────────────────────────┐
 * │ • Native DOM Gamepad API     (works in web + Electron)                  │
 * │ • SDL gamepads                (Electron only, via IPC)                  │
 * │ • uiohook global inputs       (Electron only, via IPC)                  │
 * │ • Future: evdev, additional input libraries...                          │
 * └─────────────────────────────────────────────────────────────────────────┘
 *
 * Architecture:
 * - _web/     → Native browser APIs (DOM Gamepad, keyboard, mouse)
 * - _desktop/ → Electron-specific modules (SDL, uiohook IPC bridges)
 * - THIS FILE → Combines everything into unified DOM-like interface
 *
 * The webapp knows NOTHING about implementation. It just calls:
 * - getGamepads() → Gamepad[] (standard DOM signature)
 * - keyboard      → standard keyboard state object
 * - mouse         → standard mouse state object
 */

// Import base DOM APIs from _web module
import { keyboard as webKeyboard } from './_web/keyboard';
import { mouse as webMouse } from './_web/mouse';

// Import desktop-specific input sources (SDL bridge + uiohook keyboard/mouse)
import { sdlGamepadCache } from './_desktop';

// Store original DOM Gamepad API
const originalGetGamepads = navigator.getGamepads.bind(navigator);

// Activate DOM Gamepad API (required per W3C spec - lazy initialization)
if (typeof window !== 'undefined') {
	window.addEventListener('gamepadconnected', () => {});
	window.addEventListener('gamepaddisconnected', () => {});
	originalGetGamepads(); // Initial poll to complete activation
}

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * UNIFIED GAMEPAD INTERFACE
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Returns gamepads from SDL Bridge (separate Node process) + DOM API fallback.
 *
 * SDL Bridge: Runs SDL in a pure Node.js process where it works perfectly,
 * communicates with Electron via IPC. Provides out-of-focus support.
 *
 * DOM API: Chromium's native gamepad support as fallback. Works when focused,
 * stops when out of focus (confirmed by testing).
 *
 * @returns Standard DOM Gamepad[] sparse array
 */
let getGamepadsCallCount = 0;
export function getGamepads(): (Gamepad | null)[] {
	getGamepadsCallCount++;

	// Prefer SDL bridge gamepads (out-of-focus support)
	const sdlPads = sdlGamepadCache.filter(Boolean);

	// Fallback to DOM API (in-focus only)
	const domPads = Array.from(originalGetGamepads()).filter(Boolean);

	// Use SDL if available, otherwise DOM
	const gamepads = sdlPads.length > 0 ? [...sdlGamepadCache] : Array.from(originalGetGamepads());

	// Log first 5 calls and then every 120th
	if (getGamepadsCallCount <= 5 || getGamepadsCallCount % 120 === 0) {
		const connected = gamepads.filter(Boolean);
		console.log(`[getGamepads #${getGamepadsCallCount}] ${sdlPads.length} SDL + ${domPads.length} DOM = ${connected.length} total`,
			connected.map(p => p ? {
				id: p.id,
				axes: p.axes.map(a => a.toFixed(3)),
				buttonsPressed: p.buttons.filter(b => b.pressed).length
			} : null)
		);
	}

	return gamepads;
}

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * UNIFIED KEYBOARD INTERFACE
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Sources (all merged automatically via DOM events):
 * - Web: Native DOM keyboard events
 * - Desktop: uiohook dispatches synthetic DOM KeyboardEvents
 *
 * The _web/keyboard module listens to DOM events, so it automatically
 * receives BOTH native browser events AND synthetic uiohook events.
 * No platform detection needed - just constructive merging.
 */
export const keyboard = webKeyboard;

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * UNIFIED MOUSE INTERFACE
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Sources (all merged automatically via DOM events + direct state updates):
 * - Web: Native DOM mouse events
 * - Desktop: uiohook dispatches synthetic DOM mouse events + updates state
 *
 * The _web/mouse module listens to DOM events, so it automatically
 * receives BOTH native browser events AND synthetic uiohook events.
 * No platform detection needed - just constructive merging.
 */
export const mouse = webMouse;
