type CanvasObjectType =
    | "linearInputIndicator"
    | "planarInputIndicator"
    | "text"
    | "image"
    | "webEmbed";

interface CanvasObjectPosition {
    pxFromCanvasTop: number;
    pxFromCanvasLeft: number;
}

interface CanvasObjectHitbox {
    widthInPx: number;
    lengthInPx: number;
}

abstract class CanvasObject {
    objArrayIdx: number;  // Array index used as object identifier
    positionOnCanvas: CanvasObjectPosition;
    hitboxSize: CanvasObjectHitbox;
    layerLevel: number;  // Z-index for rendering order (lower = behind, higher = front)
    canvasObjectType: CanvasObjectType;

    constructor(
        objArrayIdx: number,
        positionOnCanvas: CanvasObjectPosition,
        hitboxSize: CanvasObjectHitbox,
        canvasObjectType: CanvasObjectType,
        layerLevel: number = 10
    ) {
        this.objArrayIdx = objArrayIdx;
        this.positionOnCanvas = positionOnCanvas;
        this.hitboxSize = hitboxSize;
        this.layerLevel = layerLevel;
        this.canvasObjectType = canvasObjectType;
    }

    syncProperties(): void {
    }

    cleanup?(): void;  // Optional cleanup method for objects like WebEmbed

    abstract update(delta: number): boolean;
    abstract draw(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D): void;
}

export { CanvasObject };
export type { CanvasObjectType, CanvasObjectPosition, CanvasObjectHitbox };
