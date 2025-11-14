/**
 * Canvas Object Registry - Single source of truth for all spawnable objects
 *
 * Each entry defines:
 * - type: Discriminated union key (e.g., "LinearInputIndicator")
 * - displayName: Human-readable name for UI
 * - className: Class name for identification
 * - templates: Array of spawnable templates with their configs
 *
 * ARCHITECTURE: Templates create OmniConfig objects (not runtime objects)
 * This ensures ConfigManager is the single source of truth.
 */

import { defaultTemplateFor_LinearInputIndicator } from './LinearInputIndicator.js';
import { defaultTemplateFor_PlanarInputIndicator } from './PlanarInputIndicator_Radial.js';
import { defaultTemplateFor_Text } from './Text.js';
import { defaultTemplateFor_Image } from './Image.js';
import { defaultTemplateFor_WebEmbed } from './WebEmbed.js';
import type { CanvasObjectConfig } from '../../../modelToSaveCustomConfigurationLocally/OmniConfig.js';

export interface SpawnTemplate {
	name: string; // e.g., "DEFAULT_LinearInputIndicator"
	displayName: string; // e.g., "DEFAULT"
	createConfig: () => CanvasObjectConfig; // Factory creates OmniConfig with default position
}

export interface CanvasObjectRegistryEntry {
	type: string; // Type name for serialization
	displayName: string; // Display name in UI
	className: string; // Class name for identification
	templates: SpawnTemplate[];
}

export const CANVAS_OBJECT_REGISTRY: CanvasObjectRegistryEntry[] = [
	{
		type: 'LinearInputIndicator',
		displayName: 'LinearInputIndicator',
		className: 'LinearInputIndicator',
		templates: [
			{
				name: 'DEFAULT_LinearInputIndicator',
				displayName: 'DEFAULT',
				createConfig: () => ({
					linearInputIndicator: {
						id: crypto.randomUUID(),
						positionOnCanvas: { pxFromCanvasLeft: 100, pxFromCanvasTop: 100 },
						hitboxSize: { widthInPx: 100, lengthInPx: 100 },
						layerLevel: 10,
						...defaultTemplateFor_LinearInputIndicator
					}
				})
			}
		]
	},
	{
		type: 'PlanarInputIndicator_Radial',
		displayName: 'PlanarInputIndicator_Radial',
		className: 'PlanarInputIndicator_Radial',
		templates: [
			{
				name: 'DEFAULT_PlanarInputIndicator_Radial',
				displayName: 'DEFAULT',
				createConfig: () => ({
					planarInputIndicator: {
						id: crypto.randomUUID(),
						positionOnCanvas: { pxFromCanvasLeft: 100, pxFromCanvasTop: 100 },
						hitboxSize: { widthInPx: 200, lengthInPx: 200 },
						layerLevel: 10,
						...defaultTemplateFor_PlanarInputIndicator
					}
				})
			}
		]
	},
	{
		type: 'Text',
		displayName: 'Text',
		className: 'Text',
		templates: [
			{
				name: 'DEFAULT_Text',
				displayName: 'DEFAULT',
				createConfig: () => ({
					text: {
						id: crypto.randomUUID(),
						positionOnCanvas: { pxFromCanvasLeft: 100, pxFromCanvasTop: 100 },
						hitboxSize: { widthInPx: 200, lengthInPx: 30 },
						layerLevel: 20,
						...defaultTemplateFor_Text
					}
				})
			}
		]
	},
	{
		type: 'Image',
		displayName: 'Image',
		className: 'Image',
		templates: [
			{
				name: 'DEFAULT_Image',
				displayName: 'DEFAULT',
				createConfig: () => ({
					image: {
						id: crypto.randomUUID(),
						positionOnCanvas: { pxFromCanvasLeft: 100, pxFromCanvasTop: 100 },
						hitboxSize: { widthInPx: 200, lengthInPx: 200 },
						layerLevel: 0,
						...defaultTemplateFor_Image
					}
				})
			}
		]
	},
	{
		type: 'WebEmbed',
		displayName: 'WebEmbed',
		className: 'WebEmbed',
		templates: [
			{
				name: 'DEFAULT_WebEmbed',
				displayName: 'DEFAULT',
				createConfig: () => ({
					webEmbed: {
						id: crypto.randomUUID(),
						positionOnCanvas: { pxFromCanvasLeft: 100, pxFromCanvasTop: 100 },
						hitboxSize: { widthInPx: 560, lengthInPx: 315 },
						layerLevel: 10,
						...defaultTemplateFor_WebEmbed
					}
				})
			}
		]
	}
];
