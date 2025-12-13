import { CanvasObjectInstance } from './BaseCanvasObject';
import { WebEmbedSchema, type WebEmbedConfig } from '../../../modelToSaveCustomConfigurationLocally/configSchema';

const embedRegistry = new Map<number, HTMLIFrameElement>();
const isElectron = typeof window !== 'undefined' && (window as { electronAPI?: unknown }).electronAPI !== undefined;

/**
 * WebEmbed: Platform-agnostic external web content embedding
 *
 * Web: iframe in DOM
 * Electron: WebContentsView via IPC (proper headers, no Error 153)
 *
 * Behavioral parity: Same visual result, same config interface
 */
export class WebEmbed extends CanvasObjectInstance {
	override readonly config: WebEmbedConfig;
	runtimeState: {
		embedElement: HTMLIFrameElement | null;
	};

	constructor(configOverrides: Partial<WebEmbedConfig> | undefined, objArrayIdx: number) {
		super(objArrayIdx);
		this.config = WebEmbedSchema.parse(configOverrides || {});
		this.runtimeState = {
			embedElement: null
		};

		this.initializeEmbed();
	}

	private initializeEmbed(): void {
		const existing = embedRegistry.get(this.objArrayIdx);
		if (existing && existing.parentNode) {
			this.runtimeState.embedElement = existing;
			if (existing.src !== this.config.url) {
				existing.src = this.config.url;
			}
			return;
		}

		const padding = 50;
		const bounds = {
			x: this.config.positionOnCanvas.pxFromCanvasLeft + padding,
			y: this.config.positionOnCanvas.pxFromCanvasTop + padding,
			width: this.config.hitboxSize.widthInPx - padding * 2,
			height: this.config.hitboxSize.lengthInPx - padding * 2
		};

		if (isElectron) {
			(window as { electronAPI: { webEmbed: { create: (id: number, url: string, bounds: typeof bounds) => void } } }).electronAPI.webEmbed.create(
				this.objArrayIdx,
				this.config.url,
				bounds
			);
		} else {
			const iframe = document.createElement('iframe');
			iframe.src = this.config.url;
			iframe.setAttribute('referrerpolicy', 'strict-origin-when-cross-origin');
			iframe.setAttribute('allow', 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen');
			iframe.setAttribute('sandbox', 'allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox allow-forms allow-presentation');
			iframe.setAttribute('allowfullscreen', '');

			iframe.style.position = 'absolute';
			iframe.style.left = bounds.x + 'px';
			iframe.style.top = bounds.y + 'px';
			iframe.style.width = bounds.width + 'px';
			iframe.style.height = bounds.height + 'px';
			iframe.style.opacity = this.config.opacity.toString();
			iframe.style.border = '2px solid #B4B4B4';
			iframe.style.pointerEvents = this.config.interactionMode === 'readonly' ? 'none' : 'auto';
			iframe.style.zIndex = '1';

			document.body.appendChild(iframe);
			this.runtimeState.embedElement = iframe;
			embedRegistry.set(this.objArrayIdx, iframe);
		}
	}

	override update(): boolean {
		const padding = 50;
		const bounds = {
			x: this.config.positionOnCanvas.pxFromCanvasLeft + padding,
			y: this.config.positionOnCanvas.pxFromCanvasTop + padding,
			width: this.config.hitboxSize.widthInPx - padding * 2,
			height: this.config.hitboxSize.lengthInPx - padding * 2
		};

		if (isElectron) {
			(window as { electronAPI: { webEmbed: { update: (id: number, bounds: typeof bounds) => void } } }).electronAPI.webEmbed.update(
				this.objArrayIdx,
				bounds
			);
		} else if (this.runtimeState.embedElement) {
			this.runtimeState.embedElement.style.left = bounds.x + 'px';
			this.runtimeState.embedElement.style.top = bounds.y + 'px';
			this.runtimeState.embedElement.style.width = bounds.width + 'px';
			this.runtimeState.embedElement.style.height = bounds.height + 'px';
			this.runtimeState.embedElement.style.opacity = this.config.opacity.toString();
			this.runtimeState.embedElement.style.pointerEvents = this.config.interactionMode === 'readonly' ? 'none' : 'auto';
		}
		return false;
	}

	override draw(_canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D, isDragPreview: boolean = false): void {
		const padding = 50;

		if (!isElectron && this.runtimeState.embedElement) {
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
		if (isElectron) {
			(window as { electronAPI: { webEmbed: { destroy: (id: number) => void } } }).electronAPI.webEmbed.destroy(this.objArrayIdx);
		} else {
			if (this.runtimeState.embedElement?.parentNode) {
				this.runtimeState.embedElement.parentNode.removeChild(this.runtimeState.embedElement);
				this.runtimeState.embedElement = null;
			}
			embedRegistry.delete(this.objArrayIdx);
		}
	}
}
