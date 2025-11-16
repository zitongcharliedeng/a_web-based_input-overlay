import { CanvasObject } from './BaseCanvasObject';
import { deepMerge } from '../_helpers/deepMerge';
import type { WebEmbedConfig, WebEmbedTemplate, CanvasObjectConfig } from '../../../modelToSaveCustomConfigurationLocally/OmniConfig';

class WebEmbed extends CanvasObject {
	static readonly TYPE = 'webEmbed' as const;
	static readonly DISPLAY_NAME = 'WebEmbed';

	static fromConfig(config: CanvasObjectConfig, objArrayIdx: number): WebEmbed {
		if (!('webEmbed' in config)) {
			throw new Error('Invalid config for WebEmbed: expected { webEmbed: {...} }');
		}
		return new WebEmbed(config.webEmbed, objArrayIdx);
	}

	className: string = "webEmbed";

	url: WebEmbedTemplate['url'];
	opacity: WebEmbedTemplate['opacity'];
	iframe: HTMLIFrameElement | null = null;

	constructor(config: Partial<WebEmbedConfig>, objArrayIdx: number) {
		const defaults: Required<WebEmbedConfig> = {
			positionOnCanvas: { pxFromCanvasLeft: 0, pxFromCanvasTop: 0 },
			hitboxSize: { widthInPx: 640, lengthInPx: 480 },
			layerLevel: 10,
			url: "https://www.twitch.tv/",
			opacity: 1.0
		};

		const merged = deepMerge(defaults, config) as Required<WebEmbedConfig>;

		super(
			objArrayIdx,
			merged.positionOnCanvas,
			merged.hitboxSize,
			"webEmbed",
			merged.layerLevel
		);

		this.url = merged.url;
		this.opacity = merged.opacity;

		this.createIframe();
	}

	private createIframe(): void {
		this.iframe = document.createElement('iframe');
		this.iframe.src = this.url;
		this.iframe.style.position = 'absolute';

		// Add 10px padding inside hitbox for right-click detection
		const padding = 10;
		this.iframe.style.left = (this.positionOnCanvas.pxFromCanvasLeft + padding) + 'px';
		this.iframe.style.top = (this.positionOnCanvas.pxFromCanvasTop + padding) + 'px';
		this.iframe.style.width = (this.hitboxSize.widthInPx - padding * 2) + 'px';
		this.iframe.style.height = (this.hitboxSize.lengthInPx - padding * 2) + 'px';

		this.iframe.style.opacity = this.opacity.toString();
		this.iframe.style.border = '2px solid #B4B4B4';
		this.iframe.style.pointerEvents = 'none'; // Pass clicks through to canvas
		this.iframe.style.zIndex = '1'; // Below UI windows (which use z-index 100+)
		this.iframe.setAttribute('allowfullscreen', '');

		document.body.appendChild(this.iframe);
	}

	update(): boolean {
		// Update iframe position if object moved
		if (this.iframe) {
			const padding = 10;
			this.iframe.style.left = (this.positionOnCanvas.pxFromCanvasLeft + padding) + 'px';
			this.iframe.style.top = (this.positionOnCanvas.pxFromCanvasTop + padding) + 'px';
			this.iframe.style.width = (this.hitboxSize.widthInPx - padding * 2) + 'px';
			this.iframe.style.height = (this.hitboxSize.lengthInPx - padding * 2) + 'px';
			this.iframe.style.opacity = this.opacity.toString();
		}
		return false; // WebEmbed doesn't need canvas redraw
	}

	draw(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D): void {
		// Draw magenta hitbox border (10px padding for right-click detection)
		ctx.strokeStyle = '#FF00FF';
		ctx.lineWidth = 3;
		ctx.strokeRect(0, 0, this.hitboxSize.widthInPx, this.hitboxSize.lengthInPx);

		// Draw inner border where iframe actually is
		const padding = 10;
		ctx.strokeStyle = '#B4B4B4';
		ctx.lineWidth = 1;
		ctx.strokeRect(padding, padding, this.hitboxSize.widthInPx - padding * 2, this.hitboxSize.lengthInPx - padding * 2);

		// Draw URL text at top in the padding area
		ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
		ctx.fillRect(0, 0, this.hitboxSize.widthInPx, padding);
		ctx.fillStyle = '#FFFFFF';
		ctx.font = '10px Lucida Console';
		ctx.fillText(this.url.substring(0, 50), 2, 8);
	}

	override cleanup(): void {
		// Remove iframe when object is deleted
		if (this.iframe && this.iframe.parentNode) {
			this.iframe.parentNode.removeChild(this.iframe);
			this.iframe = null;
		}
	}
}

// Template for creating new WebEmbed objects
export const defaultTemplateFor_WebEmbed: WebEmbedTemplate = {
	url: "https://www.twitch.tv/",
	opacity: 1.0
};

export { WebEmbed };
