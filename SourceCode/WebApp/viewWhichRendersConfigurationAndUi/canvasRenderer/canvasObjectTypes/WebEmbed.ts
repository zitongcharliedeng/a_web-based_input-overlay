import { CanvasObjectInstance } from './BaseCanvasObject';
import { WebEmbedSchema, type WebEmbedConfig } from '../../../modelToSaveCustomConfigurationLocally/configSchema';

// Type for embed elements (iframe in web, webview in Electron)
type EmbedElement = HTMLIFrameElement | HTMLElement;

// Global embed registry to prevent duplicates when objects are recreated each frame
const embedRegistry = new Map<number, EmbedElement>();

/**
 * WebEmbed: Embeds external web content in the overlay
 *
 * Implementation:
 * - Electron: Uses <webview> tag (proper YouTube/external site support)
 * - Browser: Uses <iframe> (may have restrictions with some sites)
 *
 * Supported Features:
 * - Display external content (YouTube, Twitch, etc.)
 * - Click interaction (when interactionMode = 'interactableOnFocus')
 * - Transparent overlay integration
 *
 * Electron-Only Features (gracefully ignored in browser):
 * - inputForwardingInElectron: Forward global keyboard/mouse events to embedded page
 *   (Uses webview.sendInputEvent() API to bypass CORS restrictions)
 *
 * Naming Convention:
 * - Config fields ending with "InElectron" indicate Electron-only features
 * - Website version gracefully ignores these (no errors, feature just doesn't work)
 */
export class WebEmbed extends CanvasObjectInstance {
	override readonly config: WebEmbedConfig;
	runtimeState: {
		embedElement: EmbedElement | null;
	};

	constructor(configOverrides: Partial<WebEmbedConfig> | undefined, objArrayIdx: number) {
		super(objArrayIdx);
		this.config = WebEmbedSchema.parse(configOverrides || {});
		this.runtimeState = {
			embedElement: null
		};

		this.findOrCreateEmbed();
	}

	private findOrCreateEmbed(): void {
		const existing = embedRegistry.get(this.objArrayIdx);
		if (existing && existing.parentNode) {
			this.runtimeState.embedElement = existing;
			const currentSrc = existing.getAttribute('src');
			if (currentSrc !== this.config.url) {
				existing.setAttribute('src', this.config.url);
			}
			return;
		}

		const iframe = document.createElement('iframe');
		iframe.src = this.config.url;
		iframe.setAttribute('referrerpolicy', 'strict-origin-when-cross-origin');
		iframe.setAttribute('allow', 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen');
		iframe.setAttribute('sandbox', 'allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox allow-forms allow-presentation');
		const embedElement: EmbedElement = iframe;

		embedElement.style.position = 'absolute';

		const padding = 50;  // 50px border for dragging and right-click
		embedElement.style.left = (this.config.positionOnCanvas.pxFromCanvasLeft + padding) + 'px';
		embedElement.style.top = (this.config.positionOnCanvas.pxFromCanvasTop + padding) + 'px';
		embedElement.style.width = (this.config.hitboxSize.widthInPx - padding * 2) + 'px';
		embedElement.style.height = (this.config.hitboxSize.lengthInPx - padding * 2) + 'px';

		embedElement.style.opacity = this.config.opacity.toString();
		embedElement.style.border = '2px solid #B4B4B4';
		embedElement.style.pointerEvents = this.config.interactionMode === 'readonly' ? 'none' : 'auto';
		embedElement.style.zIndex = '1';

		embedElement.setAttribute('allowfullscreen', '');
		embedElement.setAttribute('allowtransparency', 'true');

		document.body.appendChild(embedElement);

		this.runtimeState.embedElement = embedElement;
		embedRegistry.set(this.objArrayIdx, embedElement);
	}

	override update(): boolean {
		if (this.runtimeState.embedElement) {
			const padding = 50;  // 50px border for dragging and right-click
			this.runtimeState.embedElement.style.left = (this.config.positionOnCanvas.pxFromCanvasLeft + padding) + 'px';
			this.runtimeState.embedElement.style.top = (this.config.positionOnCanvas.pxFromCanvasTop + padding) + 'px';
			this.runtimeState.embedElement.style.width = (this.config.hitboxSize.widthInPx - padding * 2) + 'px';
			this.runtimeState.embedElement.style.height = (this.config.hitboxSize.lengthInPx - padding * 2) + 'px';
			this.runtimeState.embedElement.style.opacity = this.config.opacity.toString();
			this.runtimeState.embedElement.style.pointerEvents = this.config.interactionMode === 'readonly' ? 'none' : 'auto';
		}
		return false;
	}

	override draw(_canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D, isDragPreview: boolean = false): void {
		const padding = 50;

		if (this.runtimeState.embedElement) {
			this.runtimeState.embedElement.style.display = isDragPreview ? 'none' : 'block';
		}

		ctx.strokeStyle = '#FF00FF';
		ctx.lineWidth = 2;
		ctx.strokeRect(0, 0, this.config.hitboxSize.widthInPx, this.config.hitboxSize.lengthInPx);

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
		if (this.runtimeState.embedElement?.parentNode) {
			this.runtimeState.embedElement.parentNode.removeChild(this.runtimeState.embedElement);
			this.runtimeState.embedElement = null;
		}

		embedRegistry.delete(this.objArrayIdx);
	}
}
