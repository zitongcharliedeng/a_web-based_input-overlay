/**
 * Canvas Object Registry - Single source of truth for all spawnable objects
 *
 * Each entry defines:
 * - type: Discriminated union key (e.g., "LinearInputIndicator")
 * - displayName: Human-readable name for UI
 * - className: Class name for identification
 * - templates: Array of spawnable templates with their configs
 */

import { LinearInputIndicator, defaultTemplateFor_LinearInputIndicator } from './LinearInputIndicator.js';
import { PlanarInputIndicator_Radial, defaultTemplateFor_PlanarInputIndicator } from './PlanarInputIndicator_Radial.js';
import { Text, defaultTemplateFor_Text } from './Text.js';
import { ImageObject, defaultTemplateFor_Image } from './Image.js';
import { WebEmbed, defaultTemplateFor_WebEmbed } from './WebEmbed.js';

export interface SpawnTemplate {
	name: string; // e.g., "DEFAULT_LinearInputIndicator"
	displayName: string; // e.g., "DEFAULT"
	create: (x: number, y: number) => any; // Factory function
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
				create: (x: number, y: number) => new LinearInputIndicator(x, y, 100, 100)
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
				create: (x: number, y: number) => new PlanarInputIndicator_Radial(x, y, 200, 200)
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
				create: (x: number, y: number) => new Text(x, y, 200, 30, { text: "New Text" })
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
				create: (x: number, y: number) => new ImageObject(y, x, 200, 200, { src: "https://via.placeholder.com/200" })
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
				create: (x: number, y: number) => new WebEmbed(x, y, 560, 315, { url: "https://www.youtube.com/embed/dQw4w9WgXcQ" })
			}
		]
	}
];
