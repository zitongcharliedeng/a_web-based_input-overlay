import { CanvasObject } from './BaseCanvasObject';
import type { TextTemplate, CanvasObjectConfig } from '../../../modelToSaveCustomConfigurationLocally/OmniConfig';
interface TextStyle {
    textAlign?: CanvasTextAlign;
    fillStyle?: string;
    font?: string;
    strokeStyle?: string;
    strokeWidth?: number;
}
interface TextProperties {
    text?: string;
    textStyle?: TextStyle;
    shouldStroke?: boolean;
}
declare class Text extends CanvasObject {
    static readonly TYPE: "text";
    static readonly DISPLAY_NAME = "Text";
    static readonly DEFAULT_TEMPLATE: TextTemplate;
    static fromConfig(config: CanvasObjectConfig): Text;
    defaultProperties: TextProperties;
    className: string;
    text: string;
    textStyle: TextStyle;
    shouldStroke: boolean;
    constructor(id: string, pxFromCanvasTop: number, pxFromCanvasLeft: number, widthInPx: number, lengthInPx: number, properties?: TextProperties, layerLevel?: number);
    update(): boolean;
    draw(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D): void;
}
export { Text };
export declare const defaultTemplateFor_Text: {
    text: string;
    textStyle: {
        textAlign: "left";
        fillStyle: string;
        font: string;
        strokeStyle: string;
        strokeWidth: number;
    };
    shouldStroke: true;
};
export type { TextProperties, TextStyle };
