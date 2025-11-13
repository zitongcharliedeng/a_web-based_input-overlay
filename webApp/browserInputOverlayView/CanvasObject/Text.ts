import { CanvasObject } from './index.js';
import { canvas_text } from '../_helpers/draw.js';

interface TextStyle {
    textAlign?: CanvasTextAlign;
    fillStyle?: string;
    font?: string;
    strokeStyle?: string;
    strokeWidth?: number;
}

interface TextProperties {
    text?: string;
    textStyle?: TextStyle;
    shouldStroke?: boolean;
}

const defaultTextProperties: TextProperties = {
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
    defaultProperties: TextProperties = defaultTextProperties;

    text: string;
    textStyle: TextStyle;
    shouldStroke: boolean;

    constructor(
        pxFromCanvasTop: number,
        pxFromCanvasLeft: number,
        widthInPx: number,
        lengthInPx: number,
        properties?: TextProperties,
        layerLevel?: number
    ) {
        super(
            { pxFromCanvasTop, pxFromCanvasLeft },
            { widthInPx, lengthInPx },
            "text",
            layerLevel ?? 20
        );

        const props = properties ?? {};
        const defaults = defaultTextProperties;

        this.text = props.text ?? defaults.text!;
        this.textStyle = { ...defaults.textStyle, ...props.textStyle };
        this.shouldStroke = props.shouldStroke ?? defaults.shouldStroke!;
    }

    update(delta: number): boolean {
        return true;
    }

    draw(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D): void {
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
export type { TextProperties, TextStyle };
