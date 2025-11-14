/**
 * CanvasRenderer: Pure rendering utility
 *
 * Responsibilities:
 * - Render canvas objects from provided array
 * - Call update() on objects
 * - NO state management (stateless - reads from parameters)
 * - NO input handling
 *
 * CL2: Extracted from default.ts render logic without behavior change
 * CL4: Simplified to render from objects[] + scene.draw() without ConfigManager dependency
 * CL5: Further simplified to just render objects[] - scene overlays handled externally
 */

interface CanvasObject {
	positionOnCanvas: { pxFromCanvasTop: number; pxFromCanvasLeft: number };
	hitboxSize: { widthInPx: number; lengthInPx: number };
	update: (delta: number) => boolean;
	draw: (canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D) => void;
}

export class CanvasRenderer {
	private canvas: HTMLCanvasElement;
	private ctx: CanvasRenderingContext2D;

	constructor(canvas: HTMLCanvasElement) {
		this.canvas = canvas;
		const ctx = canvas.getContext('2d');
		if (!ctx) throw new Error('Failed to get 2D context');
		this.ctx = ctx;
	}

	/**
	 * Update all objects
	 * Returns true if any object needs redraw
	 */
	update(objects: CanvasObject[], delta: number): boolean {
		let updateScreen = false;

		// Update all objects
		for (let i = 0; i < objects.length; i++) {
			const object = objects[i];
			if (object.update(delta) === true) {
				updateScreen = true;
			}
		}

		return updateScreen;
	}

	/**
	 * Render all objects to canvas
	 */
	render(objects: CanvasObject[]): void {
		this.ctx.setTransform(1, 0, 0, 1, 0, 0);
		this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

		// Draw all objects
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
}
