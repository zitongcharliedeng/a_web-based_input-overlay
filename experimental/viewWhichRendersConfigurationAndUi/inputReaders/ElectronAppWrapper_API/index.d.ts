/**
 * Electron API Bridge - Bridges uiohook and SDL events to Web APIs
 *
 * This module overrides navigator.getGamepads() and dispatches synthetic DOM events
 * to bridge Electron's uiohook (global keyboard/mouse) and SDL (gamepad) to standard Web APIs.
 *
 * Only runs when window.electronAPI is available (Electron environment).
 */
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
interface GlobalGamepadState {
    axes: number[];
    buttons: GamepadButton[];
    timestamp: number;
    connected: boolean;
}
declare global {
    interface Window {
        electronAPI?: {
            onGlobalKeyDown: (callback: (data: GlobalKeyEvent) => void) => void;
            onGlobalKeyUp: (callback: (data: GlobalKeyEvent) => void) => void;
            onGlobalMouseMove: (callback: (data: GlobalMouseMoveEvent) => void) => void;
            onGlobalMouseDown: (callback: (data: GlobalMouseButtonEvent) => void) => void;
            onGlobalMouseUp: (callback: (data: GlobalMouseButtonEvent) => void) => void;
            onGlobalWheel: (callback: (data: GlobalWheelEvent) => void) => void;
            onGlobalGamepadState: (callback: (state: GlobalGamepadState) => void) => void;
            isAppInReadonlyClickthroughMode: () => boolean;
            hasGlobalInput: () => boolean;
        };
    }
}
export declare function initializeElectronBridges(): void;
export {};
