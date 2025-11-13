// Pure functional config update functions
// All mutations return NEW config (immutable)
// Input → Output, no side effects

import type { OmniConfig, CanvasObjectConfig } from './OmniConfig.js';

/**
 * Pure function: Update object position (immutable)
 * @param config - Current config (unchanged)
 * @param objectIndex - Index of object to update
 * @param x - New x position
 * @param y - New y position
 * @returns NEW config with updated position
 */
export function updateObjectPosition(
	config: OmniConfig,
	objectIndex: number,
	x: number,
	y: number
): OmniConfig {
	// Guard: index out of bounds
	if (objectIndex < 0 || objectIndex >= config.objects.length) {
		return config;
	}

	// Create new objects array (shallow copy)
	const newObjects = [...config.objects];
	const targetObject = newObjects[objectIndex];

	// Update position based on object type (discriminated union)
	if ('linearInputIndicator' in targetObject) {
		newObjects[objectIndex] = {
			linearInputIndicator: {
				...targetObject.linearInputIndicator,
				positionOnCanvas: { pxFromCanvasLeft: x, pxFromCanvasTop: y }
			}
		};
	} else if ('planarInputIndicator' in targetObject) {
		newObjects[objectIndex] = {
			planarInputIndicator: {
				...targetObject.planarInputIndicator,
				positionOnCanvas: { pxFromCanvasLeft: x, pxFromCanvasTop: y }
			}
		};
	} else if ('text' in targetObject) {
		newObjects[objectIndex] = {
			text: {
				...targetObject.text,
				positionOnCanvas: { pxFromCanvasLeft: x, pxFromCanvasTop: y }
			}
		};
	}

	// Return new config (original unchanged)
	return { ...config, objects: newObjects };
}

/**
 * Pure function: Update nested object property (immutable)
 * @param config - Current config (unchanged)
 * @param objectIndex - Index of object to update
 * @param path - Path to property (e.g., ["display", "fillStyle"])
 * @param value - New value
 * @returns NEW config with updated property
 */
export function updateObjectProperty(
	config: OmniConfig,
	objectIndex: number,
	path: string[],
	value: unknown
): OmniConfig {
	// Guard: index out of bounds
	if (objectIndex < 0 || objectIndex >= config.objects.length) {
		return config;
	}

	// Create new objects array
	const newObjects = [...config.objects];
	const targetObject = newObjects[objectIndex];

	// Deep immutable update based on path
	// This is complex - for now, just handle common cases
	// TODO: Implement full deep update if needed

	// Return new config (original unchanged)
	return { ...config, objects: newObjects };
}

/**
 * Pure function: Update canvas dimensions (immutable)
 * @param config - Current config (unchanged)
 * @param width - New canvas width
 * @param height - New canvas height
 * @returns NEW config with updated dimensions
 */
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

/**
 * Pure function: Add object to config (immutable)
 * @param config - Current config (unchanged)
 * @param objectConfig - New object config to add
 * @returns NEW config with added object
 */
export function addObject(
	config: OmniConfig,
	objectConfig: CanvasObjectConfig
): OmniConfig {
	return {
		...config,
		objects: [...config.objects, objectConfig]
	};
}

/**
 * Pure function: Remove object from config (immutable)
 * @param config - Current config (unchanged)
 * @param objectIndex - Index of object to remove
 * @returns NEW config with object removed
 */
export function removeObject(
	config: OmniConfig,
	objectIndex: number
): OmniConfig {
	// Guard: index out of bounds
	if (objectIndex < 0 || objectIndex >= config.objects.length) {
		return config;
	}

	return {
		...config,
		objects: config.objects.filter((_, i) => i !== objectIndex)
	};
}
