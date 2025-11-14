/**
 * Helper: Set nested property in object (immutable)
 * Example: setNested({a: {b: {c: 1}}}, ['a', 'b', 'c'], 2) → {a: {b: {c: 2}}}
 */
function setNestedProperty(obj, path, value) {
    if (path.length === 0)
        return value;
    const [head, ...rest] = path;
    if (rest.length === 0) {
        // Base case: set the final key
        return { ...obj, [head]: value };
    }
    else {
        // Recursive case: go deeper
        return {
            ...obj,
            [head]: setNestedProperty(obj[head] || {}, rest, value)
        };
    }
}
/**
 * Helper: Find object index by ID
 */
function findObjectIndexById(config, objectId) {
    return config.objects.findIndex(obj => {
        if ('linearInputIndicator' in obj)
            return obj.linearInputIndicator.id === objectId;
        if ('planarInputIndicator' in obj)
            return obj.planarInputIndicator.id === objectId;
        if ('text' in obj)
            return obj.text.id === objectId;
        if ('image' in obj)
            return obj.image.id === objectId;
        if ('webEmbed' in obj)
            return obj.webEmbed.id === objectId;
        return false;
    });
}
export function updateObjectPosition(config, objectIndex, x, y) {
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
    }
    else if ('planarInputIndicator' in targetObject) {
        newObjects[objectIndex] = {
            planarInputIndicator: {
                ...targetObject.planarInputIndicator,
                positionOnCanvas: { pxFromCanvasLeft: x, pxFromCanvasTop: y }
            }
        };
    }
    else if ('text' in targetObject) {
        newObjects[objectIndex] = {
            text: {
                ...targetObject.text,
                positionOnCanvas: { pxFromCanvasLeft: x, pxFromCanvasTop: y }
            }
        };
    }
    else if ('image' in targetObject) {
        newObjects[objectIndex] = {
            image: {
                ...targetObject.image,
                positionOnCanvas: { pxFromCanvasLeft: x, pxFromCanvasTop: y }
            }
        };
    }
    return { ...config, objects: newObjects };
}
/**
 * Update object property by ID (deep nested update)
 * This is the core function for PropertyEdit mutations
 */
export function updateObjectPropertyById(config, objectId, path, value) {
    const objectIndex = findObjectIndexById(config, objectId);
    if (objectIndex === -1) {
        console.error(`[configUpdaters] Object with id ${objectId} not found`);
        return config;
    }
    const newObjects = [...config.objects];
    const targetObject = newObjects[objectIndex];
    // Update the nested property inside the discriminated union
    if ('linearInputIndicator' in targetObject) {
        newObjects[objectIndex] = {
            linearInputIndicator: setNestedProperty(targetObject.linearInputIndicator, path, value)
        };
    }
    else if ('planarInputIndicator' in targetObject) {
        newObjects[objectIndex] = {
            planarInputIndicator: setNestedProperty(targetObject.planarInputIndicator, path, value)
        };
    }
    else if ('text' in targetObject) {
        newObjects[objectIndex] = {
            text: setNestedProperty(targetObject.text, path, value)
        };
    }
    else if ('image' in targetObject) {
        newObjects[objectIndex] = {
            image: setNestedProperty(targetObject.image, path, value)
        };
    }
    else if ('webEmbed' in targetObject) {
        newObjects[objectIndex] = {
            webEmbed: setNestedProperty(targetObject.webEmbed, path, value)
        };
    }
    return { ...config, objects: newObjects };
}
export function updateCanvasDimensions(config, width, height) {
    return {
        ...config,
        canvas: {
            ...config.canvas,
            width,
            height
        }
    };
}
export function addObject(config, objectConfig) {
    console.log('[addObject] Adding object to config:', Object.keys(objectConfig)[0]);
    console.log('[addObject] Config before:', config.objects.length, 'objects');
    const newConfig = {
        ...config,
        objects: [...config.objects, objectConfig]
    };
    console.log('[addObject] Config after:', newConfig.objects.length, 'objects');
    return newConfig;
}
export function removeObject(config, objectIndex) {
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
export function removeObjectById(config, objectId) {
    return {
        ...config,
        objects: config.objects.filter(obj => {
            if ('linearInputIndicator' in obj)
                return obj.linearInputIndicator.id !== objectId;
            if ('planarInputIndicator' in obj)
                return obj.planarInputIndicator.id !== objectId;
            if ('text' in obj)
                return obj.text.id !== objectId;
            if ('image' in obj)
                return obj.image.id !== objectId;
            if ('webEmbed' in obj)
                return obj.webEmbed.id !== objectId;
            return true; // Unknown type, keep it
        })
    };
}
