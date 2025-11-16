import { CanvasObjectInstance } from './BaseCanvasObject';
import { deepMerge } from '../_helpers/deepMerge';
import type { DeepPartial } from '../../../_helpers/TypeUtilities';
import { WebEmbedSchema, type WebEmbedConfig } from '../../../modelToSaveCustomConfigurationLocally/configSchema';

export class WebEmbed extends CanvasObjectInstance {
	// Single source of truth: Zod schema with defaults
	static readonly configDefaults: WebEmbedConfig = WebEmbedSchema.parse({});

	override readonly config: WebEmbedConfig;
	runtimeState: {
		iframe: HTMLIFrameElement | null;
	};

	constructor(configOverrides: DeepPartial<WebEmbedConfig>, objArrayIdx: number) {
		const config = deepMerge(WebEmbed.configDefaults, configOverrides || {});
		super(objArrayIdx);
		this.config = config;
		this.runtimeState = {
			iframe: null
		};

		this.createIframe();
	}

	private createIframe(): void {
		this.runtimeState.iframe = document.createElement('iframe');
		this.runtimeState.iframe.src = this.config.url;
		this.runtimeState.iframe.style.position = 'absolute';

		const padding = 10;
		this.runtimeState.iframe.style.left = (this.config.positionOnCanvas.pxFromCanvasLeft + padding) + 'px';
		this.runtimeState.iframe.style.top = (this.config.positionOnCanvas.pxFromCanvasTop + padding) + 'px';
		this.runtimeState.iframe.style.width = (this.config.hitboxSize.widthInPx - padding * 2) + 'px';
		this.runtimeState.iframe.style.height = (this.config.hitboxSize.lengthInPx - padding * 2) + 'px';

		this.runtimeState.iframe.style.opacity = this.config.opacity.toString();
		this.runtimeState.iframe.style.border = '2px solid #B4B4B4';
		this.runtimeState.iframe.style.pointerEvents = 'none';
		this.runtimeState.iframe.style.zIndex = '1';
		this.runtimeState.iframe.setAttribute('allowfullscreen', '');

		document.body.appendChild(this.runtimeState.iframe);
	}

	override update(): boolean {
		if (this.runtimeState.iframe) {
			const padding = 10;
			this.runtimeState.iframe.style.left = (this.config.positionOnCanvas.pxFromCanvasLeft + padding) + 'px';
			this.runtimeState.iframe.style.top = (this.config.positionOnCanvas.pxFromCanvasTop + padding) + 'px';
			this.runtimeState.iframe.style.width = (this.config.hitboxSize.widthInPx - padding * 2) + 'px';
			this.runtimeState.iframe.style.height = (this.config.hitboxSize.lengthInPx - padding * 2) + 'px';
			this.runtimeState.iframe.style.opacity = this.config.opacity.toString();
		}
		return false;
	}

	override draw(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D): void {
		ctx.strokeStyle = '#FF00FF';
		ctx.lineWidth = 3;
		ctx.strokeRect(0, 0, this.config.hitboxSize.widthInPx, this.config.hitboxSize.lengthInPx);

		const padding = 10;
		ctx.strokeStyle = '#B4B4B4';
		ctx.lineWidth = 1;
		ctx.strokeRect(padding, padding, this.config.hitboxSize.widthInPx - padding * 2, this.config.hitboxSize.lengthInPx - padding * 2);

		ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
		ctx.fillRect(0, 0, this.config.hitboxSize.widthInPx, padding);
		ctx.fillStyle = '#FFFFFF';
		ctx.font = '10px Lucida Console';
		ctx.fillText(this.config.url.substring(0, 50), 2, 8);
	}

	override cleanup(): void {
		if (this.runtimeState.iframe && this.runtimeState.iframe.parentNode) {
			this.runtimeState.iframe.parentNode.removeChild(this.runtimeState.iframe);
			this.runtimeState.iframe = null;
		}
	}
}
