import type { ConfigManager } from '../../modelToSaveCustomConfigurationLocally/ConfigManager';
import { ALL_CANVAS_OBJECT_CLASSES_BY_CLASSNAME, type CanvasObjectClassName, type CanvasObjectConfig } from '../../modelToSaveCustomConfigurationLocally/OmniConfig';
import {
	LinearInputIndicatorSchema,
	PlanarInputIndicatorSchema,
	TextSchema,
	ImageSchema,
	WebEmbedSchema
} from '../../modelToSaveCustomConfigurationLocally/configSchema';
import { z } from 'zod';

interface SpawnMenuItem {
	label: string;
	action: () => void;
}

// Map class names to their Zod schemas
const CANVAS_OBJECT_SCHEMAS: Record<CanvasObjectClassName, z.ZodSchema<any>> = {
	LinearInputIndicator: LinearInputIndicatorSchema,
	PlanarInputIndicator: PlanarInputIndicatorSchema,
	Text: TextSchema,
	Image: ImageSchema,
	WebEmbed: WebEmbedSchema
};

export class SpawnMenu {
	private menuElement: HTMLDivElement | null = null;
	private configManager: ConfigManager;
	private mouseX: number = 0;
	private mouseY: number = 0;

	constructor(configManager: ConfigManager) {
		this.configManager = configManager;
	}

	show(x: number, y: number): void {
		this.hide(); // Clear any existing menu

		// Store mouse position for spawning objects at this location
		this.mouseX = x;
		this.mouseY = y;

		this.menuElement = document.createElement('div');
		this.menuElement.style.position = 'absolute';
		this.menuElement.style.left = `${x}px`;
		this.menuElement.style.top = `${y}px`;
		this.menuElement.style.backgroundColor = '#2a2a2a';
		this.menuElement.style.border = '1px solid #555';
		this.menuElement.style.borderRadius = '4px';
		this.menuElement.style.padding = '8px 0';
		this.menuElement.style.zIndex = '10000';
		this.menuElement.style.minWidth = '200px';
		this.menuElement.style.boxShadow = '0 4px 8px rgba(0,0,0,0.5)';
		this.menuElement.style.fontFamily = 'Arial, sans-serif';
		this.menuElement.style.fontSize = '14px';
		this.menuElement.style.color = '#eee';

		const menuItems: SpawnMenuItem[] = [];
		for (const className in ALL_CANVAS_OBJECT_CLASSES_BY_CLASSNAME) {
			menuItems.push({
				label: className,
				action: () => {
					const schema = CANVAS_OBJECT_SCHEMAS[className as CanvasObjectClassName];
					if (!schema) {
						console.error(`No schema found for ${className}`);
						return;
					}

						// Use Zod to generate complete defaults (with default position, NOT mouse position)
					const innerConfig = schema.parse({});

					// Wrap in NixOS-style discriminated union
					const config = { [className]: innerConfig } as CanvasObjectConfig;
					this.configManager.addObject(config);
				}
			});
		}

		menuItems.forEach((item) => {
			const itemElement = document.createElement('div');
			itemElement.textContent = item.label;
			itemElement.style.padding = '8px 16px';
			itemElement.style.cursor = 'pointer';
			itemElement.style.userSelect = 'none';

			itemElement.addEventListener('mouseenter', () => {
				itemElement.style.backgroundColor = '#3a3a3a';
			});
			itemElement.addEventListener('mouseleave', () => {
				itemElement.style.backgroundColor = 'transparent';
			});
			itemElement.addEventListener('click', () => {
				item.action();
				this.hide();
			});

			this.menuElement?.appendChild(itemElement);
		});

		document.body.appendChild(this.menuElement);

		// Close menu when clicking outside
		const closeHandler = (e: MouseEvent) => {
			if (this.menuElement && !this.menuElement.contains(e.target as Node)) {
				this.hide();
				document.removeEventListener('mousedown', closeHandler);
			}
		};
		// Delay to avoid immediate closure from the same click that opened it
		setTimeout(() => {
			document.addEventListener('mousedown', closeHandler);
		}, 100);
	}

	hide(): void {
		if (this.menuElement && this.menuElement.parentNode) {
			this.menuElement.parentNode.removeChild(this.menuElement);
			this.menuElement = null;
		}
	}
}
