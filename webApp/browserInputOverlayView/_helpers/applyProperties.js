function isPlainObject(obj) {
    if (!obj || typeof obj !== 'object')
        return false;
    const prototype = Object.getPrototypeOf(obj);
    return prototype === Object.prototype || prototype === null;
}
function deepMerge(defaults, overrides) {
    const result = { ...defaults };
    for (const key in overrides) {
        if (overrides.hasOwnProperty(key)) {
            const overrideValue = overrides[key];
            const defaultValue = result[key];
            if (isPlainObject(overrideValue) && isPlainObject(defaultValue)) {
                result[key] = deepMerge(defaultValue, overrideValue);
            }
            else {
                result[key] = overrideValue;
            }
        }
    }
    return result;
}
// Applying properties to objects
function applyProperties(object, properties) {
    for (var propertyName in properties) {
        if (properties.hasOwnProperty(propertyName)) {
            object[propertyName] = properties[propertyName];
        }
    }
}
export { applyProperties, deepMerge };
