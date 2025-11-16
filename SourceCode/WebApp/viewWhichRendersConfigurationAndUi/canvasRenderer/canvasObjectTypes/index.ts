import { ALL_CANVAS_OBJECT_CLASSES_BY_CLASSNAME, type CanvasObjectClassName, type CanvasObjectConfig } from '../../../modelToSaveCustomConfigurationLocally/OmniConfig';
import type { CanvasObjectInstance } from './BaseCanvasObject';

export type { CanvasObjectInstance } from './BaseCanvasObject';

export { LinearInputIndicator } from './LinearInputIndicator';
export { PlanarInputIndicator } from './PlanarInputIndicator';
export { Text } from './Text';
export { Image } from './Image';
export { WebEmbed } from './WebEmbed';

export const SPAWNABLE_TYPES: ReadonlyArray<CanvasObjectClassName> =
	Object.keys(ALL_CANVAS_OBJECT_CLASSES_BY_CLASSNAME) as CanvasObjectClassName[];

function isCanvasObjectClassName(key: string): key is CanvasObjectClassName {
	return key in ALL_CANVAS_OBJECT_CLASSES_BY_CLASSNAME;
}

export function deserializeCanvasObject(objData: CanvasObjectConfig, objArrayIdx: number): CanvasObjectInstance {
	for (const key in objData) {
		if (isCanvasObjectClassName(key)) {
			const Class = ALL_CANVAS_OBJECT_CLASSES_BY_CLASSNAME[key];
			// TypeScript can't narrow discriminated unions with computed keys,
			// but we've verified the key exists via isCanvasObjectClassName guard
			const config = (objData as any)[key];
			return new Class(config, objArrayIdx);
		}
	}
	throw new Error('Invalid config: no valid class name found');
}
