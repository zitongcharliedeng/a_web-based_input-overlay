// Pure serialization functions: CanvasObjects → OmniConfig
// No side effects, no class dependencies, fully composable

import type { OmniConfig, CanvasConfig } from './OmniConfig.js';

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
		const base = {
			type: obj.className || obj.canvasObjectType || 'unknown',
			x: obj.positionOnCanvas.pxFromCanvasLeft,
			y: obj.positionOnCanvas.pxFromCanvasTop,
			width: obj.hitboxSize.widthInPx,
			height: obj.hitboxSize.lengthInPx
		};

		// Serialize type-specific properties (input, processing, display, text, etc.)
		const props: Record<string, unknown> = {};
		if (obj.input !== undefined) props.input = serializeValue(obj.input);
		if (obj.processing !== undefined) props.processing = serializeValue(obj.processing);
		if (obj.display !== undefined) props.display = serializeValue(obj.display);
		if (obj.text !== undefined) props.text = obj.text;
		if (obj.textStyle !== undefined) props.textStyle = obj.textStyle;
		if (obj.shouldStroke !== undefined) props.shouldStroke = obj.shouldStroke;

		return { ...base, ...props };
	});

	return {
		canvas: canvasConfig,
		objects: serializedObjects as any  // Type system doesn't understand discriminated union here
	};
}

/**
 * Pure function: Deep serialize a value (handles Images, arrays, objects)
 * @param value - Value to serialize
 * @returns Serialized value (plain JS types + strings for Images)
 */
export function serializeValue(value: unknown): unknown {
	// Primitive types - return as-is
	if (value === null || value === undefined) return value;
	if (typeof value !== 'object') return value;

	// HTMLImageElement - convert to src URL
	if (value instanceof Image) {
		return value.src || 'https://raw.githubusercontent.com/zitongcharliedeng/a_web-based_input-overlay/refs/heads/master/webApp/browserInputOverlayView/_assets/images/KeyDefault.png';
	}

	// Array - recursively serialize elements
	if (Array.isArray(value)) {
		return value.map(item => serializeValue(item));
	}

	// Plain object - recursively serialize properties
	const result: Record<string, unknown> = {};
	for (const key in value) {
		if (Object.prototype.hasOwnProperty.call(value, key)) {
			result[key] = serializeValue((value as Record<string, unknown>)[key]);
		}
	}
	return result;
}
