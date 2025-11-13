type CanvasObjectType =
    | "linearInputIndicator"
    | "planarInputIndicator"
    | "text"
    | "image"
    | "webEmbed";

abstract class CanvasObject {
    pxFromCanvasTop: number;
    pxFromCanvasLeft: number;
    widthInPx: number;
    lengthInPx: number;
    canvasObjectType: CanvasObjectType;
    abstract defaultProperties: any;

    constructor(
        pxFromCanvasTop: number,
        pxFromCanvasLeft: number,
        widthInPx: number,
        lengthInPx: number,
        canvasObjectType: CanvasObjectType
    ) {
        this.pxFromCanvasTop = pxFromCanvasTop;
        this.pxFromCanvasLeft = pxFromCanvasLeft;
        this.widthInPx = widthInPx;
        this.lengthInPx = lengthInPx;
        this.canvasObjectType = canvasObjectType;
    }

    abstract update(delta: number): void;
    abstract draw(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D): void;
}

export { CanvasObject };
export type { CanvasObjectType };
