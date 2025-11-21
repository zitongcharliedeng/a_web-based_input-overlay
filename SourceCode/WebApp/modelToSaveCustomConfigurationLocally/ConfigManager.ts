// ConfigManager: Single Source of Truth for canvas state
// Manages CustomisableCanvasConfig with pure functional updates

import type { CustomisableCanvasConfig, CanvasObjectConfig } from './CustomisableCanvasConfig';
import { updateObjectPosition, updateCanvasDimensions, addObject, removeObject, updateObjectByIndex } from './configUpdaters';

// Callback type for when config changes
type ConfigChangeCallback = (newConfig: CustomisableCanvasConfig) => void;

/**
 * ConfigManager: Single source of truth for canvas configuration
 *
 * Functional principles:
 * - Config is immutable (updates create new config)
 * - All mutations go through pure update functions
 * - Observers notified on config changes
 * - Auto-save handled centrally
 */
export class ConfigManager {
	private _config: CustomisableCanvasConfig;
	private changeCallbacks: ConfigChangeCallback[] = [];
	private saveCallback: ((config: CustomisableCanvasConfig) => void) | null = null;

	constructor(initialConfig: CustomisableCanvasConfig) {
		this._config = initialConfig;
	}

	/**
	 * Get current config (read-only)
	 */
	get config(): CustomisableCanvasConfig {
		return this._config;
	}

	/**
	 * Update config (immutable - sets new config)
	 * Notifies all observers and triggers save
	 */
	setConfig(newConfig: CustomisableCanvasConfig): void {
		// Don't update if config hasn't actually changed
		if (newConfig === this._config) return;

		this._config = newConfig;

		// Notify all observers
		this.changeCallbacks.forEach(callback => { callback(newConfig); });

		// Trigger save
		if (this.saveCallback) {
			this.saveCallback(newConfig);
		}
	}

	/**
	 * Subscribe to config changes
	 * Returns unsubscribe function
	 */
	onChange(callback: ConfigChangeCallback): () => void {
		this.changeCallbacks.push(callback);

		// Return unsubscribe function
		return () => {
			this.changeCallbacks = this.changeCallbacks.filter(cb => cb !== callback);
		};
	}

	/**
	 * Set save callback (called when config changes)
	 */
	onSave(callback: (config: CustomisableCanvasConfig) => void): void {
		this.saveCallback = callback;
	}

	// ============================================================================
	// High-level mutation methods (use pure update functions)
	// ============================================================================

	/**
	 * Update object position (immutable)
	 */
	moveObject(objectIndex: number, x: number, y: number): void {
		const newConfig = updateObjectPosition(this._config, objectIndex, x, y);
		this.setConfig(newConfig);
	}


	/**
	 * Update canvas dimensions (immutable)
	 */
	resizeCanvas(width: number, height: number): void {
		const newConfig = updateCanvasDimensions(this._config, width, height);
		this.setConfig(newConfig);
	}

	/**
	 * Update object properties (immutable)
	 */
	updateObject(objectIndex: number, updates: Map<string, { path: string[], value: unknown }>): void {
		const newConfig = updateObjectByIndex(this._config, objectIndex, updates);
		this.setConfig(newConfig);
	}

	/**
	 * Add new object (immutable)
	 */
	addObject(objectConfig: CanvasObjectConfig): void {
		const newConfig = addObject(this._config, objectConfig);
		this.setConfig(newConfig);
	}

	/**
	 * Remove object (immutable)
	 */
	deleteObject(objectIndex: number): void {
		const newConfig = removeObject(this._config, objectIndex);
		this.setConfig(newConfig);
	}

}
