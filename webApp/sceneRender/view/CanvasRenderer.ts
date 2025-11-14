/**
 * CanvasRenderer: Pure rendering utility
 *
 * Responsibilities:
 * - Render scenes and objects to canvas
 * - Call update() on objects
 * - NO state management (reads from scene.objects)
 * - NO input handling
 *
 * CL2: Extracted from default.ts render logic without behavior change
 */

interface Scene {
	objects: any[];
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
	 * Update all objects in scene
	 * Returns true if any object needs redraw
	 */
	update(scene: Scene, delta: number): boolean {
		let updateScreen = false;

		// Update scene itself
		if (scene.update(delta) === true) {
			updateScreen = true;
		}

		// Update all objects
		for (let i = 0; i < scene.objects.length; i++) {
			const object = scene.objects[i];
			if (object.update(delta) === true) {
				updateScreen = true;
			}
		}

		return updateScreen;
	}

	/**
	 * Render scene and all objects to canvas
	 */
	render(scene: Scene): void {
		this.ctx.setTransform(1, 0, 0, 1, 0, 0);
		this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

		// Draw scene background
		scene.draw(this.canvas, this.ctx);
		this.ctx.closePath();

		// Draw all objects
		for (let i = 0; i < scene.objects.length; i++) {
			const object = scene.objects[i];
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
