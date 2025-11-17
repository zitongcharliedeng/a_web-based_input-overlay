import { CanvasObjectInstance } from './BaseCanvasObject';
import { type LinearInputIndicatorConfig } from '../../../modelToSaveCustomConfigurationLocally/configSchema';
export declare class LinearInputIndicator extends CanvasObjectInstance {
    readonly config: LinearInputIndicatorConfig;
    runtimeState: {
        value: number;
        previousValue: number;
        opacity: number;
    };
    constructor(configOverrides: Partial<LinearInputIndicatorConfig> | undefined, objArrayIdx: number);
    update(delta: number): boolean;
    draw(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D): void;
}
