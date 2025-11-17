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

import { Vector } from '../_helpers/Vector';
import type { CanvasObjectInstance } from '../viewWhichRendersConfigurationAndUi/canvasRenderer/canvasObjectTypes/index';
import { mouse } from '../viewWhichRendersConfigurationAndUi/inputReaders/mouse';

export class InteractionController {
	private clickedObjectIndex: number | null = null;  // Track by array index
	private draggingOffset = new Vector(0, 0);
	private gridsize = 10;
	private editingProperties = false;
	private creationPanelActive = false;
	private dragStartPosition: { x: number, y: number } | null = null;  // Original position when drag started
	private lastDragPosition: { x: number, y: number } | null = null;  // Last dragged position (for release frame)

	// Callbacks
	private onMoveObject: ((objectIndex: number, x: number, y: number) => void) | null = null;
	private onDeleteObject: ((objectIndex: number) => void) | null = null;
	private onShowPropertyEdit: ((obj: CanvasObjectInstance) => void) | null = null;
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
	setOnShowPropertyEdit(callback: (obj: CanvasObjectInstance) => void): void {
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
	 * Get currently selected object index
	 */
	getClickedObjectIndex(): number | null {
		return this.clickedObjectIndex;
	}

	/**
	 * Clear selection state (called when objects are rebuilt from config)
	 */
	clearSelection(): void {
		this.clickedObjectIndex = null;
	}

	/**
	 * Update interaction state
	 * Returns true if canvas needs redraw
	 */
	update(objects: readonly CanvasObjectInstance[]): boolean {
		// Click detection: find which object was clicked (track by array index)
		if (mouse.clicks[0] === true || mouse.clicks[2] === true) {
			this.clickedObjectIndex = null;
			this.dragStartPosition = null;
			this.lastDragPosition = null;
			for (let i = 0; i < objects.length; i++) {
				const object = objects[i];
				if (!object) continue;

				const { positionOnCanvas, hitboxSize } = object.config;
				if (!positionOnCanvas || !hitboxSize) continue;

				if ((mouse.x > positionOnCanvas.pxFromCanvasLeft && mouse.y > positionOnCanvas.pxFromCanvasTop)
				&& (mouse.x < positionOnCanvas.pxFromCanvasLeft + hitboxSize.widthInPx && mouse.y < positionOnCanvas.pxFromCanvasTop + hitboxSize.lengthInPx)) {
					this.draggingOffset.x = positionOnCanvas.pxFromCanvasLeft - mouse.x;
					this.draggingOffset.y = positionOnCanvas.pxFromCanvasTop - mouse.y;
					this.clickedObjectIndex = i;  // Store array index
					this.dragStartPosition = {
						x: positionOnCanvas.pxFromCanvasLeft,
						y: positionOnCanvas.pxFromCanvasTop
					};
					break;
				}
			}
		}

		// Find clicked object in current frame's objects (by array index)
		const clickedObject = this.clickedObjectIndex !== null ? objects[this.clickedObjectIndex] : undefined;

		// Dragging: store drag position for visual preview, don't update config yet
		if (clickedObject && mouse.buttons[0] === true) {
			const newX = Math.round((mouse.x + this.draggingOffset.x)/this.gridsize)*this.gridsize;
			const newY = Math.round((mouse.y + this.draggingOffset.y)/this.gridsize)*this.gridsize;

			// Store drag position for preview rendering (don't update config until release)
			this.lastDragPosition = { x: newX, y: newY };
		}

		// Drag release: save position using lastDragPosition (since objects are fresh from config)
		if ((mouse.buttons[0] === false && mouse.buttons[2] === false) && clickedObject && this.dragStartPosition) {
			// Use lastDragPosition if available (was dragged), otherwise use current position (just clicked)
			const finalX = this.lastDragPosition?.x ?? clickedObject.config.positionOnCanvas?.pxFromCanvasLeft;
			const finalY = this.lastDragPosition?.y ?? clickedObject.config.positionOnCanvas?.pxFromCanvasTop;

			if (finalX === undefined || finalY === undefined) {
				console.warn('[InteractionController] Object missing positionOnCanvas on release');
				this.dragStartPosition = null;
				this.lastDragPosition = null;
				return false;
			}

			const positionChanged = finalX !== this.dragStartPosition.x || finalY !== this.dragStartPosition.y;

			if (positionChanged) {
				if (this.clickedObjectIndex !== null && this.onMoveObject) {
					this.onMoveObject(this.clickedObjectIndex, finalX, finalY);
				}
			}
			// Don't clear clickedObjectIndex - keep selection active until next click
			this.dragStartPosition = null;
			this.lastDragPosition = null;
		}

		// Right-click object - show PropertyEdit (only when no editors open)
		if (mouse.clicks[2] === true && clickedObject && !this.editingProperties && !this.creationPanelActive) {
			if (this.onShowPropertyEdit) {
				this.onShowPropertyEdit(clickedObject);
			}
		}

		// Right-click background - show both panels (only when no editors open)
		if (mouse.clicks[2] === true && !clickedObject && !this.editingProperties && !this.creationPanelActive) {
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
		return this.clickedObjectIndex !== null;
	}

	/**
	 * Get drag preview position (for rendering ghost during drag)
	 * Returns null if not dragging
	 */
	getDragPreview(): { objectIndex: number, x: number, y: number } | null {
		if (this.clickedObjectIndex !== null && this.lastDragPosition) {
			return {
				objectIndex: this.clickedObjectIndex,
				x: this.lastDragPosition.x,
				y: this.lastDragPosition.y
			};
		}
		return null;
	}
}
