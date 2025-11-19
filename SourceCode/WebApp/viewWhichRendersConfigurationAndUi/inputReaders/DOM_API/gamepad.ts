// Export a getter function instead of caching at module load time
// This ensures we call the (potentially overridden) navigator.getGamepads() at runtime
export function getGamepads(): (Gamepad | null)[] | null {
	return navigator.getGamepads();
}
