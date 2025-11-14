import type { OmniConfig, CanvasConfig, LinearInputIndicatorConfig, PlanarInputIndicatorConfig, TextConfig } from './OmniConfig.js';
import { defaultTemplateFor_LinearInputIndicator } from '../sceneRender/CanvasObjects/LinearInputIndicator.js';
import { defaultTemplateFor_PlanarInputIndicator } from '../sceneRender/CanvasObjects/PlanarInputIndicator_Radial.js';
import { defaultTemplateFor_Text } from '../sceneRender/CanvasObjects/Text.js';
import { defaultTemplateFor_Image } from '../sceneRender/CanvasObjects/Image.js';
import { defaultTemplateFor_WebEmbed } from '../sceneRender/CanvasObjects/WebEmbed.js';
import { validateOmniConfig } from './configSchema.js';

// Type for objects we're serializing (avoid circular dependencies)
interface SerializableObject {
	className?: string;
	canvasObjectType?: string;
	positionOnCanvas: { pxFromCanvasLeft: number; pxFromCanvasTop: number };
	hitboxSize: { widthInPx: number; lengthInPx: number };
	input?: unknown;
	processing?: unknown;
	display?: unknown;
	text?: string;
	textStyle?: unknown;
	shouldStroke?: boolean;
}


/**
 * Pure function: Serialize scene objects to OmniConfig
 * @param objects - Array of canvas objects to serialize
 * @param canvas - Canvas element for dimensions
 * @returns Serialized OmniConfig (ready for localStorage or sharing)
 */
export function sceneToConfig(objects: SerializableObject[], canvas: HTMLCanvasElement): OmniConfig {
	const canvasConfig: CanvasConfig = {
		width: canvas.width,
		height: canvas.height,
		backgroundColor: 'transparent'
	};

	const serializedObjects = objects.map(obj => {
		const type = obj.className || obj.canvasObjectType || 'unknown';
		const positionOnCanvas = {
			pxFromCanvasLeft: obj.positionOnCanvas.pxFromCanvasLeft,
			pxFromCanvasTop: obj.positionOnCanvas.pxFromCanvasTop
		};
		const hitboxSize = {
			widthInPx: obj.hitboxSize.widthInPx,
			lengthInPx: obj.hitboxSize.lengthInPx
		};

		// Get layerLevel (default to 10 if not present)
		const layerLevel = (obj as { layerLevel?: number }).layerLevel ?? 10;

		// Create discriminated union based on type
		// Deep merge defaults with actual values to ensure all nested fields present
		if (type === 'LinearInputIndicator') {
			const objInput = (obj.input && typeof obj.input === 'object' ? obj.input : {}) as Partial<LinearInputIndicatorConfig['input']>;
			const objProcessing = (obj.processing && typeof obj.processing === 'object' ? obj.processing : {}) as Partial<LinearInputIndicatorConfig['processing']>;
			const objDisplay = (obj.display && typeof obj.display === 'object' ? obj.display : {}) as Partial<LinearInputIndicatorConfig['display']>;

			const linearConfig: LinearInputIndicatorConfig = {
				id: obj.id,
				positionOnCanvas,
				hitboxSize,
				layerLevel,
				input: {
					keyboard: { ...defaultTemplateFor_LinearInputIndicator.input.keyboard, ...objInput.keyboard },
					mouse: { ...defaultTemplateFor_LinearInputIndicator.input.mouse, ...objInput.mouse },
					gamepad: {
						stick: { ...defaultTemplateFor_LinearInputIndicator.input.gamepad.stick, ...objInput.gamepad?.stick },
						button: { ...defaultTemplateFor_LinearInputIndicator.input.gamepad.button, ...objInput.gamepad?.button }
					}
				},
				processing: { ...defaultTemplateFor_LinearInputIndicator.processing, ...objProcessing },
				display: {
					...defaultTemplateFor_LinearInputIndicator.display,
					...objDisplay,
					fontStyle: { ...defaultTemplateFor_LinearInputIndicator.display.fontStyle, ...objDisplay.fontStyle }
				}
			};
			return { linearInputIndicator: linearConfig };
		} else if (type === 'PlanarInputIndicator_Radial') {
			const objInput = (obj.input && typeof obj.input === 'object' ? obj.input : {}) as Partial<PlanarInputIndicatorConfig['input']>;
			const objProcessing = (obj.processing && typeof obj.processing === 'object' ? obj.processing : {}) as Partial<PlanarInputIndicatorConfig['processing']>;
			const objDisplay = (obj.display && typeof obj.display === 'object' ? obj.display : {}) as Partial<PlanarInputIndicatorConfig['display']>;

			const planarConfig: PlanarInputIndicatorConfig = {
				id: obj.id,
				positionOnCanvas,
				hitboxSize,
				layerLevel,
				input: { ...defaultTemplateFor_PlanarInputIndicator.input, ...objInput },
				processing: { ...defaultTemplateFor_PlanarInputIndicator.processing, ...objProcessing },
				display: { ...defaultTemplateFor_PlanarInputIndicator.display, ...objDisplay }
			};
			return { planarInputIndicator: planarConfig };
		} else if (type === 'Text') {
			const objTextStyle = (obj.textStyle && typeof obj.textStyle === 'object' ? obj.textStyle : {}) as Partial<TextConfig['textStyle']>;

			const textConfig: TextConfig = {
				id: obj.id,
				positionOnCanvas,
				hitboxSize,
				layerLevel,
				text: obj.text || "",
				textStyle: { ...defaultTemplateFor_Text.textStyle, ...objTextStyle },
				shouldStroke: obj.shouldStroke ?? true
			};
			return { text: textConfig };
		} else if (type === 'Image') {
			const imageConfig: import('./OmniConfig.js').ImageConfig = {
				id: obj.id,
				positionOnCanvas,
				hitboxSize,
				layerLevel,
				src: (obj as { src?: string }).src || defaultTemplateFor_Image.src,
				opacity: (obj as { opacity?: number }).opacity ?? defaultTemplateFor_Image.opacity
			};
			return { image: imageConfig };
		} else if (type === 'WebEmbed') {
			const webEmbedConfig: import('./OmniConfig.js').WebEmbedConfig = {
				id: obj.id,
				positionOnCanvas,
				hitboxSize,
				layerLevel,
				url: (obj as { url?: string }).url || defaultTemplateFor_WebEmbed.url,
				opacity: (obj as { opacity?: number }).opacity ?? defaultTemplateFor_WebEmbed.opacity
			};
			return { webEmbed: webEmbedConfig };
		}

		// Unknown type - shouldn't happen, but return Text as fallback
		const fallbackConfig: TextConfig = {
			...defaultTemplateFor_Text,
			positionOnCanvas,
			hitboxSize,
			layerLevel,
			text: "Unknown object"
		};
		return { text: fallbackConfig };
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

		return { success: true, config: validationResult.data };
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

