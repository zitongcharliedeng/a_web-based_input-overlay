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
		inputForwardingCleanupInElectron?: (() => void)[];
	};

	constructor(configOverrides: Partial<WebEmbedConfig> | undefined, objArrayIdx: number) {
		super(objArrayIdx);
		this.config = WebEmbedSchema.parse(configOverrides || {});
		this.runtimeState = {
			embedElement: null,
			inputForwardingCleanupInElectron: []
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

		const isElectron = typeof window !== 'undefined' && 'electronAPI' in window;

		let embedElement: EmbedElement;
		if (isElectron) {
			const webview = document.createElement('webview') as any;
			webview.setAttribute('src', this.config.url);
			webview.setAttribute('partition', 'persist:webembed');
			webview.setAttribute('useragent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
			webview.setAttribute('allowpopups', '');

			webview.addEventListener('did-fail-load', (e: any) => {
				console.error('[WebEmbed] Failed to load:', e.errorCode, e.errorDescription);
			});

			webview.addEventListener('console-message', (e: any) => {
				console.log('[WebEmbed Console]', e.level, e.message);
			});

			webview.addEventListener('did-finish-load', () => {
				console.log('[WebEmbed] Successfully loaded:', this.config.url);
			});

			embedElement = webview;
			console.log('[WebEmbed] Using <webview> tag for Electron with user-agent spoofing');
		} else {
			const iframe = document.createElement('iframe');
			iframe.src = this.config.url;
			iframe.setAttribute('referrerpolicy', 'strict-origin-when-cross-origin');
			iframe.setAttribute('allow', 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share');
			embedElement = iframe;
			console.log('[WebEmbed] Using <iframe> tag for web browser');
		}

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

		if (isElectron && this.config.inputForwardingInElectron) {
			this.setupInputForwardingInElectron(embedElement);
		}
	}

	/**
	 * Forwards keyboard and mouse events captured globally to the embedded page.
	 * Uses webview.sendInputEvent() API to bypass CORS restrictions.
	 */
	private setupInputForwardingInElectron(webviewElement: HTMLElement): void {
		if (!window.electronAPI) {
			console.warn('[WebEmbed] inputForwardingInElectron enabled but not in Electron environment');
			return;
		}

		const webview = webviewElement as any;

		console.log('[WebEmbed] Setting up input forwarding to embedded page');

		const keyDownHandler = (data: { keycode: number; rawcode: number }) => {
			webview.sendInputEvent({
				type: 'keyDown',
				keyCode: String.fromCharCode(data.keycode)
			});
		};
		window.electronAPI.onGlobalKeyDown(keyDownHandler);

		const keyUpHandler = (data: { keycode: number; rawcode: number }) => {
			webview.sendInputEvent({
				type: 'keyUp',
				keyCode: String.fromCharCode(data.keycode)
			});
		};
		window.electronAPI.onGlobalKeyUp(keyUpHandler);

		const mouseDownHandler = (data: { button: number; x: number; y: number }) => {
			webview.sendInputEvent({
				type: 'mouseDown',
				button: data.button === 1 ? 'left' : data.button === 2 ? 'right' : 'middle',
				x: data.x,
				y: data.y,
				clickCount: 1
			});
		};
		window.electronAPI.onGlobalMouseDown(mouseDownHandler);

		const mouseUpHandler = (data: { button: number; x: number; y: number }) => {
			webview.sendInputEvent({
				type: 'mouseUp',
				button: data.button === 1 ? 'left' : data.button === 2 ? 'right' : 'middle',
				x: data.x,
				y: data.y,
				clickCount: 1
			});
		};
		window.electronAPI.onGlobalMouseUp(mouseUpHandler);

		const mouseMoveHandler = (data: { x: number; y: number }) => {
			webview.sendInputEvent({
				type: 'mouseMove',
				x: data.x,
				y: data.y
			});
		};
		window.electronAPI.onGlobalMouseMove(mouseMoveHandler);

		this.runtimeState.inputForwardingCleanupInElectron = [
			() => console.log('[WebEmbed] Input forwarding cleanup (listeners remain active)')
		];
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
		if (this.runtimeState.inputForwardingCleanupInElectron) {
			this.runtimeState.inputForwardingCleanupInElectron.forEach(cleanup => cleanup());
			this.runtimeState.inputForwardingCleanupInElectron = [];
		}

		if (this.runtimeState.embedElement?.parentNode) {
			this.runtimeState.embedElement.parentNode.removeChild(this.runtimeState.embedElement);
			this.runtimeState.embedElement = null;
		}

		embedRegistry.delete(this.objArrayIdx);
	}
}
