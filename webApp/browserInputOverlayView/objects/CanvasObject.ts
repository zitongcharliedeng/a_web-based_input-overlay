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

    get x(): number { return this.pxFromCanvasLeft; }
    set x(value: number) { this.pxFromCanvasLeft = value; }

    get y(): number { return this.pxFromCanvasTop; }
    set y(value: number) { this.pxFromCanvasTop = value; }

    get width(): number { return this.widthInPx; }
    set width(value: number) { this.widthInPx = value; }

    get height(): number { return this.lengthInPx; }
    set height(value: number) { this.lengthInPx = value; }

    abstract update(delta: number): void;
    abstract draw(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D): void;
}

export { CanvasObject };
export type { CanvasObjectType };
