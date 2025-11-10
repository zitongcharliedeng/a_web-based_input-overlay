// NOTE: This module is not actively used - the app uses window.gamepads instead
// which is updated every frame in default.js via navigator.getGamepads()
// Kept for compatibility in case other code imports it
var gamepads = navigator.getGamepads();

export { gamepads };
