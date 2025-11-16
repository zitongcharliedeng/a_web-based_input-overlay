import type { OmniConfig, CanvasObjectConfig } from './OmniConfig';

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

