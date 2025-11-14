import { CanvasObject } from './BaseCanvasObject.js';

interface WebEmbedConfig {
	url?: string;
	opacity?: number;
}

interface WebEmbedProperties {
	url?: string;
	opacity?: number;
}

interface WebEmbedConfigDefaults {
	url: string;
	opacity: number;
}

const defaultWebEmbedProperties: { url: string; opacity: number } = {
	url: "https://www.twitch.tv/",
	opacity: 1.0
};

class WebEmbed extends CanvasObject {
	defaultProperties: WebEmbedProperties = defaultWebEmbedProperties;
	className: string = "WebEmbed";

	url: string = "https://www.twitch.tv/";
	opacity: number = 1.0;
	iframe: HTMLIFrameElement | null = null;

	constructor(x: number, y: number, width: number, height: number, properties?: WebEmbedProperties, layerLevel?: number) {
		super(
			{ pxFromCanvasTop: y, pxFromCanvasLeft: x },
			{ widthInPx: width, lengthInPx: height },
			"webEmbed",
			layerLevel ?? 10
		);

		const props = properties ?? {};
		const defaults = defaultWebEmbedProperties;

		this.url = props.url ?? defaults.url;
		this.opacity = props.opacity ?? defaults.opacity;

		// Create iframe element
		this.createIframe();
	}

	private createIframe(): void {
		this.iframe = document.createElement('iframe');
		this.iframe.src = this.url;
		this.iframe.style.position = 'absolute';
		this.iframe.style.left = this.positionOnCanvas.pxFromCanvasLeft + 'px';
		this.iframe.style.top = this.positionOnCanvas.pxFromCanvasTop + 'px';
		this.iframe.style.width = this.hitboxSize.widthInPx + 'px';
		this.iframe.style.height = this.hitboxSize.lengthInPx + 'px';
		this.iframe.style.opacity = this.opacity.toString();
		this.iframe.style.border = 'none';
		this.iframe.style.pointerEvents = 'auto';
		this.iframe.setAttribute('allowfullscreen', '');

		document.body.appendChild(this.iframe);
	}

	update(delta: number): boolean {
		// Update iframe position if object moved
		if (this.iframe) {
			this.iframe.style.left = this.positionOnCanvas.pxFromCanvasLeft + 'px';
			this.iframe.style.top = this.positionOnCanvas.pxFromCanvasTop + 'px';
			this.iframe.style.width = this.hitboxSize.widthInPx + 'px';
			this.iframe.style.height = this.hitboxSize.lengthInPx + 'px';
			this.iframe.style.opacity = this.opacity.toString();
		}
		return false; // WebEmbed doesn't need canvas redraw
	}

	draw(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D): void {
		// Draw a border/outline on canvas to show the iframe position
		ctx.strokeStyle = '#B4B4B4';
		ctx.lineWidth = 2;
		ctx.strokeRect(0, 0, this.hitboxSize.widthInPx, this.hitboxSize.lengthInPx);

		// Draw URL text at top
		ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
		ctx.fillRect(0, 0, this.hitboxSize.widthInPx, 25);
		ctx.fillStyle = '#cdc1c1';
		ctx.font = '12px Lucida Console';
		ctx.fillText(this.url, 5, 17);
	}

	cleanup(): void {
		// Remove iframe when object is deleted
		if (this.iframe && this.iframe.parentNode) {
			this.iframe.parentNode.removeChild(this.iframe);
			this.iframe = null;
		}
	}
}

// Template for creating new WebEmbed objects
export const defaultTemplateFor_WebEmbed: WebEmbedConfigDefaults = {
	url: "https://www.twitch.tv/",
	opacity: 1.0
};

export { WebEmbed };
