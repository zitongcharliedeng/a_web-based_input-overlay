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
import type { CanvasObjectConfig } from '../../persistentData/OmniConfig.js';

export interface SpawnTemplate {
	name: string; // e.g., "DEFAULT_LinearInputIndicator"
	displayName: string; // e.g., "DEFAULT"
	createConfig: (x: number, y: number) => CanvasObjectConfig; // Factory creates OmniConfig
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
				createConfig: (x: number, y: number) => ({
					linearInputIndicator: {
						...defaultTemplateFor_LinearInputIndicator,
						positionOnCanvas: { pxFromCanvasLeft: x, pxFromCanvasTop: y },
						hitboxSize: { widthInPx: 100, lengthInPx: 100 }
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
				createConfig: (x: number, y: number) => ({
					planarInputIndicator: {
						...defaultTemplateFor_PlanarInputIndicator,
						positionOnCanvas: { pxFromCanvasLeft: x, pxFromCanvasTop: y },
						hitboxSize: { widthInPx: 200, lengthInPx: 200 }
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
				createConfig: (x: number, y: number) => ({
					text: {
						...defaultTemplateFor_Text,
						positionOnCanvas: { pxFromCanvasLeft: x, pxFromCanvasTop: y },
						hitboxSize: { widthInPx: 200, lengthInPx: 30 },
						text: "New Text"
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
				createConfig: (x: number, y: number) => ({
					image: {
						...defaultTemplateFor_Image,
						positionOnCanvas: { pxFromCanvasLeft: x, pxFromCanvasTop: y },
						hitboxSize: { widthInPx: 200, lengthInPx: 200 },
						src: "https://via.placeholder.com/200"
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
				createConfig: (x: number, y: number) => ({
					webEmbed: {
						...defaultTemplateFor_WebEmbed,
						positionOnCanvas: { pxFromCanvasLeft: x, pxFromCanvasTop: y },
						hitboxSize: { widthInPx: 560, lengthInPx: 315 },
						layerLevel: 10,
						url: "https://www.youtube.com/embed/dQw4w9WgXcQ"
					}
				})
			}
		]
	}
];
