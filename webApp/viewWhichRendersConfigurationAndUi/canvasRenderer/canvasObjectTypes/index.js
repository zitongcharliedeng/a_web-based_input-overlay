class CanvasObject {
    constructor(positionOnCanvas, hitboxSize, canvasObjectType, layerLevel = 10) {
        this.positionOnCanvas = positionOnCanvas;
        this.hitboxSize = hitboxSize;
        this.layerLevel = layerLevel;
        this.canvasObjectType = canvasObjectType;
    }
    syncProperties() {
    }
}
export { CanvasObject };
