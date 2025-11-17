import type { CustomisableCanvasConfig, CanvasObjectConfig } from './CustomisableCanvasConfig';
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
export declare class ConfigManager {
    private _config;
    private changeCallbacks;
    private saveCallback;
    constructor(initialConfig: CustomisableCanvasConfig);
    /**
     * Get current config (read-only)
     */
    get config(): CustomisableCanvasConfig;
    /**
     * Update config (immutable - sets new config)
     * Notifies all observers and triggers save
     */
    setConfig(newConfig: CustomisableCanvasConfig): void;
    /**
     * Subscribe to config changes
     * Returns unsubscribe function
     */
    onChange(callback: ConfigChangeCallback): () => void;
    /**
     * Set save callback (called when config changes)
     */
    onSave(callback: (config: CustomisableCanvasConfig) => void): void;
    /**
     * Update object position (immutable)
     */
    moveObject(objectIndex: number, x: number, y: number): void;
    /**
     * Update canvas dimensions (immutable)
     */
    resizeCanvas(width: number, height: number): void;
    /**
     * Update object properties (immutable)
     */
    updateObject(objectIndex: number, updates: Map<string, {
        path: string[];
        value: unknown;
    }>): void;
    /**
     * Add new object (immutable)
     */
    addObject(objectConfig: CanvasObjectConfig): void;
    /**
     * Remove object (immutable)
     */
    deleteObject(objectIndex: number): void;
}
export {};
