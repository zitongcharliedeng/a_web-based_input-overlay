import { LinearInputIndicator } from '../viewWhichRendersConfigurationAndUi/canvasRenderer/canvasObjectTypes/LinearInputIndicator';
import { PlanarInputIndicator } from '../viewWhichRendersConfigurationAndUi/canvasRenderer/canvasObjectTypes/PlanarInputIndicator';
import { Text } from '../viewWhichRendersConfigurationAndUi/canvasRenderer/canvasObjectTypes/Text';
import { Image } from '../viewWhichRendersConfigurationAndUi/canvasRenderer/canvasObjectTypes/Image';
import { WebEmbed } from '../viewWhichRendersConfigurationAndUi/canvasRenderer/canvasObjectTypes/WebEmbed';
import type { CanvasObjectClass } from '../viewWhichRendersConfigurationAndUi/canvasRenderer/canvasObjectTypes/BaseCanvasObject';

// Import Zod-derived types (single source of truth)
export type { CanvasConfig, CanvasObjectConfig, OmniConfig } from './configSchema';

// Runtime registry for looking up classes by name
export const ALL_CANVAS_OBJECT_CLASSES_BY_CLASSNAME = {
	LinearInputIndicator,
	PlanarInputIndicator,
	Text,
	Image,
	WebEmbed
} as const satisfies Record<string, CanvasObjectClass<any>>;

export type CanvasObjectClassName = keyof typeof ALL_CANVAS_OBJECT_CLASSES_BY_CLASSNAME;
