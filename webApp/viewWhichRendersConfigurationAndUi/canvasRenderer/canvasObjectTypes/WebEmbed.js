import { CanvasObject } from './BaseCanvasObject.js';
const defaultWebEmbedProperties = {
    url: "https://www.twitch.tv/",
    opacity: 1.0
};
class WebEmbed extends CanvasObject {
    constructor(id, x, y, width, height, properties, layerLevel) {
        super(id, { pxFromCanvasTop: y, pxFromCanvasLeft: x }, { widthInPx: width, lengthInPx: height }, "webEmbed", layerLevel ?? 10);
        this.defaultProperties = defaultWebEmbedProperties;
        this.className = "WebEmbed";
        this.url = "https://www.twitch.tv/";
        this.opacity = 1.0;
        this.iframe = null;
        const props = properties ?? {};
        const defaults = defaultWebEmbedProperties;
        this.url = props.url ?? defaults.url;
        this.opacity = props.opacity ?? defaults.opacity;
        // Create iframe element
        this.createIframe();
    }
    createIframe() {
        this.iframe = document.createElement('iframe');
        this.iframe.src = this.url;
        this.iframe.style.position = 'absolute';
        // Add 10px padding inside hitbox for right-click detection
        const padding = 10;
        this.iframe.style.left = (this.positionOnCanvas.pxFromCanvasLeft + padding) + 'px';
        this.iframe.style.top = (this.positionOnCanvas.pxFromCanvasTop + padding) + 'px';
        this.iframe.style.width = (this.hitboxSize.widthInPx - padding * 2) + 'px';
        this.iframe.style.height = (this.hitboxSize.lengthInPx - padding * 2) + 'px';
        this.iframe.style.opacity = this.opacity.toString();
        this.iframe.style.border = '2px solid #B4B4B4';
        this.iframe.style.pointerEvents = 'none'; // Pass clicks through to canvas
        this.iframe.style.zIndex = '1'; // Below UI windows (which use z-index 100+)
        this.iframe.setAttribute('allowfullscreen', '');
        document.body.appendChild(this.iframe);
    }
    update(delta) {
        // Update iframe position if object moved
        if (this.iframe) {
            const padding = 10;
            this.iframe.style.left = (this.positionOnCanvas.pxFromCanvasLeft + padding) + 'px';
            this.iframe.style.top = (this.positionOnCanvas.pxFromCanvasTop + padding) + 'px';
            this.iframe.style.width = (this.hitboxSize.widthInPx - padding * 2) + 'px';
            this.iframe.style.height = (this.hitboxSize.lengthInPx - padding * 2) + 'px';
            this.iframe.style.opacity = this.opacity.toString();
        }
        return false; // WebEmbed doesn't need canvas redraw
    }
    draw(canvas, ctx) {
        // Draw magenta hitbox border (10px padding for right-click detection)
        ctx.strokeStyle = '#FF00FF';
        ctx.lineWidth = 3;
        ctx.strokeRect(0, 0, this.hitboxSize.widthInPx, this.hitboxSize.lengthInPx);
        // Draw inner border where iframe actually is
        const padding = 10;
        ctx.strokeStyle = '#B4B4B4';
        ctx.lineWidth = 1;
        ctx.strokeRect(padding, padding, this.hitboxSize.widthInPx - padding * 2, this.hitboxSize.lengthInPx - padding * 2);
        // Draw URL text at top in the padding area
        ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        ctx.fillRect(0, 0, this.hitboxSize.widthInPx, padding);
        ctx.fillStyle = '#FFFFFF';
        ctx.font = '10px Lucida Console';
        ctx.fillText(this.url.substring(0, 50), 2, 8);
    }
    cleanup() {
        // Remove iframe when object is deleted
        if (this.iframe && this.iframe.parentNode) {
            this.iframe.parentNode.removeChild(this.iframe);
            this.iframe = null;
        }
    }
}
// Template for creating new WebEmbed objects
export const defaultTemplateFor_WebEmbed = {
    url: "https://www.example.com",
    opacity: 1.0
};
export { WebEmbed };
