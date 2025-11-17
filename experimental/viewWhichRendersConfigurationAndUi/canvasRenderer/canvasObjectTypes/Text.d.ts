import { CanvasObjectInstance } from './BaseCanvasObject';
import { type TextConfig } from '../../../modelToSaveCustomConfigurationLocally/configSchema';
export declare class Text extends CanvasObjectInstance {
    readonly config: TextConfig;
    constructor(configOverrides: Partial<TextConfig> | undefined, objArrayIdx: number);
    update(): boolean;
    draw(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D): void;
}
