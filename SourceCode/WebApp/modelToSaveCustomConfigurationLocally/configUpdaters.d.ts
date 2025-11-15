import type { OmniConfig, CanvasObjectConfig } from './OmniConfig';
export declare function updateObjectPosition(config: OmniConfig, objectIndex: number, x: number, y: number): OmniConfig;
/**
 * Update object property by ID (deep nested update)
 * This is the core function for PropertyEdit mutations
 */
export declare function updateObjectPropertyById(config: OmniConfig, objectId: string, path: string[], value: unknown): OmniConfig;
export declare function updateCanvasDimensions(config: OmniConfig, width: number, height: number): OmniConfig;
export declare function addObject(config: OmniConfig, objectConfig: CanvasObjectConfig): OmniConfig;
export declare function removeObject(config: OmniConfig, objectIndex: number): OmniConfig;
/**
 * Remove object by ID (immutable)
 */
export declare function removeObjectById(config: OmniConfig, objectId: string): OmniConfig;
