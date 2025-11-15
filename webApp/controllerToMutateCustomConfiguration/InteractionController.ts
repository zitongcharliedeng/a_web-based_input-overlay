/**
 * InteractionController: Mouse/keyboard interaction handler
 *
 * Responsibilities:
 * - Handle mouse clicks, dragging, keyboard input
 * - Manage selection state (clickedObject)
 * - Trigger UI actions (PropertyEdit, creation panel)
 * - NO rendering (delegates to canvas.draw)
 * - NO state persistence (delegates to ConfigManager callbacks)
 *
 * CL3: Extracted from default.ts interaction logic without behavior change
 */

import { Vector } from '../_helpers/Vector.js';
import type { CanvasObject } from '../viewWhichRendersConfigurationAndUi/canvasRenderer/canvasObjectTypes/index.js';
import { mouse } from '../viewWhichRendersConfigurationAndUi/inputReaders/mouse.js';
import { keyboard } from '../viewWhichRendersConfigurationAndUi/inputReaders/keyboard.js';

export class InteractionController {
	private clickedObjectId: string | null = null;  // Track by ID, not reference
	private draggingOffset = new Vector(0, 0);
	private gridsize = 10;
	private editingProperties = false;
	private creationPanelActive = false;
	private dragStartPosition: { x: number, y: number } | null = null;  // Track if object actually moved

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
	 * Get currently selected object ID
	 */
	getClickedObjectId(): string | null {
		return this.clickedObjectId;
	}

	/**
	 * Clear selection state (called when objects are rebuilt from config)
	 */
	clearSelection(): void {
		this.clickedObjectId = null;
	}

	/**
	 * Update interaction state
	 * Returns true if canvas needs redraw
	 */
	update(objects: CanvasObject[]): boolean {
		// Click detection: find which object was clicked (track by ID)
		if (mouse.clicks[0] === true || mouse.clicks[2] === true) {
			this.clickedObjectId = null;
			this.dragStartPosition = null;
			for (let i = 0; i < objects.length; i++) {
				const object = objects[i];
				if ((mouse.x > object.positionOnCanvas.pxFromCanvasLeft && mouse.y > object.positionOnCanvas.pxFromCanvasTop)
				&& (mouse.x < object.positionOnCanvas.pxFromCanvasLeft + object.hitboxSize.widthInPx && mouse.y < object.positionOnCanvas.pxFromCanvasTop + object.hitboxSize.lengthInPx)) {
					this.draggingOffset.x = object.positionOnCanvas.pxFromCanvasLeft - mouse.x;
					this.draggingOffset.y = object.positionOnCanvas.pxFromCanvasTop - mouse.y;
					this.clickedObjectId = object.id;  // Store ID, not reference
					this.dragStartPosition = {
						x: object.positionOnCanvas.pxFromCanvasLeft,
						y: object.positionOnCanvas.pxFromCanvasTop
					};
					console.log("Clicked on object:", object.id);
					break;
				}
			}
		}

		// Find clicked object in current frame's objects (by ID)
		const clickedObject = this.clickedObjectId ? objects.find(o => o.id === this.clickedObjectId) : null;

		// Drag release: save position only if it actually changed
		if ((mouse.buttons[0] === false && mouse.buttons[2] === false) && clickedObject !== null && this.dragStartPosition !== null) {
			const currentX = clickedObject.positionOnCanvas.pxFromCanvasLeft;
			const currentY = clickedObject.positionOnCanvas.pxFromCanvasTop;
			const positionChanged = currentX !== this.dragStartPosition.x || currentY !== this.dragStartPosition.y;

			if (positionChanged) {
				console.log("Released mouse - saving position via ConfigManager");
				const objectIndex = objects.indexOf(clickedObject);
				if (objectIndex >= 0 && this.onMoveObject) {
					this.onMoveObject(objectIndex, currentX, currentY);
				}
			}
			// Don't clear clickedObjectId - keep selection active until next click
			this.dragStartPosition = null;
		}

		// Dragging: update position with grid snapping
		if (clickedObject !== null && mouse.buttons[0] === true) {
			console.log("Dragging");
			clickedObject.positionOnCanvas.pxFromCanvasLeft = Math.round((mouse.x + this.draggingOffset.x)/this.gridsize)*this.gridsize;
			clickedObject.positionOnCanvas.pxFromCanvasTop = Math.round((mouse.y + this.draggingOffset.y)/this.gridsize)*this.gridsize;
		}

		// Click away from any active UI - close all
		if (mouse.clicks[2] === true || mouse.clicks[0] === true) {
			if (clickedObject === null && (this.editingProperties === true || this.creationPanelActive === true)) {
				console.log("clicked away from editor/panel - saving changes and closing");
				if (this.onCloseEditors) {
					this.onCloseEditors();
				}
			}
		}

		// Right-click object - show PropertyEdit
		if (mouse.clicks[2] === true && clickedObject !== null && !this.editingProperties && !this.creationPanelActive) {
			console.log("Right-clicked object - showing PropertyEdit");
			if (this.onShowPropertyEdit) {
				this.onShowPropertyEdit(clickedObject);
			}
		}

		// Right-click background - show both panels (canvas editor + creation)
		if (mouse.clicks[2] === true && clickedObject === null && !this.editingProperties && !this.creationPanelActive) {
			console.log("Right-clicked background - showing both panels");
			if (this.onShowCreationPanel) {
				this.onShowCreationPanel();
			}
		}

		// Handle delete key (Delete or Backspace)
		if ((keyboard['Delete'] || keyboard['Backspace']) && clickedObject !== null) {
			const objectIndex = objects.indexOf(clickedObject);
			if (objectIndex >= 0 && this.onDeleteObject) {
				this.onDeleteObject(objectIndex);
				this.clickedObjectId = null;
				this.dragStartPosition = null;
			}
		}

		return false;
	}

	/**
	 * Check if any object is selected (for View to decide whether to render hitboxes)
	 */
	hasSelection(): boolean {
		return this.clickedObjectId !== null;
	}
}
