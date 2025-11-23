import { CanvasObjectInstance } from './BaseCanvasObject';
import { WebEmbedSchema, type WebEmbedConfig } from '../../../modelToSaveCustomConfigurationLocally/configSchema';

const webEmbedRegistry = new Map<number, HTMLIFrameElement>();

/**
 * WebEmbed: iframe-based web content embedding
 *
 * Uses standard DOM iframe for both web and Electron
 * Lifecycle: Registry prevents duplication, cleanup called by CanvasRenderer
 */
export class WebEmbed extends CanvasObjectInstance {
	override readonly config: WebEmbedConfig;

	constructor(configOverrides: Partial<WebEmbedConfig> | undefined, objArrayIdx: number) {
		super(objArrayIdx);
		this.config = WebEmbedSchema.parse(configOverrides || {});
		this.initializeEmbed();
	}

	private initializeEmbed(): void {
		const existing = webEmbedRegistry.get(this.objArrayIdx);
		if (existing && existing.parentNode) {
			if (existing.src !== this.config.url) {
				existing.src = this.config.url;
			}
			return;
		}

		const padding = 50;
		const iframe = document.createElement('iframe');
		iframe.src = this.config.url;
		iframe.setAttribute('referrerpolicy', 'strict-origin-when-cross-origin');
		iframe.setAttribute('allow', 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen');

		iframe.style.position = 'absolute';
		iframe.style.left = (this.config.positionOnCanvas.pxFromCanvasLeft + padding) + 'px';
		iframe.style.top = (this.config.positionOnCanvas.pxFromCanvasTop + padding) + 'px';
		iframe.style.width = (this.config.hitboxSize.widthInPx - padding * 2) + 'px';
		iframe.style.height = (this.config.hitboxSize.lengthInPx - padding * 2) + 'px';
		iframe.style.opacity = this.config.opacity.toString();
		iframe.style.border = '2px solid #B4B4B4';
		iframe.style.pointerEvents = this.config.interactionMode === 'readonly' ? 'none' : 'auto';
		iframe.style.zIndex = '1';

		document.body.appendChild(iframe);
		webEmbedRegistry.set(this.objArrayIdx, iframe);
	}

	override update(): boolean {
		const iframe = webEmbedRegistry.get(this.objArrayIdx);
		if (!iframe) return false;

		const padding = 50;
		iframe.style.left = (this.config.positionOnCanvas.pxFromCanvasLeft + padding) + 'px';
		iframe.style.top = (this.config.positionOnCanvas.pxFromCanvasTop + padding) + 'px';
		iframe.style.width = (this.config.hitboxSize.widthInPx - padding * 2) + 'px';
		iframe.style.height = (this.config.hitboxSize.lengthInPx - padding * 2) + 'px';
		iframe.style.opacity = this.config.opacity.toString();
		iframe.style.pointerEvents = this.config.interactionMode === 'readonly' ? 'none' : 'auto';

		return false;
	}

	override draw(_canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D, isDragPreview: boolean = false): void {
		const padding = 50;
		const iframe = webEmbedRegistry.get(this.objArrayIdx);

		if (iframe) {
			iframe.style.display = isDragPreview ? 'none' : 'block';
		}

		if (isDragPreview) {
			ctx.fillStyle = '#808080';
			ctx.fillRect(padding, padding, this.config.hitboxSize.widthInPx - padding * 2, this.config.hitboxSize.lengthInPx - padding * 2);

			ctx.strokeStyle = '#B4B4B4';
			ctx.lineWidth = 2;
			ctx.strokeRect(padding, padding, this.config.hitboxSize.widthInPx - padding * 2, this.config.hitboxSize.lengthInPx - padding * 2);

			ctx.fillStyle = 'black';
			ctx.font = '14px monospace';
			ctx.fillText(this.config.url, padding + 5, padding - 10);

			ctx.font = '20px sans-serif';
			ctx.textAlign = 'center';
			ctx.textBaseline = 'middle';
			ctx.fillText('WebEmbed', this.config.hitboxSize.widthInPx / 2, this.config.hitboxSize.lengthInPx / 2);
		}
	}

	override cleanup(): void {
		const iframe = webEmbedRegistry.get(this.objArrayIdx);
		if (!iframe) return;

		if (iframe.parentNode) {
			iframe.parentNode.removeChild(iframe);
		}

		webEmbedRegistry.delete(this.objArrayIdx);
	}
}
