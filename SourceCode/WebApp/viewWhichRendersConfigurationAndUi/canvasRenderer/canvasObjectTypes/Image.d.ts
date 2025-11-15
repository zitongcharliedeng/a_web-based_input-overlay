import { CanvasObject } from './BaseCanvasObject';
import type { ImageTemplate, CanvasObjectConfig } from '../../../modelToSaveCustomConfigurationLocally/OmniConfig';
interface ImageProperties {
    src?: string;
    opacity?: number;
}
declare class ImageObject extends CanvasObject {
    static readonly TYPE: "image";
    static readonly DISPLAY_NAME = "Image";
    static readonly DEFAULT_TEMPLATE: ImageTemplate;
    static fromConfig(config: CanvasObjectConfig): ImageObject;
    defaultProperties: ImageProperties;
    className: string;
    src: string;
    opacity: number;
    imageElement: HTMLImageElement;
    constructor(id: string, pxFromCanvasTop: number, pxFromCanvasLeft: number, widthInPx: number, lengthInPx: number, properties?: ImageProperties, layerLevel?: number);
    update(): boolean;
    draw(_canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D): void;
}
export { ImageObject };
export type { ImageConfig } from '../../../modelToSaveCustomConfigurationLocally/OmniConfig';
export declare const defaultTemplateFor_Image: ImageTemplate;
export type { ImageProperties };
