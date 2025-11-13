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
    canvasObjectType: CanvasObjectType;
    abstract defaultProperties: any;

    constructor(
        pxFromCanvasTop: number,
        pxFromCanvasLeft: number,
        widthInPx: number,
        lengthInPx: number,
        canvasObjectType: CanvasObjectType
    ) {
        this.positionOnCanvas = { pxFromCanvasTop, pxFromCanvasLeft };
        this.hitboxSize = { widthInPx, lengthInPx };
        this.canvasObjectType = canvasObjectType;
    }

    get x(): number { return this.positionOnCanvas.pxFromCanvasLeft; }
    set x(value: number) { this.positionOnCanvas.pxFromCanvasLeft = value; }

    get y(): number { return this.positionOnCanvas.pxFromCanvasTop; }
    set y(value: number) { this.positionOnCanvas.pxFromCanvasTop = value; }

    get width(): number { return this.hitboxSize.widthInPx; }
    set width(value: number) { this.hitboxSize.widthInPx = value; }

    get height(): number { return this.hitboxSize.lengthInPx; }
    set height(value: number) { this.hitboxSize.lengthInPx = value; }

    abstract update(delta: number): boolean;
    abstract draw(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D): void;
}

export { CanvasObject };
export type { CanvasObjectType, CanvasObjectPosition, CanvasObjectHitbox };
