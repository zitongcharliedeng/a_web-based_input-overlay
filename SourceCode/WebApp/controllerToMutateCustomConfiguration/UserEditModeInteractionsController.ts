/**
 * UserEditModeInteractionsController: Mouse/keyboard interaction handler for UI editing
 *
 * Responsibilities:
 * - Handle mouse clicks, dragging, keyboard input for editing overlay
 * - Manage selection state (clickedObject)
 * - Trigger UI actions (PropertyEdit, creation panel)
 * - NO rendering (delegates to canvas.draw)
 * - NO state persistence (delegates to ConfigManager callbacks)
 * - Does NOT handle input reading for indicators (they read from window.keyboard/mouse/gamepads directly)
 *
 * CL3: Extracted from default.ts interaction logic without behavior change
 */

import { Vector } from '../_helpers/Vector';
import type { CanvasObjectInstance } from '../viewWhichRendersConfigurationAndUi/canvasRenderer/canvasObjectTypes/index';
import { mouse } from '../viewWhichRendersConfigurationAndUi/inputReaders/DOM_API/mouse';

export class UserEditModeInteractionsController {
	private selectedObjectIndices: Set<number> = new Set();  // Multi-select support
	private draggingOffset = new Vector(0, 0);
	private gridsize = 10;
	private editingProperties = false;
	private creationPanelActive = false;
	private dragStartPosition: { x: number, y: number } | null = null;  // Original position when drag started
	private lastDragPosition: { x: number, y: number } | null = null;  // Last dragged position (for release frame)
	private disableInteractions = false;  // Disable all UI interactions in readonly/clickthrough mode

	// Selection box for drag-to-select
	private selectionBoxStart: { x: number, y: number } | null = null;
	private selectionBoxEnd: { x: number, y: number } | null = null;
	private isSelectingBox = false;

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
	 * Set whether to disable UI interactions (for readonly/clickthrough mode)
	 */
	setDisableInteractions(disable: boolean): void {
		this.disableInteractions = disable;
	}

	/**
	 * Get all selected object indices
	 */
	getSelectedIndices(): ReadonlySet<number> {
		return this.selectedObjectIndices;
	}

	/**
	 * Check if an object is selected
	 */
	isSelected(index: number): boolean {
		return this.selectedObjectIndices.has(index);
	}

	/**
	 * Clear selection state (called when objects are rebuilt from config)
	 */
	clearSelection(): void {
		this.selectedObjectIndices.clear();
		this.selectionBoxStart = null;
		this.selectionBoxEnd = null;
		this.isSelectingBox = false;
	}

	/**
	 * Delete all selected objects (calls onDeleteObject for each)
	 */
	deleteSelectedObjects(): void {
		if (!this.onDeleteObject) return;

		// Sort indices in descending order to delete from end (preserve earlier indices)
		const sortedIndices = Array.from(this.selectedObjectIndices).sort((a, b) => b - a);

		for (const index of sortedIndices) {
			this.onDeleteObject(index);
		}

		this.clearSelection();
	}

	/**
	 * Update interaction state
	 * Returns true if canvas needs redraw
	 */
	update(objects: readonly CanvasObjectInstance[]): boolean {
		// Readonly/clickthrough mode - disable all UI interactions
		if (this.disableInteractions) return false;

		// LEFT CLICK: Select/deselect logic
		if (mouse.clicks[0] === true) {
			// Find which object was clicked (if any)
			let clickedObjectIndex: number | null = null;
			for (let i = objects.length - 1; i >= 0; i--) {  // Iterate backwards (top object first)
				const object = objects[i];
				if (!object) continue;

				const { positionOnCanvas, hitboxSize } = object.config;
				if (!positionOnCanvas || !hitboxSize) continue;

				if ((mouse.x > positionOnCanvas.pxFromCanvasLeft && mouse.y > positionOnCanvas.pxFromCanvasTop)
				&& (mouse.x < positionOnCanvas.pxFromCanvasLeft + hitboxSize.widthInPx && mouse.y < positionOnCanvas.pxFromCanvasTop + hitboxSize.lengthInPx)) {
					clickedObjectIndex = i;
					break;
				}
			}

			if (clickedObjectIndex !== null) {
				// Clicked on an object
				const object = objects[clickedObjectIndex];
				const { positionOnCanvas } = object.config;

				if (this.selectedObjectIndices.has(clickedObjectIndex)) {
					// Clicking on already-selected object → prepare to drag all selected
					// Don't change selection, just set up drag offset
					if (positionOnCanvas) {
						this.draggingOffset.x = positionOnCanvas.pxFromCanvasLeft - mouse.x;
						this.draggingOffset.y = positionOnCanvas.pxFromCanvasTop - mouse.y;
						this.dragStartPosition = {
							x: positionOnCanvas.pxFromCanvasLeft,
							y: positionOnCanvas.pxFromCanvasTop
						};
					}
				} else {
					// Clicking on non-selected object → select only this object
					this.selectedObjectIndices.clear();
					this.selectedObjectIndices.add(clickedObjectIndex);

					if (positionOnCanvas) {
						this.draggingOffset.x = positionOnCanvas.pxFromCanvasLeft - mouse.x;
						this.draggingOffset.y = positionOnCanvas.pxFromCanvasTop - mouse.y;
						this.dragStartPosition = {
							x: positionOnCanvas.pxFromCanvasLeft,
							y: positionOnCanvas.pxFromCanvasTop
						};
					}
				}

				this.isSelectingBox = false;
			} else {
				// Clicked on empty canvas → start selection box OR clear selection
				this.selectedObjectIndices.clear();
				this.selectionBoxStart = { x: mouse.x, y: mouse.y };
				this.selectionBoxEnd = { x: mouse.x, y: mouse.y };
				this.isSelectingBox = true;
				this.dragStartPosition = null;
				this.lastDragPosition = null;
			}
		}

		// MOUSE DRAG: Update selection box or drag objects
		if (mouse.buttons[0] === true) {
			if (this.isSelectingBox && this.selectionBoxStart) {
				// Update selection box end position
				this.selectionBoxEnd = { x: mouse.x, y: mouse.y };
			} else if (this.selectedObjectIndices.size > 0 && this.dragStartPosition) {
				// Dragging selected objects
				const newX = Math.round((mouse.x + this.draggingOffset.x)/this.gridsize)*this.gridsize;
				const newY = Math.round((mouse.y + this.draggingOffset.y)/this.gridsize)*this.gridsize;
				this.lastDragPosition = { x: newX, y: newY };
			}
		}

		// MOUSE RELEASE: Finalize selection box or drag
		if (mouse.buttons[0] === false) {
			if (this.isSelectingBox && this.selectionBoxStart && this.selectionBoxEnd) {
				// Finalize selection box - select all objects intersecting
				const minX = Math.min(this.selectionBoxStart.x, this.selectionBoxEnd.x);
				const maxX = Math.max(this.selectionBoxStart.x, this.selectionBoxEnd.x);
				const minY = Math.min(this.selectionBoxStart.y, this.selectionBoxEnd.y);
				const maxY = Math.max(this.selectionBoxStart.y, this.selectionBoxEnd.y);

				this.selectedObjectIndices.clear();
				for (let i = 0; i < objects.length; i++) {
					const object = objects[i];
					if (!object) continue;

					const { positionOnCanvas, hitboxSize } = object.config;
					if (!positionOnCanvas || !hitboxSize) continue;

					// Check if object intersects with selection box
					const objLeft = positionOnCanvas.pxFromCanvasLeft;
					const objRight = objLeft + hitboxSize.widthInPx;
					const objTop = positionOnCanvas.pxFromCanvasTop;
					const objBottom = objTop + hitboxSize.lengthInPx;

					if (!(objRight < minX || objLeft > maxX || objBottom < minY || objTop > maxY)) {
						this.selectedObjectIndices.add(i);
					}
				}

				this.selectionBoxStart = null;
				this.selectionBoxEnd = null;
				this.isSelectingBox = false;
			} else if (this.selectedObjectIndices.size > 0 && this.dragStartPosition && this.lastDragPosition) {
				// Finalize drag - move all selected objects
				const deltaX = this.lastDragPosition.x - this.dragStartPosition.x;
				const deltaY = this.lastDragPosition.y - this.dragStartPosition.y;

				if (deltaX !== 0 || deltaY !== 0) {
					if (this.onMoveObject) {
						for (const index of this.selectedObjectIndices) {
							const object = objects[index];
							if (!object) continue;

							const { positionOnCanvas } = object.config;
							if (!positionOnCanvas) continue;

							const newX = positionOnCanvas.pxFromCanvasLeft + deltaX;
							const newY = positionOnCanvas.pxFromCanvasTop + deltaY;
							this.onMoveObject(index, newX, newY);
						}
					}
				}

				this.dragStartPosition = null;
				this.lastDragPosition = null;
			}
		}

		// RIGHT CLICK: Show PropertyEdit or creation panel
		if (mouse.clicks[2] === true) {
			// Find which object was clicked
			let clickedObjectIndex: number | null = null;
			for (let i = objects.length - 1; i >= 0; i--) {
				const object = objects[i];
				if (!object) continue;

				const { positionOnCanvas, hitboxSize } = object.config;
				if (!positionOnCanvas || !hitboxSize) continue;

				if ((mouse.x > positionOnCanvas.pxFromCanvasLeft && mouse.y > positionOnCanvas.pxFromCanvasTop)
				&& (mouse.x < positionOnCanvas.pxFromCanvasLeft + hitboxSize.widthInPx && mouse.y < positionOnCanvas.pxFromCanvasTop + hitboxSize.lengthInPx)) {
					clickedObjectIndex = i;
					break;
				}
			}

			if (clickedObjectIndex !== null && !this.editingProperties && !this.creationPanelActive) {
				// Right-click on object → show PropertyEdit
				if (this.onShowPropertyEdit) {
					this.onShowPropertyEdit(objects[clickedObjectIndex]!);
				}
			} else if (clickedObjectIndex === null && !this.editingProperties && !this.creationPanelActive) {
				// Right-click on canvas → show creation panel
				if (this.onShowCreationPanel) {
					this.onShowCreationPanel();
				}
			}
		}

		return false;
	}

	/**
	 * Check if any object is selected (for View to decide whether to render hitboxes)
	 */
	hasSelection(): boolean {
		return this.selectedObjectIndices.size > 0;
	}

	/**
	 * Get selection box coordinates (for rendering during drag-to-select)
	 * Returns null if not selecting
	 */
	getSelectionBox(): { startX: number, startY: number, endX: number, endY: number } | null {
		if (this.isSelectingBox && this.selectionBoxStart && this.selectionBoxEnd) {
			return {
				startX: this.selectionBoxStart.x,
				startY: this.selectionBoxStart.y,
				endX: this.selectionBoxEnd.x,
				endY: this.selectionBoxEnd.y
			};
		}
		return null;
	}

	/**
	 * Get drag preview offset (for rendering ghosts during multi-drag)
	 * Returns null if not dragging
	 */
	getDragPreview(): { deltaX: number, deltaY: number } | null {
		if (this.selectedObjectIndices.size > 0 && this.dragStartPosition && this.lastDragPosition) {
			return {
				deltaX: this.lastDragPosition.x - this.dragStartPosition.x,
				deltaY: this.lastDragPosition.y - this.dragStartPosition.y
			};
		}
		return null;
	}

	/**
	 * Get original drag position (for rendering ghost at start position)
	 * Returns null if not dragging
	 */
	getDragOriginalPosition(): { x: number, y: number } | null {
		if (this.selectedObjectIndices.size > 0 && this.dragStartPosition && this.lastDragPosition) {
			return {
				x: this.dragStartPosition.x,
				y: this.dragStartPosition.y
			};
		}
		return null;
	}
}
