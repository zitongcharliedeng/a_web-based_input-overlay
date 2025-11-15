import type { OmniConfig } from './OmniConfig';
interface SerializableObject {
    id: string;
    className?: string;
    canvasObjectType?: string;
    positionOnCanvas: {
        pxFromCanvasLeft: number;
        pxFromCanvasTop: number;
    };
    hitboxSize: {
        widthInPx: number;
        lengthInPx: number;
    };
    input?: unknown;
    processing?: unknown;
    display?: unknown;
    text?: string;
    textStyle?: unknown;
    shouldStroke?: boolean;
}
/**
 * Pure function: Serialize canvas objects to OmniConfig
 * @param objects - Array of canvas objects to serialize
 * @param canvas - Canvas element for dimensions
 * @returns Serialized OmniConfig (ready for localStorage or sharing)
 */
export declare function objectsToConfig(objects: SerializableObject[], canvas: HTMLCanvasElement): OmniConfig;
export declare function loadConfigFromJSON(jsonString: string): {
    success: true;
    config: OmniConfig;
} | {
    success: false;
    error: string;
};
export declare function loadConfigFromLocalStorage(key: string): {
    success: true;
    config: OmniConfig;
} | {
    success: false;
    error: string;
} | {
    success: false;
    error: 'not_found';
};
export {};
