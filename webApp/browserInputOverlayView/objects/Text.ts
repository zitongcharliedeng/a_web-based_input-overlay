import { CanvasObject } from './CanvasObject.js';
import { applyProperties } from '../_helpers/applyProperties.js';
import { canvas_text } from '../_helpers/draw.js';

interface TextStyle {
    textAlign: CanvasTextAlign;
    fillStyle: string;
    font: string;
}

interface TextProperties {
    text: string;
    textStyle: TextStyle;
    shouldStroke: boolean;
}

const defaultTextProperties: TextProperties = {
    text: "Sample text",
    textStyle: { textAlign: "center", fillStyle: "black", font: "30px Lucida Console" },
    shouldStroke: false,
};

class Text extends CanvasObject {
    defaultProperties: TextProperties = defaultTextProperties;

    text: string;
    textStyle: TextStyle;
    shouldStroke: boolean;

    constructor(
        pxFromCanvasTop: number,
        pxFromCanvasLeft: number,
        widthInPx: number,
        lengthInPx: number,
        properties?: Partial<TextProperties>
    ) {
        super(pxFromCanvasTop, pxFromCanvasLeft, widthInPx, lengthInPx, "text");

        const mergedProperties = { ...defaultTextProperties, ...properties };
        applyProperties(this, mergedProperties);
    }

    update(delta: number): void {
    }

    draw(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D): void {
        ctx.beginPath();
        canvas_text(ctx, 0, 0, this.text, this.textStyle);
    }
}

export { Text };
export type { TextProperties, TextStyle };
