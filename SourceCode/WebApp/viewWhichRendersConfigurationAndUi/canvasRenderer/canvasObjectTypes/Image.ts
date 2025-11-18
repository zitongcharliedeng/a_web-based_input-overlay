import { CanvasObjectInstance } from './BaseCanvasObject';
import { ImageSchema, type ImageConfig } from '../../../modelToSaveCustomConfigurationLocally/configSchema';

export class Image extends CanvasObjectInstance {
	override readonly config: ImageConfig;
	runtimeState: {
		imageElement: HTMLImageElement;
	};

	constructor(configOverrides: Partial<ImageConfig> | undefined, objArrayIdx: number) {
		super(objArrayIdx);
		this.config = ImageSchema.parse(configOverrides || {});
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

		ctx.save();
		ctx.globalAlpha *= this.config.opacity;

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

		ctx.restore();
	}
}
