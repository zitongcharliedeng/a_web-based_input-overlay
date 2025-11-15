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
    id: string;  // Unique identifier (UUID) matching config ID
    positionOnCanvas: CanvasObjectPosition;
    hitboxSize: CanvasObjectHitbox;
    layerLevel: number;  // Z-index for rendering order (lower = behind, higher = front)
    canvasObjectType: CanvasObjectType;

    constructor(
        id: string,
        positionOnCanvas: CanvasObjectPosition,
        hitboxSize: CanvasObjectHitbox,
        canvasObjectType: CanvasObjectType,
        layerLevel: number = 10
    ) {
        this.id = id;
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
