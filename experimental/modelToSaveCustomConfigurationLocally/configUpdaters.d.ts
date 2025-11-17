import type { CustomisableCanvasConfig, CanvasObjectConfig } from './CustomisableCanvasConfig';
export declare function updateObjectPosition(config: CustomisableCanvasConfig, objectIndex: number, x: number, y: number): CustomisableCanvasConfig;
export declare function updateCanvasDimensions(config: CustomisableCanvasConfig, width: number, height: number): CustomisableCanvasConfig;
export declare function addObject(config: CustomisableCanvasConfig, objectConfig: CanvasObjectConfig): CustomisableCanvasConfig;
export declare function removeObject(config: CustomisableCanvasConfig, objectIndex: number): CustomisableCanvasConfig;
export declare function updateObjectByIndex(config: CustomisableCanvasConfig, objectIndex: number, updates: Map<string, {
    path: string[];
    value: unknown;
}>): CustomisableCanvasConfig;
