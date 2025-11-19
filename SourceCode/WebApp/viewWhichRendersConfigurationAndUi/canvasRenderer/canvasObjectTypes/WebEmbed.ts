import { CanvasObjectInstance } from './BaseCanvasObject';
import { WebEmbedSchema, type WebEmbedConfig } from '../../../modelToSaveCustomConfigurationLocally/configSchema';

// Global iframe registry to prevent duplicates when objects are recreated each frame
const iframeRegistry = new Map<number, HTMLIFrameElement>();

export class WebEmbed extends CanvasObjectInstance {
	override readonly config: WebEmbedConfig;
	runtimeState: {
		iframe: HTMLIFrameElement | null;
	};

	constructor(configOverrides: Partial<WebEmbedConfig> | undefined, objArrayIdx: number) {
		super(objArrayIdx);
		this.config = WebEmbedSchema.parse(configOverrides || {});
		this.runtimeState = {
			iframe: null
		};

		this.findOrCreateIframe();
	}

	private findOrCreateIframe(): void {
		// Check if iframe already exists for this object index
		const existing = iframeRegistry.get(this.objArrayIdx);
		if (existing && existing.parentNode) {
			this.runtimeState.iframe = existing;
			// Update URL if changed
			if (this.runtimeState.iframe.src !== this.config.url) {
				this.runtimeState.iframe.src = this.config.url;
			}
			return;
		}

		// Create new iframe only if it doesn't exist
		this.runtimeState.iframe = document.createElement('iframe');
		this.runtimeState.iframe.src = this.config.url;
		this.runtimeState.iframe.style.position = 'absolute';

		const padding = 50;  // 50px border for dragging and right-click
		this.runtimeState.iframe.style.left = (this.config.positionOnCanvas.pxFromCanvasLeft + padding) + 'px';
		this.runtimeState.iframe.style.top = (this.config.positionOnCanvas.pxFromCanvasTop + padding) + 'px';
		this.runtimeState.iframe.style.width = (this.config.hitboxSize.widthInPx - padding * 2) + 'px';
		this.runtimeState.iframe.style.height = (this.config.hitboxSize.lengthInPx - padding * 2) + 'px';

		this.runtimeState.iframe.style.opacity = this.config.opacity.toString();
		this.runtimeState.iframe.style.border = '2px solid #B4B4B4';
		this.runtimeState.iframe.style.pointerEvents = this.config.interactionMode === 'readonly' ? 'none' : 'auto';
		this.runtimeState.iframe.style.zIndex = '1';
		this.runtimeState.iframe.setAttribute('allowfullscreen', '');
		this.runtimeState.iframe.setAttribute('allowtransparency', 'true');

		// Fix YouTube Error 153: YouTube requires referrer policy and permissions
		this.runtimeState.iframe.setAttribute('referrerpolicy', 'strict-origin-when-cross-origin');
		this.runtimeState.iframe.setAttribute('allow', 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share');

		document.body.appendChild(this.runtimeState.iframe);

		// Register iframe to prevent duplicates
		iframeRegistry.set(this.objArrayIdx, this.runtimeState.iframe);
	}

	override update(): boolean {
		if (this.runtimeState.iframe) {
			const padding = 50;  // 50px border for dragging and right-click
			this.runtimeState.iframe.style.left = (this.config.positionOnCanvas.pxFromCanvasLeft + padding) + 'px';
			this.runtimeState.iframe.style.top = (this.config.positionOnCanvas.pxFromCanvasTop + padding) + 'px';
			this.runtimeState.iframe.style.width = (this.config.hitboxSize.widthInPx - padding * 2) + 'px';
			this.runtimeState.iframe.style.height = (this.config.hitboxSize.lengthInPx - padding * 2) + 'px';
			this.runtimeState.iframe.style.opacity = this.config.opacity.toString();
			this.runtimeState.iframe.style.pointerEvents = this.config.interactionMode === 'readonly' ? 'none' : 'auto';
		}
		return false;
	}

	override draw(_canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D, isDragPreview: boolean = false): void {
		const padding = 50;

		// Hide iframe during drag preview (DOM element, not affected by canvas globalAlpha)
		if (this.runtimeState.iframe) {
			this.runtimeState.iframe.style.display = isDragPreview ? 'none' : 'block';
		}

		// ALWAYS draw purple magenta border (full hitbox)
		ctx.strokeStyle = '#FF00FF';
		ctx.lineWidth = 2;
		ctx.strokeRect(0, 0, this.config.hitboxSize.widthInPx, this.config.hitboxSize.lengthInPx);

		// Only during drag: show gray background and labels
		if (isDragPreview) {
			// Gray background fill (only behind iframe content area)
			ctx.fillStyle = '#808080';
			ctx.fillRect(padding, padding, this.config.hitboxSize.widthInPx - padding * 2, this.config.hitboxSize.lengthInPx - padding * 2);

			// Inner gray border (actual iframe boundary)
			ctx.strokeStyle = '#B4B4B4';
			ctx.lineWidth = 2;
			ctx.strokeRect(padding, padding, this.config.hitboxSize.widthInPx - padding * 2, this.config.hitboxSize.lengthInPx - padding * 2);

			// URL label at top
			ctx.fillStyle = 'black';
			ctx.font = '14px monospace';
			ctx.fillText(this.config.url, padding + 5, padding - 10);

			// "WebEmbed" label in center
			ctx.font = '20px sans-serif';
			ctx.textAlign = 'center';
			ctx.textBaseline = 'middle';
			ctx.fillText('WebEmbed', this.config.hitboxSize.widthInPx / 2, this.config.hitboxSize.lengthInPx / 2);
		}
	}

	override cleanup(): void {
		if (this.runtimeState.iframe && this.runtimeState.iframe.parentNode) {
			this.runtimeState.iframe.parentNode.removeChild(this.runtimeState.iframe);
			this.runtimeState.iframe = null;
		}
		// Remove from registry to allow proper cleanup
		iframeRegistry.delete(this.objArrayIdx);
	}
}
