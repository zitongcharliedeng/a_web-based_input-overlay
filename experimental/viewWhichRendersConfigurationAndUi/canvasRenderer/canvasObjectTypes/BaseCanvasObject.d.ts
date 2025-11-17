import type { BaseCanvasObjectConfig } from '../../../modelToSaveCustomConfigurationLocally/configSchema';
declare abstract class CanvasObjectInstance {
    constructor(objArrayIdx: number);
    objArrayIdx: number;
    abstract readonly config: BaseCanvasObjectConfig;
    abstract update(delta: number): boolean;
    abstract draw(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D, isDragPreview?: boolean): void;
    cleanup?(): void;
}
interface CanvasObjectClass<TConfig extends BaseCanvasObjectConfig> {
    new (configOverrides: any, objArrayIdx: number): CanvasObjectInstance;
}
export { CanvasObjectInstance };
export type { CanvasObjectClass };
