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

export class InteractionController {
	private clickedObjectId: string | null = null;  // Track by ID, not reference
	private draggingOffset = new Vector(0, 0);
	private gridsize = 10;
	private editingProperties = false;
	private creationPanelActive = false;
	private dragStartPosition: { x: number, y: number } | null = null;  // Original position when drag started
	private lastDragPosition: { x: number, y: number } | null = null;  // Last dragged position (for release frame)

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
			this.lastDragPosition = null;
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

		// Dragging: update position with grid snapping and track last position
		if (clickedObject !== null && mouse.buttons[0] === true) {
			console.log("Dragging");
			const newX = Math.round((mouse.x + this.draggingOffset.x)/this.gridsize)*this.gridsize;
			const newY = Math.round((mouse.y + this.draggingOffset.y)/this.gridsize)*this.gridsize;
			clickedObject.positionOnCanvas.pxFromCanvasLeft = newX;
			clickedObject.positionOnCanvas.pxFromCanvasTop = newY;
			// Track last dragged position for release frame
			this.lastDragPosition = { x: newX, y: newY };
		}

		// Drag release: save position using lastDragPosition (since objects are fresh from config)
		if ((mouse.buttons[0] === false && mouse.buttons[2] === false) && clickedObject !== null && this.dragStartPosition !== null) {
			// Use lastDragPosition if available (was dragged), otherwise use current position (just clicked)
			const finalX = this.lastDragPosition?.x ?? clickedObject.positionOnCanvas.pxFromCanvasLeft;
			const finalY = this.lastDragPosition?.y ?? clickedObject.positionOnCanvas.pxFromCanvasTop;
			const positionChanged = finalX !== this.dragStartPosition.x || finalY !== this.dragStartPosition.y;

			if (positionChanged) {
				console.log("Released mouse - saving position via ConfigManager");
				const objectIndex = objects.indexOf(clickedObject);
				if (objectIndex >= 0 && this.onMoveObject) {
					this.onMoveObject(objectIndex, finalX, finalY);
				}
			}
			// Don't clear clickedObjectId - keep selection active until next click
			this.dragStartPosition = null;
			this.lastDragPosition = null;
		}

		// Right-click object - show PropertyEdit (only when no editors open)
		if (mouse.clicks[2] === true && clickedObject !== null && !this.editingProperties && !this.creationPanelActive) {
			console.log("Right-clicked object - showing PropertyEdit");
			if (this.onShowPropertyEdit) {
				this.onShowPropertyEdit(clickedObject);
			}
		}

		// Right-click background - show both panels (only when no editors open)
		if (mouse.clicks[2] === true && clickedObject === null && !this.editingProperties && !this.creationPanelActive) {
			console.log("Right-clicked background - showing both panels");
			if (this.onShowCreationPanel) {
				this.onShowCreationPanel();
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
