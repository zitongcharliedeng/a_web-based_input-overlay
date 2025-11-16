import type { DeepPartial } from '../../../_helpers/TypeUtilities';

export function deepMerge<T extends object>(target: T, source?: DeepPartial<T>): T {
	if (!source) return target;

	const result = { ...target } as any;

	for (const key in source) {
		const sourceValue = (source as any)[key];
		const targetValue = (result as any)[key];

		if (sourceValue !== null && typeof sourceValue === 'object' && !Array.isArray(sourceValue)) {
			result[key] = deepMerge(
				targetValue || {},
				sourceValue
			);
		} else if (sourceValue !== undefined) {
			result[key] = sourceValue;
		}
	}

	return result as T;
}
