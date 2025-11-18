/**
 * CanvasRenderer: Pure MVC View
 *
 * Responsibilities:
 * - Deserialize CustomisableCanvasConfig to canvas objects
 * - Render canvas objects
 * - Call update() on objects
 * - NO state management (stateless - reads from config parameter)
 * - NO input handling
 * - NO caching (pure function - rebuild every frame)
 *
 * Phase2: Removed cachedObjects, deserializes from config every frame
 */

import type { CustomisableCanvasConfig, CanvasObjectConfig } from '../../modelToSaveCustomConfigurationLocally/CustomisableCanvasConfig';
import type { CanvasObjectInstance } from './canvasObjectTypes/index';

export class CanvasRenderer {
	private canvas: HTMLCanvasElement;
	private ctx: CanvasRenderingContext2D;
	private deserializer: (objData: CanvasObjectConfig, objArrayIdx: number) => CanvasObjectInstance;
	private cache: { config: CustomisableCanvasConfig; objects: CanvasObjectInstance[] } | null = null;

	constructor(canvas: HTMLCanvasElement, deserializer: (objData: CanvasObjectConfig, objArrayIdx: number) => CanvasObjectInstance) {
		this.canvas = canvas;
		const ctx = canvas.getContext('2d');
		if (!ctx) throw new Error('Failed to get 2D context');
		this.ctx = ctx;
		this.deserializer = deserializer;
	}

	/**
	 * Deserialize config to canvas objects (pure function)
	 */
	private deserializeObjects(config: CustomisableCanvasConfig): CanvasObjectInstance[] {
		const objects: CanvasObjectInstance[] = [];
		for (let objArrayIdx = 0; objArrayIdx < config.objects.length; objArrayIdx++) {
			const objConfig = config.objects[objArrayIdx];
			if (!objConfig) continue;
			try {
				objects.push(this.deserializer(objConfig, objArrayIdx));
			} catch (error) {
				console.error('[CanvasRenderer] Deserialization failed:', objConfig, error);
			}
		}
		return objects;
	}

	/**
	 * Update all objects (called before render)
	 * Returns deserialized objects for interaction handling
	 * Caches objects - only rebuilds when config reference changes (preserves runtime state like opacity for fades)
	 * Contract: ConfigManager must return new config reference on mutation (immutability)
	 */
	update(config: CustomisableCanvasConfig, delta: number): readonly CanvasObjectInstance[] {
		if (this.cache?.config !== config) {
			this.cache = {
				config,
				objects: this.deserializeObjects(config)
			};
		}

		// Cache is guaranteed non-null after above if block
		const cache = this.cache;
		if (!cache) throw new Error('Cache should be initialized');

		for (let i = 0; i < cache.objects.length; i++) {
			const obj = cache.objects[i];
			if (obj) obj.update(delta);
		}

		return cache.objects;
	}

	/**
	 * Render all objects to canvas from config (pure MVC)
	 * @param skipObjectIndex Optional index of object to skip (used during drag to prevent double-rendering)
	 */
	render(objects: readonly CanvasObjectInstance[], skipObjectIndex?: number): void {
		this.ctx.setTransform(1, 0, 0, 1, 0, 0);
		this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

		for (let i = 0; i < objects.length; i++) {
			if (i === skipObjectIndex) continue; // Skip dragged object to prevent full-opacity ghost
			const object = objects[i];
			if (!object) continue;
			this.ctx.setTransform(
				1, 0, 0, 1,
				object.config.positionOnCanvas.pxFromCanvasLeft,
				object.config.positionOnCanvas.pxFromCanvasTop
			);
			object.draw(this.canvas, this.ctx);
			this.ctx.closePath();
		}
	}

	/**
	 * Draw overlay (like hitboxes) on top of objects
	 */
	renderOverlay(drawFn: (canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D) => void): void {
		drawFn(this.canvas, this.ctx);
	}

	/**
	 * Render debug overlay (hitboxes for all objects)
	 * Phase3: Moved from InteractionController (MVC violation fix)
	 */
	renderDebugHitboxes(objects: readonly CanvasObjectInstance[]): void {
		for (let i = 0; i < objects.length; i++) {
			const object = objects[i];
			if (!object) continue;
			this.ctx.setTransform(1, 0, 0, 1, object.config.positionOnCanvas.pxFromCanvasLeft, object.config.positionOnCanvas.pxFromCanvasTop);
			this.ctx.beginPath();
			this.ctx.strokeStyle = "#FF00FF";
			this.ctx.lineWidth = 1;
			this.ctx.rect(0, 0, object.config.hitboxSize.widthInPx, object.config.hitboxSize.lengthInPx);
			this.ctx.stroke();
		}
	}
}
