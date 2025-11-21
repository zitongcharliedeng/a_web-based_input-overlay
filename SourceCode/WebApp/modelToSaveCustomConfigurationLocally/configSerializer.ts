import type { CustomisableCanvasConfig } from './CustomisableCanvasConfig';
import { validateCustomisableCanvasConfig } from './configSchema';
import type { ZodIssue } from 'zod';

export function loadConfigFromJSON(jsonString: string): { success: true; config: CustomisableCanvasConfig } | { success: false; error: string } {
	try {
		const parsed = JSON.parse(jsonString);
		const validationResult = validateCustomisableCanvasConfig(parsed);

		if (!validationResult.success) {
			const errorMessages = validationResult.error.issues.map((issue: ZodIssue) =>
				`${issue.path.join('.')}: ${issue.message}`
			).join('; ');
			return { success: false, error: `Config validation failed: ${errorMessages}` };
		}

		return { success: true, config: validationResult.data as CustomisableCanvasConfig };
	} catch (e) {
		if (e instanceof SyntaxError) {
			return { success: false, error: `Invalid JSON: ${e.message}` };
		}
		return { success: false, error: `Unknown error: ${String(e)}` };
	}
}

export function loadConfigFromLocalStorage(key: string): { success: true; config: CustomisableCanvasConfig } | { success: false; error: string } | { success: false; error: 'not_found' } {
	const stored = localStorage.getItem(key);
	if (!stored) {
		return { success: false, error: 'not_found' };
	}
	return loadConfigFromJSON(stored);
}

