/**
 * CanvasRenderer: Pure MVC View
 *
 * Responsibilities:
 * - Deserialize OmniConfig to canvas objects
 * - Render canvas objects
 * - Call update() on objects
 * - NO state management (stateless - reads from config parameter)
 * - NO input handling
 * - NO caching (pure function - rebuild every frame)
 *
 * Phase2: Removed cachedObjects, deserializes from config every frame
 */
import type { OmniConfig, CanvasObjectConfig } from '../../modelToSaveCustomConfigurationLocally/OmniConfig';
import type { CanvasObject } from './canvasObjectTypes/index';
export declare class CanvasRenderer {
    private canvas;
    private ctx;
    private deserializer;
    private cache;
    constructor(canvas: HTMLCanvasElement, deserializer: (objData: CanvasObjectConfig) => CanvasObject);
    /**
     * Deserialize config to canvas objects (pure function)
     */
    private deserializeObjects;
    /**
     * Update all objects (called before render)
     * Returns deserialized objects for interaction handling
     * Caches objects - only rebuilds when config reference changes (preserves runtime state like opacity for fades)
     * Contract: ConfigManager must return new config reference on mutation (immutability)
     */
    update(config: OmniConfig, delta: number): readonly CanvasObject[];
    /**
     * Render all objects to canvas from config (pure MVC)
     */
    render(objects: CanvasObject[]): void;
    /**
     * Draw overlay (like hitboxes) on top of objects
     */
    renderOverlay(drawFn: (canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D) => void): void;
    /**
     * Render debug overlay (hitboxes for all objects)
     * Phase3: Moved from InteractionController (MVC violation fix)
     */
    renderDebugHitboxes(objects: CanvasObject[]): void;
}
