// ConfigManager: Single Source of Truth for canvas state
// Manages CustomisableCanvasConfig with pure functional updates
import { updateObjectPosition, updateCanvasDimensions, addObject, removeObject, updateObjectByIndex } from './configUpdaters';
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
     * Update canvas dimensions (immutable)
     */
    resizeCanvas(width, height) {
        const newConfig = updateCanvasDimensions(this._config, width, height);
        this.setConfig(newConfig);
    }
    /**
     * Update object properties (immutable)
     */
    updateObject(objectIndex, updates) {
        const newConfig = updateObjectByIndex(this._config, objectIndex, updates);
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
}
//# sourceMappingURL=ConfigManager.js.map