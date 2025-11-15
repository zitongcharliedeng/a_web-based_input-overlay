import { CanvasObject } from './BaseCanvasObject';
import { canvas_text } from '../canvasDrawingHelpers';
import type { TextConfig, TextTemplate, CanvasObjectConfig } from '../../../modelToSaveCustomConfigurationLocally/OmniConfig';

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

const defaultTextProperties = {
    text: "Sample text",
    textStyle: {
        textAlign: "center" satisfies CanvasTextAlign,
        fillStyle: "black",
        font: "30px Lucida Console",
        strokeStyle: "white",
        strokeWidth: 3
    },
    shouldStroke: true,
} satisfies TextProperties;

class Text extends CanvasObject {
    static readonly TYPE = 'text' as const;
    static readonly DISPLAY_NAME = 'Text';
    static readonly DEFAULT_TEMPLATE: TextTemplate = {
        text: "",
        textStyle: {
            textAlign: "left" satisfies CanvasTextAlign,
            fillStyle: "black",
            font: "20px Lucida Console",
            strokeStyle: "white",
            strokeWidth: 3
        },
        shouldStroke: true
    };

    static fromConfig(config: CanvasObjectConfig): Text {
        if (config.type !== 'text') {
            throw new Error(`Invalid config type: expected text, got ${config.type}`);
        }
        return new Text(
            config.id,
            config.positionOnCanvas.pxFromCanvasTop,
            config.positionOnCanvas.pxFromCanvasLeft,
            config.hitboxSize.widthInPx,
            config.hitboxSize.lengthInPx,
            {
                text: config.text,
                textStyle: config.textStyle,
                shouldStroke: config.shouldStroke
            },
            config.layerLevel
        );
    }

    defaultProperties: TextProperties = defaultTextProperties;
    className: string = "Text";

    text: string;
    textStyle: TextStyle;
    shouldStroke: boolean;

    constructor(
        id: string,
        pxFromCanvasTop: number,
        pxFromCanvasLeft: number,
        widthInPx: number,
        lengthInPx: number,
        properties?: TextProperties,
        layerLevel?: number
    ) {
        super(
            id,
            { pxFromCanvasTop, pxFromCanvasLeft },
            { widthInPx, lengthInPx },
            "text",
            layerLevel ?? 20
        );

        const props = properties ?? {};
        const defaults = defaultTextProperties;

        this.text = props.text ?? (defaults.text || "");
        this.textStyle = { ...defaults.textStyle, ...props.textStyle };
        this.shouldStroke = props.shouldStroke ?? (defaults.shouldStroke || false);
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
export type { TextProperties, TextStyle };
