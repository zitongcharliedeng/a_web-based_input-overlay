import { CanvasObject } from './CanvasObject.js';
import { applyProperties } from '../_helpers/applyProperties.js';
import { canvas_text } from '../_helpers/draw.js';
const defaultTextProperties = {
    text: "Sample text",
    textStyle: { textAlign: "center", fillStyle: "black", font: "30px Lucida Console" },
    shouldStroke: false,
};
class Text extends CanvasObject {
    constructor(pxFromCanvasTop, pxFromCanvasLeft, widthInPx, lengthInPx, properties) {
        super({ pxFromCanvasTop, pxFromCanvasLeft }, { widthInPx, lengthInPx }, "text");
        this.defaultProperties = defaultTextProperties;
        const mergedProperties = { ...defaultTextProperties, ...properties };
        applyProperties(this, mergedProperties);
    }
    update(delta) {
        return true;
    }
    draw(canvas, ctx) {
        ctx.beginPath();
        canvas_text(ctx, 0, 0, this.text, this.textStyle);
    }
}
export { Text };
