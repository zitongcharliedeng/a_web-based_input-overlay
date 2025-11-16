import type { OmniConfig, CanvasConfig, CanvasObjectConfig, LinearInputIndicatorConfig, PlanarInputIndicatorConfig, TextConfig, ImageConfig, WebEmbedConfig } from './OmniConfig';
import { validateOmniConfig } from './configSchema';

// Type for objects we're serializing (runtime CanvasObject instances, avoiding circular import)
interface SerializableObject {
	canvasObjectType: string;
	positionOnCanvas: { pxFromCanvasLeft: number; pxFromCanvasTop: number };
	hitboxSize: { widthInPx: number; lengthInPx: number };
	layerLevel: number;
	// All other properties exist on objects, TypeScript just needs to know the base shape
	[key: string]: unknown;
}


/**
 * Pure function: Serialize canvas objects to OmniConfig
 * @param objects - Array of canvas objects to serialize
 * @param canvas - Canvas element for dimensions
 * @returns Serialized OmniConfig (ready for localStorage or sharing)
 */
export function objectsToConfig(objects: SerializableObject[], canvas: HTMLCanvasElement): OmniConfig {
	const canvasConfig: CanvasConfig = {
		width: canvas.width,
		height: canvas.height,
		backgroundColor: 'transparent'
	};

	const serializedObjects: CanvasObjectConfig[] = objects.map(obj => {
		const type = obj.canvasObjectType;
		if (!type) throw new Error('Object missing canvasObjectType');

		// Just copy the object properties directly - they're already complete
		if (type === 'linearInputIndicator') {
			return { linearInputIndicator: obj };
		} else if (type === 'planarInputIndicator') {
			return { planarInputIndicator: obj };
		} else if (type === 'text') {
			return { text: obj };
		} else if (type === 'image') {
			return { image: obj };
		} else if (type === 'webEmbed') {
			return { webEmbed: obj };
		}

		throw new Error(`Unknown canvasObjectType: ${type}`);
	});

	return {
		canvas: canvasConfig,
		objects: serializedObjects
	};
}

export function loadConfigFromJSON(jsonString: string): { success: true; config: OmniConfig } | { success: false; error: string } {
	try {
		const parsed = JSON.parse(jsonString);
		const validationResult = validateOmniConfig(parsed);

		if (!validationResult.success) {
			const errorMessages = validationResult.error.issues.map(issue =>
				`${issue.path.join('.')}: ${issue.message}`
			).join('; ');
			return { success: false, error: `Config validation failed: ${errorMessages}` };
		}

		return { success: true, config: validationResult.data as OmniConfig };
	} catch (e) {
		if (e instanceof SyntaxError) {
			return { success: false, error: `Invalid JSON: ${e.message}` };
		}
		return { success: false, error: `Unknown error: ${String(e)}` };
	}
}

export function loadConfigFromLocalStorage(key: string): { success: true; config: OmniConfig } | { success: false; error: string } | { success: false; error: 'not_found' } {
	const stored = localStorage.getItem(key);
	if (!stored) {
		return { success: false, error: 'not_found' };
	}
	return loadConfigFromJSON(stored);
}

