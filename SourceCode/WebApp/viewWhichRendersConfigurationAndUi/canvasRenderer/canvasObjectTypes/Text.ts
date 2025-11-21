import { CanvasObjectInstance } from './BaseCanvasObject';
import { canvas_text } from '../canvasDrawingHelpers';
import { TextSchema, type TextConfig } from '../../../modelToSaveCustomConfigurationLocally/configSchema';

export class Text extends CanvasObjectInstance {
	override readonly config: TextConfig;

	constructor(configOverrides: Partial<TextConfig> | undefined, objArrayIdx: number) {
		super(objArrayIdx);
		this.config = TextSchema.parse(configOverrides || {});
	}

	override update(): boolean {
		return true;
	}

	override draw(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D): void {
		ctx.beginPath();
		ctx.textBaseline = 'middle';
		ctx.textAlign = 'left';

		// Left-align text, vertically centered
		const x = 0;
		const y = this.config.hitboxSize.lengthInPx / 2;

		if (this.config.shouldStroke) {
			ctx.strokeStyle = this.config.textStyle.strokeStyle ?? "white";
			ctx.lineWidth = this.config.textStyle.strokeWidth ?? 3;
			ctx.strokeText(this.config.text, x, y);
		}
		canvas_text(ctx, x, y, this.config.text, this.config.textStyle);
	}
}
