import { CanvasObjectInstance } from './BaseCanvasObject';
import { type ImageConfig } from '../../../modelToSaveCustomConfigurationLocally/configSchema';
export declare class Image extends CanvasObjectInstance {
    readonly config: ImageConfig;
    runtimeState: {
        imageElement: HTMLImageElement;
    };
    constructor(configOverrides: Partial<ImageConfig> | undefined, objArrayIdx: number);
    update(): boolean;
    draw(_canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D): void;
}
