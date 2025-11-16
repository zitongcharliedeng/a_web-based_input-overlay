import { CanvasObject } from './BaseCanvasObject';
import { canvas_text } from '../canvasDrawingHelpers';
import { deepMerge } from '../_helpers/deepMerge';
import type { TextConfig, TextTemplate, CanvasObjectConfig } from '../../../modelToSaveCustomConfigurationLocally/OmniConfig';


class Text extends CanvasObject {
    static readonly TYPE = 'text' as const;
    static readonly DISPLAY_NAME = 'Text';

    static fromConfig(config: CanvasObjectConfig, objArrayIdx: number): Text {
        if (!('text' in config)) {
            throw new Error('Invalid config for Text: expected { text: {...} }');
        }
        return new Text(config.text, objArrayIdx);
    }

    className: string = "text";

    text: TextTemplate['text'];
    textStyle: TextTemplate['textStyle'];
    shouldStroke: TextTemplate['shouldStroke'];

    constructor(config: Partial<TextConfig>, objArrayIdx: number) {
        const defaults = {
            positionOnCanvas: { pxFromCanvasLeft: 0, pxFromCanvasTop: 0 },
            hitboxSize: { widthInPx: 200, lengthInPx: 50 },
            layerLevel: 20,
            text: "Sample text",
            textStyle: {
                textAlign: "center" as CanvasTextAlign,
                fillStyle: "black",
                font: "30px Lucida Console",
                strokeStyle: "white",
                strokeWidth: 3
            },
            shouldStroke: true
        };

        const merged = deepMerge(defaults, config) as typeof defaults;

        super(
            objArrayIdx,
            merged.positionOnCanvas,
            merged.hitboxSize,
            "text",
            merged.layerLevel
        );

        this.text = merged.text;
        this.textStyle = merged.textStyle;
        this.shouldStroke = merged.shouldStroke;
    }

    update(): boolean {
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

export const defaultTemplateFor_Text = {
	text: "",
	textStyle: {
		textAlign: "left" satisfies CanvasTextAlign,
		fillStyle: "black",
		font: "20px Lucida Console",
		strokeStyle: "white",
		strokeWidth: 3
	},
	shouldStroke: true
} satisfies TextTemplate;
