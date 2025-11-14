// ConfigManager: Single Source of Truth for scene state
// Manages OmniConfig with pure functional updates
import { updateObjectPosition, updateObjectPropertyById, updateCanvasDimensions, addObject, removeObject, removeObjectById } from './configUpdaters.js';
/**
 * ConfigManager: Single source of truth for scene configuration
 *
 * Functional principles:
 * - Config is immutable (updates create new config)
 * - All mutations go through pure update functions
 * - Observers notified on config changes
 * - Auto-save handled centrally
 */
export class ConfigManager {
    constructor(initialConfig) {
        this.changeCallbacks = [];
        this.saveCallback = null;
        this._config = initialConfig;
    }
    /**
     * Get current config (read-only)
     */
    get config() {
        return this._config;
    }
    /**
     * Update config (immutable - sets new config)
     * Notifies all observers and triggers save
     */
    setConfig(newConfig) {
        // Don't update if config hasn't actually changed
        if (newConfig === this._config)
            return;
        this._config = newConfig;
        // Notify all observers
        this.changeCallbacks.forEach(callback => callback(newConfig));
        // Trigger save
        if (this.saveCallback) {
            this.saveCallback(newConfig);
        }
    }
    /**
     * Subscribe to config changes
     * Returns unsubscribe function
     */
    onChange(callback) {
        this.changeCallbacks.push(callback);
        // Return unsubscribe function
        return () => {
            this.changeCallbacks = this.changeCallbacks.filter(cb => cb !== callback);
        };
    }
    /**
     * Set save callback (called when config changes)
     */
    onSave(callback) {
        this.saveCallback = callback;
    }
    // ============================================================================
    // High-level mutation methods (use pure update functions)
    // ============================================================================
    /**
     * Update object position (immutable)
     */
    moveObject(objectIndex, x, y) {
        const newConfig = updateObjectPosition(this._config, objectIndex, x, y);
        this.setConfig(newConfig);
    }
    /**
     * Update object property by ID (immutable deep update)
     * This is the proper way for PropertyEdit to mutate objects
     */
    updateObjectProperty(objectId, path, value) {
        const newConfig = updateObjectPropertyById(this._config, objectId, path, value);
        this.setConfig(newConfig);
    }
    /**
     * Update canvas dimensions (immutable)
     */
    resizeCanvas(width, height) {
        const newConfig = updateCanvasDimensions(this._config, width, height);
        this.setConfig(newConfig);
    }
    /**
     * Add new object (immutable)
     */
    addObject(objectConfig) {
        const newConfig = addObject(this._config, objectConfig);
        this.setConfig(newConfig);
    }
    /**
     * Remove object (immutable)
     */
    deleteObject(objectIndex) {
        const newConfig = removeObject(this._config, objectIndex);
        this.setConfig(newConfig);
    }
    /**
     * Remove object by ID (immutable)
     * Preferred method for object deletion (stable reference)
     */
    deleteObjectById(objectId) {
        const newConfig = removeObjectById(this._config, objectId);
        this.setConfig(newConfig);
    }
}
