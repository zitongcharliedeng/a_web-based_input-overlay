import { CanvasObject } from './BaseCanvasObject.js';
const defaultImageProperties = {
    src: "https://raw.githubusercontent.com/zitongcharliedeng/a_web-based_input-overlay/refs/heads/master/webApp/sceneRender/_assets/images/KeyDefault.png",
    opacity: 1.0
};
class ImageObject extends CanvasObject {
    constructor(id, pxFromCanvasTop, pxFromCanvasLeft, widthInPx, lengthInPx, properties, layerLevel) {
        super(id, { pxFromCanvasTop, pxFromCanvasLeft }, { widthInPx, lengthInPx }, "image", layerLevel ?? 0 // Background layer by default
        );
        this.defaultProperties = defaultImageProperties;
        this.className = "Image";
        const props = properties ?? {};
        const defaults = defaultImageProperties;
        this.src = props.src ?? defaults.src;
        this.opacity = props.opacity ?? defaults.opacity;
        // Create and load image
        this.imageElement = new window.Image();
        this.imageElement.src = this.src;
    }
    update(_delta) {
        // Images are static - no updates needed
        // Return false if image not loaded, true once loaded
        return this.imageElement.complete;
    }
    draw(_canvas, ctx) {
        // Only draw if image is loaded
        if (!this.imageElement.complete)
            return;
        // Save context state
        const prevAlpha = ctx.globalAlpha;
        ctx.globalAlpha = this.opacity;
        // Draw image scaled to hitbox dimensions
        try {
            ctx.drawImage(this.imageElement, 0, 0, this.imageElement.width, this.imageElement.height, 0, 0, this.hitboxSize.widthInPx, this.hitboxSize.lengthInPx);
        }
        catch (e) {
            // Image loading failed - skip silently
        }
        // Restore context state
        ctx.globalAlpha = prevAlpha;
    }
}
export { ImageObject };
const DEFAULT_KEY_IMAGE_URL = "https://raw.githubusercontent.com/zitongcharliedeng/a_web-based_input-overlay/refs/heads/master/webApp/sceneRender/_assets/images/KeyDefault.png";
export const defaultTemplateFor_Image = {
    src: DEFAULT_KEY_IMAGE_URL,
    opacity: 1.0
};
