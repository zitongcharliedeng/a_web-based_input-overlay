import { LinearInputIndicator } from '../viewWhichRendersConfigurationAndUi/canvasRenderer/canvasObjectTypes/LinearInputIndicator';
import { PlanarInputIndicator } from '../viewWhichRendersConfigurationAndUi/canvasRenderer/canvasObjectTypes/PlanarInputIndicator';
import { Text } from '../viewWhichRendersConfigurationAndUi/canvasRenderer/canvasObjectTypes/Text';
import { Image } from '../viewWhichRendersConfigurationAndUi/canvasRenderer/canvasObjectTypes/Image';
import { WebEmbed } from '../viewWhichRendersConfigurationAndUi/canvasRenderer/canvasObjectTypes/WebEmbed';
export type { CanvasConfig, CanvasObjectConfig, CustomisableCanvasConfig } from './configSchema';
export declare const ALL_CANVAS_OBJECT_CLASSES_BY_CLASSNAME: {
    readonly LinearInputIndicator: typeof LinearInputIndicator;
    readonly PlanarInputIndicator: typeof PlanarInputIndicator;
    readonly Text: typeof Text;
    readonly Image: typeof Image;
    readonly WebEmbed: typeof WebEmbed;
};
export type CanvasObjectClassName = keyof typeof ALL_CANVAS_OBJECT_CLASSES_BY_CLASSNAME;
