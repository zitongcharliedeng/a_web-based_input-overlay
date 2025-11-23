import { CanvasObjectInstance } from './BaseCanvasObject';
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
		ctx.font = this.config.textStyle.font ?? "30px Lucida Console";

		const x = 0;
		const y = this.config.hitboxSize.lengthInPx / 2;

		if (this.config.shouldStroke) {
			ctx.strokeStyle = this.config.textStyle.strokeStyle ?? "white";
			// Canvas strokes centered on path (50% inside, 50% outside)
			// fillText covers inner half, so double lineWidth for correct visual width
			ctx.lineWidth = (this.config.textStyle.strokeWidth ?? 3) * 2;
			ctx.strokeText(this.config.text, x, y);
		}

		ctx.fillStyle = this.config.textStyle.fillStyle ?? "black";
		ctx.fillText(this.config.text, x, y);
	}
}
