/**
 * Barrel file for canvas object types
 * Auto-generates registry from class static metadata
 */

import type { CanvasObjectConfig } from '../../../modelToSaveCustomConfigurationLocally/OmniConfig';
import type { CanvasObject } from './BaseCanvasObject';

// Export base class
export type { CanvasObject } from './BaseCanvasObject';

// Export all canvas object classes
export { LinearInputIndicator } from './LinearInputIndicator';
export { PlanarInputIndicator_Radial } from './PlanarInputIndicator_Radial';
export { Text } from './Text';
export { ImageObject } from './Image';
export { WebEmbed } from './WebEmbed';

// Import classes for registry generation
import { LinearInputIndicator } from './LinearInputIndicator';
import { PlanarInputIndicator_Radial } from './PlanarInputIndicator_Radial';
import { Text } from './Text';
import { ImageObject } from './Image';
import { WebEmbed } from './WebEmbed';

/**
 * Canvas object class interface (enforces static metadata)
 * Each class unwraps its own NixOS-style config wrapper
 */
export interface CanvasObjectClass {
	readonly TYPE: string;
	readonly DISPLAY_NAME: string;
	fromConfig: (config: CanvasObjectConfig, objArrayIdx: number) => CanvasObject;
}

/**
 * All registered canvas object classes
 * Adding new class: just export it above, add to this array
 */
export const CANVAS_OBJECT_CLASSES: ReadonlyArray<CanvasObjectClass> = [
	LinearInputIndicator,
	PlanarInputIndicator_Radial,
	Text,
	ImageObject,
	WebEmbed
] as const;

/**
 * Registry entry (generated from class metadata)
 */
export interface RegistryEntry {
	type: string;
	displayName: string;
	fromConfig: (config: CanvasObjectConfig, objArrayIdx: number) => CanvasObject;
}

/**
 * Auto-generated registry from class static metadata
 * Single source of truth - metadata lives on classes
 */
export const CANVAS_OBJECT_REGISTRY: ReadonlyArray<RegistryEntry> = CANVAS_OBJECT_CLASSES.map(cls => ({
	type: cls.TYPE,
	displayName: cls.DISPLAY_NAME,
	fromConfig: cls.fromConfig.bind(cls)
}));
