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

import type { OmniConfig } from '../../modelToSaveCustomConfigurationLocally/OmniConfig.js';

export interface CanvasObject {
	id: string;
	positionOnCanvas: { pxFromCanvasTop: number; pxFromCanvasLeft: number };
	hitboxSize: { widthInPx: number; lengthInPx: number };
	update: (delta: number) => boolean;
	draw: (canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D) => void;
	defaultProperties: unknown;
}

export class CanvasRenderer {
	private canvas: HTMLCanvasElement;
	private ctx: CanvasRenderingContext2D;
	private deserializer: (objData: any) => CanvasObject;

	constructor(canvas: HTMLCanvasElement, deserializer: (objData: any) => CanvasObject) {
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
		for (let i = 0; i < config.objects.length; i++) {
			try {
				const obj = this.deserializer(config.objects[i]);
				objects.push(obj);
			} catch (e) {
				console.error('[CanvasRenderer] Failed to deserialize object at index', i, ':', e);
			}
		}
		return objects;
	}

	/**
	 * Update all objects (called before render)
	 * Returns deserialized objects for interaction handling
	 */
	update(config: OmniConfig, delta: number): CanvasObject[] {
		const objects = this.deserializeObjects(config);
		let updateScreen = false;

		for (let i = 0; i < objects.length; i++) {
			if (objects[i].update(delta) === true) {
				updateScreen = true;
			}
		}

		return objects;
	}

	/**
	 * Render all objects to canvas from config (pure MVC)
	 */
	render(objects: CanvasObject[]): void {
		this.ctx.setTransform(1, 0, 0, 1, 0, 0);
		this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

		for (let i = 0; i < objects.length; i++) {
			const object = objects[i];
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
	renderDebugHitboxes(objects: CanvasObject[]): void {
		for (let i = 0; i < objects.length; i++) {
			const object = objects[i];
			this.ctx.setTransform(1, 0, 0, 1, object.positionOnCanvas.pxFromCanvasLeft, object.positionOnCanvas.pxFromCanvasTop);
			this.ctx.beginPath();
			this.ctx.strokeStyle = "#FF00FF";
			this.ctx.lineWidth = 1;
			this.ctx.rect(0, 0, object.hitboxSize.widthInPx, object.hitboxSize.lengthInPx);
			this.ctx.stroke();
		}
	}
}
