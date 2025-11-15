import type { OmniConfig, CanvasObjectConfig } from './OmniConfig.js';

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

/**
 * Helper: Find object index by ID
 */
function findObjectIndexById(config: OmniConfig, objectId: string): number {
	return config.objects.findIndex(obj => obj.id === objectId);
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

	// Flat format: just spread and update position directly
	newObjects[objectIndex] = {
		...targetObject,
		positionOnCanvas: { pxFromCanvasLeft: x, pxFromCanvasTop: y }
	};

	return { ...config, objects: newObjects };
}

/**
 * Update object property by ID (deep nested update)
 * This is the core function for PropertyEdit mutations
 */
export function updateObjectPropertyById(
	config: OmniConfig,
	objectId: string,
	path: string[],
	value: unknown
): OmniConfig {
	const objectIndex = findObjectIndexById(config, objectId);

	if (objectIndex === -1) {
		console.error(`[configUpdaters] Object with id ${objectId} not found`);
		return config;
	}

	const newObjects = [...config.objects];
	const targetObject = newObjects[objectIndex];
	if (!targetObject) return config;

	// Flat format: just spread and update nested property directly
	newObjects[objectIndex] = setNestedProperty(targetObject, path, value);

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

/**
 * Remove object by ID (immutable)
 */
export function removeObjectById(
	config: OmniConfig,
	objectId: string
): OmniConfig {
	return {
		...config,
		objects: config.objects.filter(obj => obj.id !== objectId)
	};
}
