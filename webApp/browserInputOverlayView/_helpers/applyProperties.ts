// Check if value is a plain object (not a special object like Image, Date, etc.)
function isPlainObject(obj: any): boolean {
    if (!obj || typeof obj !== 'object') return false;
    const prototype = Object.getPrototypeOf(obj);
    return prototype === Object.prototype || prototype === null;
}

// Deep merge helper - recursively merges nested objects where overrides win conflicts
function deepMerge<T extends Record<string, any>>(defaults: T, overrides: Partial<T>): T {
    const result = { ...defaults };

    for (const key in overrides) {
        if (overrides.hasOwnProperty(key)) {
            const overrideValue = overrides[key];
            const defaultValue = result[key];

            if (isPlainObject(overrideValue) && isPlainObject(defaultValue)) {
                result[key] = deepMerge(defaultValue, overrideValue);
            } else {
                result[key] = overrideValue as T[Extract<keyof T, string>];
            }
        }
    }

    return result;
}

// Applying properties to objects
function applyProperties(object: any, properties: any): void {

    for (var propertyName in properties) {
        if (properties.hasOwnProperty(propertyName)) {

            object[ propertyName ] = properties[ propertyName ];
        }
    }
}

export { applyProperties, deepMerge };
