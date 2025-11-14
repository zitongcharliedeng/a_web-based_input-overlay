/**
 * InteractionController: Mouse/keyboard interaction handler
 *
 * Responsibilities:
 * - Handle mouse clicks, dragging, keyboard input
 * - Manage selection state (clickedObject)
 * - Trigger UI actions (PropertyEdit, creation panel)
 * - NO rendering (delegates to scene.draw)
 * - NO state persistence (delegates to ConfigManager callbacks)
 *
 * CL3: Extracted from default.ts interaction logic without behavior change
 */

import { Vector } from '../_helpers/Vector.js';
import type { CanvasObject } from '../viewWhichRendersConfigurationAndUi/canvasRenderer/canvasObjectTypes/index.js';
import { mouse } from '../inputListeners/mouse.js';
import { keyboard } from '../inputListeners/keyboard.js';

export class InteractionController {
	private clickedObject: CanvasObject | null = null;
	private draggingOffset = new Vector(0, 0);
	private gridsize = 10;
	private editingProperties = false;
	private creationPanelActive = false;

	// Callbacks
	private onMoveObject: ((objectIndex: number, x: number, y: number) => void) | null = null;
	private onDeleteObject: ((objectIndex: number) => void) | null = null;
	private onShowPropertyEdit: ((obj: CanvasObject) => void) | null = null;
	private onShowCreationPanel: (() => void) | null = null;
	private onCloseEditors: (() => void) | null = null;

	/**
	 * Set callback for when object is moved
	 */
	setOnMoveObject(callback: (objectIndex: number, x: number, y: number) => void): void {
		this.onMoveObject = callback;
	}

	/**
	 * Set callback for when object is deleted
	 */
	setOnDeleteObject(callback: (objectIndex: number) => void): void {
		this.onDeleteObject = callback;
	}

	/**
	 * Set callback for when property edit should be shown
	 */
	setOnShowPropertyEdit(callback: (obj: CanvasObject) => void): void {
		this.onShowPropertyEdit = callback;
	}

	/**
	 * Set callback for when creation panel should be shown
	 */
	setOnShowCreationPanel(callback: () => void): void {
		this.onShowCreationPanel = callback;
	}

	/**
	 * Set callback for when editors should be closed
	 */
	setOnCloseEditors(callback: () => void): void {
		this.onCloseEditors = callback;
	}

	/**
	 * Mark property editor as active/inactive
	 */
	setEditingProperties(active: boolean): void {
		this.editingProperties = active;
	}

	/**
	 * Mark creation panel as active/inactive
	 */
	setCreationPanelActive(active: boolean): void {
		this.creationPanelActive = active;
	}

	/**
	 * Get currently selected object
	 */
	getClickedObject(): CanvasObject | null {
		return this.clickedObject;
	}

	/**
	 * Clear selection state (called when objects are rebuilt from config)
	 */
	clearSelection(): void {
		this.clickedObject = null;
	}

	/**
	 * Update interaction state
	 * Returns true if scene needs redraw
	 */
	update(objects: CanvasObject[]): boolean {
		// Click detection: find which object was clicked
		if (mouse.clicks[0] === true || mouse.clicks[2] === true) {
			this.clickedObject = null;
			for (let i = 0; i < objects.length; i++) {
				const object = objects[i];
				if ((mouse.x > object.positionOnCanvas.pxFromCanvasLeft && mouse.y > object.positionOnCanvas.pxFromCanvasTop)
				&& (mouse.x < object.positionOnCanvas.pxFromCanvasLeft + object.hitboxSize.widthInPx && mouse.y < object.positionOnCanvas.pxFromCanvasTop + object.hitboxSize.lengthInPx)) {
					this.draggingOffset.x = object.positionOnCanvas.pxFromCanvasLeft - mouse.x;
					this.draggingOffset.y = object.positionOnCanvas.pxFromCanvasTop - mouse.y;
					this.clickedObject = object;
					console.log("Clicked on object:", object);
					break;
				}
			}
		}

		// Drag release: save position
		if ((mouse.buttons[0] === false && mouse.buttons[2] === false) && this.clickedObject !== null) {
			console.log("Released mouse - saving position via ConfigManager");
			const objectIndex = objects.indexOf(this.clickedObject);
			if (objectIndex >= 0 && this.onMoveObject) {
				this.onMoveObject(
					objectIndex,
					this.clickedObject.positionOnCanvas.pxFromCanvasLeft,
					this.clickedObject.positionOnCanvas.pxFromCanvasTop
				);
			}
			this.clickedObject = null;
		}

		// Dragging: update position with grid snapping
		if (this.clickedObject !== null && mouse.buttons[0] === true) {
			console.log("Dragging");
			this.clickedObject.positionOnCanvas.pxFromCanvasLeft = Math.round((mouse.x + this.draggingOffset.x)/this.gridsize)*this.gridsize;
			this.clickedObject.positionOnCanvas.pxFromCanvasTop = Math.round((mouse.y + this.draggingOffset.y)/this.gridsize)*this.gridsize;
		}

		// Click away from any active UI - close all
		if (mouse.clicks[2] === true || mouse.clicks[0] === true) {
			if (this.clickedObject === null && (this.editingProperties === true || this.creationPanelActive === true)) {
				console.log("clicked away from editor/panel - saving changes and closing");
				if (this.onCloseEditors) {
					this.onCloseEditors();
				}
			}
		}

		// Right-click object - show PropertyEdit
		if (mouse.clicks[2] === true && this.clickedObject !== null && !this.editingProperties && !this.creationPanelActive) {
			console.log("Right-clicked object - showing PropertyEdit");
			if (this.onShowPropertyEdit) {
				this.onShowPropertyEdit(this.clickedObject);
			}
		}

		// Right-click background - show both panels (scene editor + creation)
		if (mouse.clicks[2] === true && this.clickedObject === null && !this.editingProperties && !this.creationPanelActive) {
			console.log("Right-clicked background - showing both panels");
			if (this.onShowCreationPanel) {
				this.onShowCreationPanel();
			}
		}

		// Handle delete key (Delete or Backspace)
		if ((keyboard['Delete'] || keyboard['Backspace']) && this.clickedObject !== null) {
			const objectIndex = objects.indexOf(this.clickedObject);
			if (objectIndex >= 0 && this.onDeleteObject) {
				this.onDeleteObject(objectIndex);
				this.clickedObject = null;
			}
		}

		return false;
	}

	/**
	 * Draw interaction visuals (hitboxes when object selected)
	 */
	drawHitboxes(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D, objects: CanvasObject[]): void {
		if (this.clickedObject !== null) {
			for (let i = 0; i < objects.length; i++) {
				const object = objects[i];
				ctx.setTransform(1, 0, 0, 1, object.positionOnCanvas.pxFromCanvasLeft, object.positionOnCanvas.pxFromCanvasTop);
				ctx.beginPath();
				ctx.strokeStyle = "#FF00FF";
				ctx.lineWidth = 1;
				ctx.rect(0, 0, object.hitboxSize.widthInPx, object.hitboxSize.lengthInPx);
				ctx.stroke();
			}
		}
	}
}
