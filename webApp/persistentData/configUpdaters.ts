import type { OmniConfig, CanvasObjectConfig } from './OmniConfig.js';

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
	} else if ('image' in targetObject) {
		newObjects[objectIndex] = {
			image: {
				...targetObject.image,
				positionOnCanvas: { pxFromCanvasLeft: x, pxFromCanvasTop: y }
			}
		};
	}

	return { ...config, objects: newObjects };
}

export function updateObjectProperty(
	config: OmniConfig,
	objectIndex: number,
	path: string[],
	value: unknown
): OmniConfig {
	if (objectIndex < 0 || objectIndex >= config.objects.length) {
		return config;
	}

	const newObjects = [...config.objects];
	const targetObject = newObjects[objectIndex];

	// TODO: Implement full deep update if needed

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
