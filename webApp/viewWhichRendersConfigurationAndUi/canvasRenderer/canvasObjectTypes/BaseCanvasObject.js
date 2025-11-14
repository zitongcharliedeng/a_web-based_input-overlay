class CanvasObject {
    constructor(id, positionOnCanvas, hitboxSize, canvasObjectType, layerLevel = 10) {
        this.id = id;
        this.positionOnCanvas = positionOnCanvas;
        this.hitboxSize = hitboxSize;
        this.layerLevel = layerLevel;
        this.canvasObjectType = canvasObjectType;
    }
    syncProperties() {
    }
}
export { CanvasObject };
