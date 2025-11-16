import { CanvasObject } from './BaseCanvasObject';
import { canvas_text } from '../canvasDrawingHelpers';
import { deepMerge } from '../_helpers/deepMerge';
import type { TextConfig, TextTemplate, CanvasObjectConfig } from '../../../modelToSaveCustomConfigurationLocally/OmniConfig';
import { TextDefaults } from '../../../modelToSaveCustomConfigurationLocally/OmniConfig';


class Text extends CanvasObject {
    static readonly TYPE = 'text' as const;
    static readonly DISPLAY_NAME = 'Text';

    static fromConfig(config: CanvasObjectConfig, objArrayIdx: number): Text {
        if (!('text' in config)) {
            throw new Error('Invalid config for Text: expected { text: {...} }');
        }
        return new Text(config.text, objArrayIdx);
    }

    text: TextTemplate['text'];
    textStyle: TextTemplate['textStyle'];
    shouldStroke: TextTemplate['shouldStroke'];

    constructor(config: Partial<TextConfig>, objArrayIdx: number) {
        const merged = deepMerge(TextDefaults, config);

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
