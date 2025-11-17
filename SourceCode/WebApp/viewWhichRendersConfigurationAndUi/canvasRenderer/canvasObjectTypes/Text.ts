import { CanvasObjectInstance } from './BaseCanvasObject';
import { canvas_text } from '../canvasDrawingHelpers';
import { deepMerge } from '../_helpers/deepMerge';
import type { DeepPartial } from '../../../_helpers/TypeUtilities';
import { TextSchema, type TextConfig } from '../../../modelToSaveCustomConfigurationLocally/configSchema';

export class Text extends CanvasObjectInstance {
	// Single source of truth: Zod schema with defaults
	static readonly configDefaults: TextConfig = TextSchema.parse({});

	override readonly config: TextConfig;

	constructor(configOverrides: DeepPartial<TextConfig>, objArrayIdx: number) {
		const config = deepMerge(Text.configDefaults, configOverrides || {});
		super(objArrayIdx);
		this.config = config;
	}

	override update(): boolean {
		return true;
	}

	override draw(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D): void {
		ctx.beginPath();
		ctx.textBaseline = 'middle';
		ctx.textAlign = 'center';

		// Center text in hitbox
		const x = this.config.hitboxSize.widthInPx / 2;
		const y = this.config.hitboxSize.lengthInPx / 2;

		if (this.config.shouldStroke) {
			ctx.strokeStyle = this.config.textStyle.strokeStyle ?? "white";
			ctx.lineWidth = this.config.textStyle.strokeWidth ?? 3;
			ctx.strokeText(this.config.text, x, y);
		}
		canvas_text(ctx, x, y, this.config.text, this.config.textStyle);
	}
}
