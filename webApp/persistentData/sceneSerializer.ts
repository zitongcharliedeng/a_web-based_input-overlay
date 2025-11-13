// Pure serialization functions: CanvasObjects → OmniConfig
// No side effects, no class dependencies, fully composable

import type { OmniConfig, CanvasConfig, LinearInputIndicatorConfig, PlanarInputIndicatorConfig, TextConfig } from './OmniConfig.js';
import {
	defaultTemplateFor_LinearInputIndicator,
	defaultTemplateFor_PlanarInputIndicator,
	defaultTemplateFor_Text,
	defaultTemplateFor_Image
} from './OmniConfig.js';

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
		// No complex serialization needed - just spread defaults and actual values
		if (type === 'LinearInputIndicator') {
			const linearConfig: LinearInputIndicatorConfig = {
				positionOnCanvas,
				hitboxSize,
				layerLevel,
				input: { ...defaultTemplateFor_LinearInputIndicator.input, ...(obj.input && typeof obj.input === 'object' ? obj.input : {}) },
				processing: { ...defaultTemplateFor_LinearInputIndicator.processing, ...(obj.processing && typeof obj.processing === 'object' ? obj.processing : {}) },
				display: { ...defaultTemplateFor_LinearInputIndicator.display, ...(obj.display && typeof obj.display === 'object' ? obj.display : {}) }
			};
			return { linearInputIndicator: linearConfig };
		} else if (type === 'PlanarInputIndicator_Radial') {
			const planarConfig: PlanarInputIndicatorConfig = {
				positionOnCanvas,
				hitboxSize,
				layerLevel,
				input: { ...defaultTemplateFor_PlanarInputIndicator.input, ...(obj.input && typeof obj.input === 'object' ? obj.input : {}) },
				processing: { ...defaultTemplateFor_PlanarInputIndicator.processing, ...(obj.processing && typeof obj.processing === 'object' ? obj.processing : {}) },
				display: { ...defaultTemplateFor_PlanarInputIndicator.display, ...(obj.display && typeof obj.display === 'object' ? obj.display : {}) }
			};
			return { planarInputIndicator: planarConfig };
		} else if (type === 'Text') {
			const textConfig: TextConfig = {
				positionOnCanvas,
				hitboxSize,
				layerLevel,
				text: obj.text || "",
				textStyle: { ...defaultTemplateFor_Text.textStyle, ...(obj.textStyle && typeof obj.textStyle === 'object' ? obj.textStyle : {}) },
				shouldStroke: obj.shouldStroke ?? true
			};
			return { text: textConfig };
		} else if (type === 'Image') {
			const imageConfig: import('./OmniConfig.js').ImageConfig = {
				positionOnCanvas,
				hitboxSize,
				layerLevel,
				src: (obj as { src?: string }).src || defaultTemplateFor_Image.src,
				opacity: (obj as { opacity?: number }).opacity ?? defaultTemplateFor_Image.opacity
			};
			return { image: imageConfig };
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

