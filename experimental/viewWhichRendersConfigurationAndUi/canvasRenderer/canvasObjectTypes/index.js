import { ALL_CANVAS_OBJECT_CLASSES_BY_CLASSNAME } from '../../../modelToSaveCustomConfigurationLocally/CustomisableCanvasConfig';
export { LinearInputIndicator } from './LinearInputIndicator';
export { PlanarInputIndicator } from './PlanarInputIndicator';
export { Text } from './Text';
export { Image } from './Image';
export { WebEmbed } from './WebEmbed';
export const SPAWNABLE_TYPES = Object.keys(ALL_CANVAS_OBJECT_CLASSES_BY_CLASSNAME);
function isCanvasObjectClassName(key) {
    return key in ALL_CANVAS_OBJECT_CLASSES_BY_CLASSNAME;
}
export function deserializeCanvasObject(objData, objArrayIdx) {
    for (const key in objData) {
        if (isCanvasObjectClassName(key)) {
            const Class = ALL_CANVAS_OBJECT_CLASSES_BY_CLASSNAME[key];
            // TypeScript can't narrow discriminated unions with computed keys,
            // but we've verified the key exists via isCanvasObjectClassName guard
            const config = objData[key];
            return new Class(config, objArrayIdx);
        }
    }
    throw new Error('Invalid config: no valid class name found');
}
//# sourceMappingURL=index.js.map