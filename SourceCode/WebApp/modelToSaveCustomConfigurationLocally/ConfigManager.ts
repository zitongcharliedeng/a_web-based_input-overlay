// ConfigManager: Single Source of Truth for canvas state
// Manages OmniConfig with pure functional updates

import type { OmniConfig, CanvasObjectConfig } from './OmniConfig';
import { updateObjectPosition, updateObjectPropertyById, updateCanvasDimensions, addObject, removeObject, removeObjectById } from './configUpdaters';

// Callback type for when config changes
type ConfigChangeCallback = (newConfig: OmniConfig) => void;

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
	private _config: OmniConfig;
	private changeCallbacks: ConfigChangeCallback[] = [];
	private saveCallback: ((config: OmniConfig) => void) | null = null;

	constructor(initialConfig: OmniConfig) {
		this._config = initialConfig;
	}

	/**
	 * Get current config (read-only)
	 */
	get config(): OmniConfig {
		return this._config;
	}

	/**
	 * Update config (immutable - sets new config)
	 * Notifies all observers and triggers save
	 */
	setConfig(newConfig: OmniConfig): void {
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
	onSave(callback: (config: OmniConfig) => void): void {
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
	 * Update object property by ID (immutable deep update)
	 * This is the proper way for PropertyEdit to mutate objects
	 */
	updateObjectProperty(objectId: string, path: string[], value: unknown): void {
		const newConfig = updateObjectPropertyById(this._config, objectId, path, value);
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

	/**
	 * Remove object by ID (immutable)
	 * Preferred method for object deletion (stable reference)
	 */
	deleteObjectById(objectId: string): void {
		const newConfig = removeObjectById(this._config, objectId);
		this.setConfig(newConfig);
	}
}
