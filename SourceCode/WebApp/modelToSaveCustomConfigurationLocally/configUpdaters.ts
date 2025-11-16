import type { OmniConfig, CanvasObjectConfig } from './OmniConfig';

/**
 * Helper: Set nested property in object (immutable)
 * Example: setNested({a: {b: {c: 1}}}, ['a', 'b', 'c'], 2) → {a: {b: {c: 2}}}
 * Uses generics to preserve type information
 */
function setNestedProperty<T>(obj: T, path: string[], value: unknown): T {
	if (path.length === 0) return value as T;

	const [head, ...rest] = path;
	if (!head) return obj;

	if (rest.length === 0) {
		// Base case: set the final key
		return { ...obj, [head]: value } as T;
	} else {
		// Recursive case: go deeper
		const nestedObj = (obj as Record<string, unknown>)[head];
		return {
			...obj,
			[head]: setNestedProperty(nestedObj || {}, rest, value)
		} as T;
	}
}


export function updateObjectPosition(
	config: OmniConfig,
	objectIndex: number,
	x: number,
	y: number
): OmniConfig {
	if (objectIndex < 0 || objectIndex >= config.objects.length) {
		return config;
	}

	const newObjects = [...config.objects];
	const targetObject = newObjects[objectIndex];
	if (!targetObject) return config;

	// Extract type key and inner config from NixOS wrapper
	const entries = Object.entries(targetObject);
	const entry = entries[0];
	if (!entry) return config;
	const [typeKey, innerConfig] = entry;
	if (!typeKey || !innerConfig) return config;

	// Update inner config with new position
	const updatedInnerConfig = {
		...innerConfig,
		positionOnCanvas: { pxFromCanvasLeft: x, pxFromCanvasTop: y }
	};

	// Rewrap in NixOS format
	newObjects[objectIndex] = { [typeKey]: updatedInnerConfig } as CanvasObjectConfig;

	return { ...config, objects: newObjects };
}


export function updateCanvasDimensions(
	config: OmniConfig,
	width: number,
	height: number
): OmniConfig {
	return {
		...config,
		canvas: {
			...config.canvas,
			width,
			height
		}
	};
}

export function addObject(
	config: OmniConfig,
	objectConfig: CanvasObjectConfig
): OmniConfig {
	return {
		...config,
		objects: [...config.objects, objectConfig]
	};
}

export function removeObject(
	config: OmniConfig,
	objectIndex: number
): OmniConfig {
	if (objectIndex < 0 || objectIndex >= config.objects.length) {
		return config;
	}

	return {
		...config,
		objects: config.objects.filter((_, i) => i !== objectIndex)
	};
}

