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
    positionOnCanvas: CanvasObjectPosition;
    hitboxSize: CanvasObjectHitbox;
    layerLevel: number;  // Z-index for rendering order (lower = behind, higher = front)
    canvasObjectType: CanvasObjectType;
    abstract defaultProperties: any;

    constructor(
        positionOnCanvas: CanvasObjectPosition,
        hitboxSize: CanvasObjectHitbox,
        canvasObjectType: CanvasObjectType,
        layerLevel: number = 10
    ) {
        this.positionOnCanvas = positionOnCanvas;
        this.hitboxSize = hitboxSize;
        this.layerLevel = layerLevel;
        this.canvasObjectType = canvasObjectType;
    }

    syncProperties(): void {
    }

    abstract update(delta: number): boolean;
    abstract draw(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D): void;
}

export { CanvasObject };
export type { CanvasObjectType, CanvasObjectPosition, CanvasObjectHitbox };
