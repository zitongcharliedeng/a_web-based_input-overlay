class CanvasObject {
    constructor(positionOnCanvas, hitboxSize, canvasObjectType) {
        this.positionOnCanvas = positionOnCanvas;
        this.hitboxSize = hitboxSize;
        this.canvasObjectType = canvasObjectType;
    }
    get x() { return this.positionOnCanvas.pxFromCanvasLeft; }
    set x(value) { this.positionOnCanvas.pxFromCanvasLeft = value; }
    get y() { return this.positionOnCanvas.pxFromCanvasTop; }
    set y(value) { this.positionOnCanvas.pxFromCanvasTop = value; }
    get width() { return this.hitboxSize.widthInPx; }
    set width(value) { this.hitboxSize.widthInPx = value; }
    get height() { return this.hitboxSize.lengthInPx; }
    set height(value) { this.hitboxSize.lengthInPx = value; }
}
export { CanvasObject };
