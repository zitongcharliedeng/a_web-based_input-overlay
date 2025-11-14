/**
 * CanvasRenderer: Pure rendering utility
 *
 * Responsibilities:
 * - Render from CanvasObject array and Scene interface
 * - Call update() on objects
 * - NO state management (reads from objects passed as parameters)
 * - NO input handling
 *
 * CL2: Extracted from default.ts render logic without behavior change
 * CL4: Simplified to render from objects[] + scene.draw() without ConfigManager dependency
 */

interface CanvasObject {
	positionOnCanvas: { pxFromCanvasTop: number; pxFromCanvasLeft: number };
	hitboxSize: { widthInPx: number; lengthInPx: number };
	update: (delta: number) => boolean;
	draw: (canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D) => void;
}

interface Scene {
	draw(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D): void;
	update(delta: number): boolean;
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
	 * Update all objects and scene
	 * Returns true if any object needs redraw
	 */
	update(objects: CanvasObject[], scene: Scene, delta: number): boolean {
		let updateScreen = false;

		// Update scene itself
		if (scene.update(delta) === true) {
			updateScreen = true;
		}

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
	 * Render objects and scene overlays to canvas
	 */
	render(objects: CanvasObject[], scene: Scene): void {
		this.ctx.setTransform(1, 0, 0, 1, 0, 0);
		this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

		// Draw scene overlays (hitboxes, etc.)
		scene.draw(this.canvas, this.ctx);
		this.ctx.closePath();

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
}
