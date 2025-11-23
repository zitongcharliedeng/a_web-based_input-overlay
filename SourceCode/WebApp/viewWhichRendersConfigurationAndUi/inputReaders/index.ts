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

// Import desktop-specific input sources
// This auto-initializes IPC bridges if running in Electron
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
 * Returns ALL gamepads from ALL sources combined:
 * - Native DOM gamepads (USB/Bluetooth controllers via browser)
 * - SDL gamepads (via Electron main process, event-driven IPC cache)
 * - Future: evdev, or any other gamepad input source
 *
 * Merge Strategy (voted by Code Council):
 * - Concatenate SDL + DOM gamepads
 * - Reindex to 0-3 (standard Gamepad API format)
 * - Known limitation: may show duplicates if same controller appears in both
 *
 * @returns Standard DOM Gamepad[] sparse array (4 slots, nulls for empty)
 */
let getGamepadsCallCount = 0;
export function getGamepads(): (Gamepad | null)[] {
	getGamepadsCallCount++;

	// Get native DOM gamepads (browser's built-in detection)
	const domPads = Array.from(originalGetGamepads()).filter(Boolean) as Gamepad[];

	// Get SDL gamepads from cache (updated by _desktop module via IPC events)
	const sdlPads = sdlGamepadCache.filter(Boolean);

	// Log first 5 calls and then every 120th (every 2 seconds at 60fps)
	if (getGamepadsCallCount <= 5 || getGamepadsCallCount % 120 === 0) {
		console.log(`[Unified getGamepads #${getGamepadsCallCount}]`, {
			sdlCount: sdlPads.length,
			domCount: domPads.length,
			sdlCache: sdlGamepadCache.map(p => p ? 'connected' : 'null'),
			domPads: domPads.map(p => ({
				id: p.id,
				axes: p.axes.map(a => a.toFixed(3)),
				buttons: p.buttons.filter(b => b.pressed).length + ' pressed'
			}))
		});
	}

	// Concatenate all sources (SDL first for priority/accuracy)
	const allPads = [...sdlPads, ...domPads].filter(Boolean);

	// Return sparse array with reindexed gamepads (standard DOM Gamepad API format)
	const result: (Gamepad | null)[] = [null, null, null, null];
	allPads.forEach((pad, i) => {
		if (i < 4) {
			result[i] = { ...pad, index: i } as Gamepad;
		}
	});

	return result;
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
