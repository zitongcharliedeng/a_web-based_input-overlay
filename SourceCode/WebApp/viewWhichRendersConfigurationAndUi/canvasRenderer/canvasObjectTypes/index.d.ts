/**
 * Barrel file for canvas object types
 * Auto-generates registry from class static metadata
 */
import type { CanvasObjectConfig } from '../../../modelToSaveCustomConfigurationLocally/OmniConfig';
import type { CanvasObject } from './BaseCanvasObject';
export type { CanvasObject } from './BaseCanvasObject';
export { LinearInputIndicator } from './LinearInputIndicator';
export { PlanarInputIndicator_Radial } from './PlanarInputIndicator_Radial';
export { Text } from './Text';
export { ImageObject } from './Image';
export { WebEmbed } from './WebEmbed';
/**
 * Canvas object class interface (enforces static metadata)
 */
export interface CanvasObjectClass {
    readonly TYPE: string;
    readonly DISPLAY_NAME: string;
    readonly DEFAULT_TEMPLATE: unknown;
    fromConfig: (config: CanvasObjectConfig) => CanvasObject;
}
/**
 * All registered canvas object classes
 * Adding new class: just export it above, add to this array
 */
export declare const CANVAS_OBJECT_CLASSES: ReadonlyArray<CanvasObjectClass>;
/**
 * Registry entry (generated from class metadata)
 */
export interface RegistryEntry {
    type: string;
    displayName: string;
    template: unknown;
    fromConfig: (config: CanvasObjectConfig) => CanvasObject;
}
/**
 * Auto-generated registry from class static metadata
 * Single source of truth - metadata lives on classes
 */
export declare const CANVAS_OBJECT_REGISTRY: ReadonlyArray<RegistryEntry>;
