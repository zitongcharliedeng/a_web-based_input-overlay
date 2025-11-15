import { CanvasObject } from './BaseCanvasObject';
import type { WebEmbedTemplate, CanvasObjectConfig } from '../../../modelToSaveCustomConfigurationLocally/OmniConfig';
interface WebEmbedProperties {
    url?: string;
    opacity?: number;
}
declare class WebEmbed extends CanvasObject {
    static readonly TYPE: "webEmbed";
    static readonly DISPLAY_NAME = "WebEmbed";
    static readonly DEFAULT_TEMPLATE: WebEmbedTemplate;
    static fromConfig(config: CanvasObjectConfig): WebEmbed;
    defaultProperties: WebEmbedProperties;
    className: string;
    url: string;
    opacity: number;
    iframe: HTMLIFrameElement | null;
    constructor(id: string, x: number, y: number, width: number, height: number, properties?: WebEmbedProperties, layerLevel?: number);
    private createIframe;
    update(): boolean;
    draw(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D): void;
    cleanup(): void;
}
export declare const defaultTemplateFor_WebEmbed: WebEmbedTemplate;
export { WebEmbed };
