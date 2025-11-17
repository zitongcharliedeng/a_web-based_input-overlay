import { validateCustomisableCanvasConfig } from './configSchema';
export function loadConfigFromJSON(jsonString) {
    try {
        const parsed = JSON.parse(jsonString);
        const validationResult = validateCustomisableCanvasConfig(parsed);
        if (!validationResult.success) {
            const errorMessages = validationResult.error.issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`).join('; ');
            return { success: false, error: `Config validation failed: ${errorMessages}` };
        }
        return { success: true, config: validationResult.data };
    }
    catch (e) {
        if (e instanceof SyntaxError) {
            return { success: false, error: `Invalid JSON: ${e.message}` };
        }
        return { success: false, error: `Unknown error: ${String(e)}` };
    }
}
export function loadConfigFromLocalStorage(key) {
    const stored = localStorage.getItem(key);
    if (!stored) {
        return { success: false, error: 'not_found' };
    }
    return loadConfigFromJSON(stored);
}
//# sourceMappingURL=configSerializer.js.map