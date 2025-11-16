/**
 * CanvasRenderer: Pure MVC View
 *
 * Responsibilities:
 * - Deserialize OmniConfig to canvas objects
 * - Render canvas objects
 * - Call update() on objects
 * - NO state management (stateless - reads from config parameter)
 * - NO input handling
 * - NO caching (pure function - rebuild every frame)
 *
 * Phase2: Removed cachedObjects, deserializes from config every frame
 */

import type { OmniConfig, CanvasObjectConfig } from '../../modelToSaveCustomConfigurationLocally/OmniConfig';
import type { CanvasObject } from './canvasObjectTypes/index';

export class CanvasRenderer {
	private canvas: HTMLCanvasElement;
	private ctx: CanvasRenderingContext2D;
	private deserializer: (objData: CanvasObjectConfig, objArrayIdx: number) => CanvasObject;
	private cache: { config: OmniConfig; objects: CanvasObject[] } | null = null;

	constructor(canvas: HTMLCanvasElement, deserializer: (objData: CanvasObjectConfig, objArrayIdx: number) => CanvasObject) {
		this.canvas = canvas;
		const ctx = canvas.getContext('2d');
		if (!ctx) throw new Error('Failed to get 2D context');
		this.ctx = ctx;
		this.deserializer = deserializer;
	}

	/**
	 * Deserialize config to canvas objects (pure function)
	 */
	private deserializeObjects(config: OmniConfig): CanvasObject[] {
		const objects: CanvasObject[] = [];
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
	update(config: OmniConfig, delta: number): readonly CanvasObject[] {
		if (this.cache?.config !== config) {
			this.cache = {
				config,
				objects: this.deserializeObjects(config)
			};
		}

		for (let i = 0; i < this.cache.objects.length; i++) {
			const obj = this.cache.objects[i];
			if (obj) obj.update(delta);
		}

		return this.cache.objects;
	}

	/**
	 * Render all objects to canvas from config (pure MVC)
	 */
	render(objects: readonly CanvasObject[]): void {
		this.ctx.setTransform(1, 0, 0, 1, 0, 0);
		this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

		for (let i = 0; i < objects.length; i++) {
			const object = objects[i];
			if (!object) continue;
			this.ctx.setTransform(
				1, 0, 0, 1,
				object.positionOnCanvas.pxFromCanvasLeft,
				object.positionOnCanvas.pxFromCanvasTop
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
	renderDebugHitboxes(objects: readonly CanvasObject[]): void {
		for (let i = 0; i < objects.length; i++) {
			const object = objects[i];
			if (!object) continue;
			this.ctx.setTransform(1, 0, 0, 1, object.positionOnCanvas.pxFromCanvasLeft, object.positionOnCanvas.pxFromCanvasTop);
			this.ctx.beginPath();
			this.ctx.strokeStyle = "#FF00FF";
			this.ctx.lineWidth = 1;
			this.ctx.rect(0, 0, object.hitboxSize.widthInPx, object.hitboxSize.lengthInPx);
			this.ctx.stroke();
		}
	}
}
