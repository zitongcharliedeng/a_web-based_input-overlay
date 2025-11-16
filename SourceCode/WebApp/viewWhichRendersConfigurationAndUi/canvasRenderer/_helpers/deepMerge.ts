import type { DeepPartial } from '../../../_helpers/TypeUtilities';

export function deepMerge<T extends Record<string, unknown>>(target: T, source: DeepPartial<T>): T {
	const result = { ...target };

	for (const key in source) {
		const sourceValue = source[key];
		const targetValue = result[key];

		if (sourceValue !== null && typeof sourceValue === 'object' && !Array.isArray(sourceValue)) {
			result[key] = deepMerge(
				(targetValue as Record<string, unknown>) || {},
				sourceValue as DeepPartial<Record<string, unknown>>
			) as T[Extract<keyof T, string>];
		} else if (sourceValue !== undefined) {
			result[key] = sourceValue as T[Extract<keyof T, string>];
		}
	}

	return result;
}
