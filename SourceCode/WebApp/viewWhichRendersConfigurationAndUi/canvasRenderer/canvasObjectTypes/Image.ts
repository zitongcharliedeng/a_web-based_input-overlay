import { CanvasObjectInstance } from './BaseCanvasObject';
import { deepMerge } from '../_helpers/deepMerge';
import type { DeepPartial } from '../../../_helpers/TypeUtilities';
import { ImageSchema, type ImageConfig } from '../../../modelToSaveCustomConfigurationLocally/configSchema';

export class Image extends CanvasObjectInstance {
	// Single source of truth: Zod schema with defaults
	static readonly configDefaults: ImageConfig = ImageSchema.parse({});

	override readonly config: ImageConfig;
	runtimeState: {
		imageElement: HTMLImageElement;
	};

	constructor(configOverrides: DeepPartial<ImageConfig>, objArrayIdx: number) {
		const config = deepMerge(Image.configDefaults, configOverrides || {});
		super(objArrayIdx);
		this.config = config;
		this.runtimeState = {
			imageElement: new window.Image()
		};
		this.runtimeState.imageElement.src = this.config.src;
	}

	override update(): boolean {
		return this.runtimeState.imageElement.complete;
	}

	override draw(_canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D): void {
		if (!this.runtimeState.imageElement.complete) return;

		const prevAlpha = ctx.globalAlpha;
		ctx.globalAlpha = this.config.opacity;

		try {
			ctx.drawImage(
				this.runtimeState.imageElement,
				0, 0,
				this.runtimeState.imageElement.width, this.runtimeState.imageElement.height,
				0, 0,
				this.config.hitboxSize.widthInPx, this.config.hitboxSize.lengthInPx
			);
		} catch {
		}

		ctx.globalAlpha = prevAlpha;
	}
}
