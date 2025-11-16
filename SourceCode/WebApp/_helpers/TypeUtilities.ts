/**
 * Utility types used across the application
 * Single source of truth for generic type transformations
 */

/**
 * Deep Partial - makes all nested properties optional recursively
 * Used for config objects where users can provide partial updates
 */
export type DeepPartial<T> = T extends object ? {
	[P in keyof T]?: DeepPartial<T[P]>;
} : T;

/**
 * Require - makes specified keys required while keeping others as-is
 * Example: Require<{ a?: string, b?: number }, 'a'> → { a: string, b?: number }
 */
export type Require<T, K extends keyof T> = T & { [P in K]-?: T[P] };

/**
 * PartialBy - makes specified keys optional while keeping others as-is
 * Example: PartialBy<{ a: string, b: number }, 'a'> → { a?: string, b: number }
 */
export type PartialBy<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;
