import { CanvasObjectInstance } from './BaseCanvasObject';
import { Vector } from '../../../_helpers/Vector';
import { type PlanarInputIndicatorConfig } from '../../../modelToSaveCustomConfigurationLocally/configSchema';
export declare class PlanarInputIndicator extends CanvasObjectInstance {
    readonly config: PlanarInputIndicatorConfig;
    runtimeState: {
        inputVector: Vector;
        previousX: number;
        previousY: number;
    };
    constructor(configOverrides: Partial<PlanarInputIndicatorConfig> | undefined, objArrayIdx: number);
    update(): boolean;
    draw(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D): void;
}
