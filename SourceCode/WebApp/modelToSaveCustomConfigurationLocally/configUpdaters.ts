import type { CustomisableCanvasConfig, CanvasObjectConfig } from './CustomisableCanvasConfig';

export function updateObjectPosition(
	config: CustomisableCanvasConfig,
	objectIndex: number,
	x: number,
	y: number
): CustomisableCanvasConfig {
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
	config: CustomisableCanvasConfig,
	width: number,
	height: number
): CustomisableCanvasConfig {
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
	config: CustomisableCanvasConfig,
	objectConfig: CanvasObjectConfig
): CustomisableCanvasConfig {
	return {
		...config,
		objects: [...config.objects, objectConfig]
	};
}

export function removeObject(
	config: CustomisableCanvasConfig,
	objectIndex: number
): CustomisableCanvasConfig {
	if (objectIndex < 0 || objectIndex >= config.objects.length) {
		return config;
	}

	return {
		...config,
		objects: config.objects.filter((_, i) => i !== objectIndex)
	};
}

export function updateObjectByIndex(
	config: CustomisableCanvasConfig,
	objectIndex: number,
	updates: Map<string, { path: string[], value: unknown }>
): CustomisableCanvasConfig {
	if (objectIndex < 0 || objectIndex >= config.objects.length || updates.size === 0) {
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

	// Deep clone the inner config to avoid mutations
	let updatedInnerConfig = JSON.parse(JSON.stringify(innerConfig));

	// Apply each update from the Map
	updates.forEach(({ path, value }) => {
		if (path.length === 0) return;

		// Navigate to the nested property and update it
		let target: any = updatedInnerConfig;
		for (let i = 0; i < path.length - 1; i++) {
			const key = path[i];
			if (!key) continue; // Skip undefined keys
			if (target[key] === undefined) {
				target[key] = {};
			}
			target = target[key];
		}

		// Set the final value
		const lastKey = path[path.length - 1];
		if (lastKey !== undefined) {
			target[lastKey] = value;
		}
	});

	// Rewrap in NixOS format
	newObjects[objectIndex] = { [typeKey]: updatedInnerConfig } as CanvasObjectConfig;

	return { ...config, objects: newObjects };
}

