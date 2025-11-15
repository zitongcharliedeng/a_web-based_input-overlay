import type { OmniConfig, CanvasObjectConfig } from './OmniConfig';
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
export declare class ConfigManager {
    private _config;
    private changeCallbacks;
    private saveCallback;
    constructor(initialConfig: OmniConfig);
    /**
     * Get current config (read-only)
     */
    get config(): OmniConfig;
    /**
     * Update config (immutable - sets new config)
     * Notifies all observers and triggers save
     */
    setConfig(newConfig: OmniConfig): void;
    /**
     * Subscribe to config changes
     * Returns unsubscribe function
     */
    onChange(callback: ConfigChangeCallback): () => void;
    /**
     * Set save callback (called when config changes)
     */
    onSave(callback: (config: OmniConfig) => void): void;
    /**
     * Update object position (immutable)
     */
    moveObject(objectIndex: number, x: number, y: number): void;
    /**
     * Update object property by ID (immutable deep update)
     * This is the proper way for PropertyEdit to mutate objects
     */
    updateObjectProperty(objectId: string, path: string[], value: unknown): void;
    /**
     * Update canvas dimensions (immutable)
     */
    resizeCanvas(width: number, height: number): void;
    /**
     * Add new object (immutable)
     */
    addObject(objectConfig: CanvasObjectConfig): void;
    /**
     * Remove object (immutable)
     */
    deleteObject(objectIndex: number): void;
    /**
     * Remove object by ID (immutable)
     * Preferred method for object deletion (stable reference)
     */
    deleteObjectById(objectId: string): void;
}
export {};
