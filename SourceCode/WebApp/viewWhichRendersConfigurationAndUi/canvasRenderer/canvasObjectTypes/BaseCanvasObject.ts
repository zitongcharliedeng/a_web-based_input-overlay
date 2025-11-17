import type { BaseCanvasObjectConfig } from '../../../modelToSaveCustomConfigurationLocally/configSchema';

// Part 1: Instance contract (what instances must have)
abstract class CanvasObjectInstance {
    constructor(objArrayIdx: number) {
        this.objArrayIdx = objArrayIdx;
    }

    objArrayIdx: number;
    abstract readonly config: BaseCanvasObjectConfig; // All configs extend this base

    abstract update(delta: number): boolean;
    abstract draw(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D): void;

    drawDragPreview(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D): void {
        this.draw(canvas, ctx);
    }

    cleanup?(): void;
}

// Part 2: Class contract (what constructors must have)
interface CanvasObjectClass<TConfig extends BaseCanvasObjectConfig> {
    new (configOverrides: any, objArrayIdx: number): CanvasObjectInstance;
}

export { CanvasObjectInstance };
export type { CanvasObjectClass };
