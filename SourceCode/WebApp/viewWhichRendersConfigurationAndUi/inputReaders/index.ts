/**
 * ═══════════════════════════════════════════════════════════════════════════
 * UNIFIED INPUT INTERFACE - Single Source of Truth for ALL Inputs
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * This is the ONLY module the webapp should import from.
 * It provides a unified DOM-compatible interface for all input sources.
 *
 * Input Sources:
 * ┌─────────────────────────────────────────────────────────────────────────┐
 * │ • Native DOM Gamepad API     (works in web + Electron)                  │
 * │ • uiohook global inputs       (Electron only, via IPC)                  │
 * │ • Future: evdev, additional input libraries...                          │
 * └─────────────────────────────────────────────────────────────────────────┘
 *
 * Architecture:
 * - _web/     → Native browser APIs (DOM Gamepad, keyboard, mouse)
 * - _desktop/ → Electron-specific modules (uiohook IPC bridges)
 * - THIS FILE → Unified interface the webapp imports
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
import './_desktop';

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
 * Returns gamepads from Chromium's Web Gamepad API.
 * Works identically in both web and Electron (Chromium-based).
 *
 * No SDL needed - Chromium provides full gamepad support via navigator.getGamepads()
 *
 * @returns Standard DOM Gamepad[] sparse array (from navigator.getGamepads)
 */
export function getGamepads(): (Gamepad | null)[] {
	return originalGetGamepads();
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
