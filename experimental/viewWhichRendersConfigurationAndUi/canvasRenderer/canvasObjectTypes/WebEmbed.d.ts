import { CanvasObjectInstance } from './BaseCanvasObject';
import { type WebEmbedConfig } from '../../../modelToSaveCustomConfigurationLocally/configSchema';
export declare class WebEmbed extends CanvasObjectInstance {
    readonly config: WebEmbedConfig;
    runtimeState: {
        iframe: HTMLIFrameElement | null;
    };
    constructor(configOverrides: Partial<WebEmbedConfig> | undefined, objArrayIdx: number);
    private findOrCreateIframe;
    update(): boolean;
    draw(_canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D, isDragPreview?: boolean): void;
    cleanup(): void;
}
