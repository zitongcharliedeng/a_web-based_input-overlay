type CanvasObjectType = "linearInputIndicator" | "planarInputIndicator" | "text" | "image" | "webEmbed";
interface CanvasObjectPosition {
    pxFromCanvasTop: number;
    pxFromCanvasLeft: number;
}
interface CanvasObjectHitbox {
    widthInPx: number;
    lengthInPx: number;
}
declare abstract class CanvasObject {
    [key: string]: unknown;
    id: string;
    positionOnCanvas: CanvasObjectPosition;
    hitboxSize: CanvasObjectHitbox;
    layerLevel: number;
    canvasObjectType: CanvasObjectType;
    constructor(id: string, positionOnCanvas: CanvasObjectPosition, hitboxSize: CanvasObjectHitbox, canvasObjectType: CanvasObjectType, layerLevel?: number);
    syncProperties(): void;
    abstract update(delta: number): boolean;
    abstract draw(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D): void;
}
export { CanvasObject };
export type { CanvasObjectType, CanvasObjectPosition, CanvasObjectHitbox };
