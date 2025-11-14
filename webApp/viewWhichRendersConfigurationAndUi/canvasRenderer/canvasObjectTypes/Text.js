import { CanvasObject } from './BaseCanvasObject.js';
import { canvas_text } from '../../_helpers/draw.js';
const defaultTextProperties = {
    text: "Sample text",
    textStyle: {
        textAlign: "center",
        fillStyle: "black",
        font: "30px Lucida Console",
        strokeStyle: "white",
        strokeWidth: 3
    },
    shouldStroke: true,
};
class Text extends CanvasObject {
    constructor(id, pxFromCanvasTop, pxFromCanvasLeft, widthInPx, lengthInPx, properties, layerLevel) {
        super(id, { pxFromCanvasTop, pxFromCanvasLeft }, { widthInPx, lengthInPx }, "text", layerLevel ?? 20);
        this.defaultProperties = defaultTextProperties;
        this.className = "Text";
        const props = properties ?? {};
        const defaults = defaultTextProperties;
        this.text = props.text ?? defaults.text;
        this.textStyle = { ...defaults.textStyle, ...props.textStyle };
        this.shouldStroke = props.shouldStroke ?? defaults.shouldStroke;
    }
    update(delta) {
        return true;
    }
    draw(canvas, ctx) {
        ctx.beginPath();
        if (this.shouldStroke) {
            // Draw stroke outline
            ctx.strokeStyle = this.textStyle.strokeStyle ?? "white";
            ctx.lineWidth = this.textStyle.strokeWidth ?? 3;
            ctx.strokeText(this.text, 0, 0);
        }
        canvas_text(ctx, 0, 0, this.text, this.textStyle);
    }
}
export { Text };
export const defaultTemplateFor_Text = {
    text: "",
    textStyle: {
        textAlign: "left",
        fillStyle: "black",
        font: "20px Lucida Console",
        strokeStyle: "white",
        strokeWidth: 3
    },
    shouldStroke: true
};
