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
import { mouse } from '../viewWhichRendersConfigurationAndUi/inputReaders/DOM_API/mouse';
export class UserEditModeInteractionsController {
    constructor() {
        this.clickedObjectIndex = null; // Track by array index
        this.draggingOffset = new Vector(0, 0);
        this.gridsize = 10;
        this.editingProperties = false;
        this.creationPanelActive = false;
        this.dragStartPosition = null; // Original position when drag started
        this.lastDragPosition = null; // Last dragged position (for release frame)
        this.disableInteractions = false; // Disable all UI interactions in readonly/clickthrough mode
        // Callbacks
        this.onMoveObject = null;
        this.onDeleteObject = null;
        this.onShowPropertyEdit = null;
        this.onShowCreationPanel = null;
        this.onCloseEditors = null;
    }
    /**
     * Set callback for when object is moved
     */
    setOnMoveObject(callback) {
        this.onMoveObject = callback;
    }
    /**
     * Set callback for when object is deleted
     */
    setOnDeleteObject(callback) {
        this.onDeleteObject = callback;
    }
    /**
     * Set callback for when property edit should be shown
     */
    setOnShowPropertyEdit(callback) {
        this.onShowPropertyEdit = callback;
    }
    /**
     * Set callback for when creation panel should be shown
     */
    setOnShowCreationPanel(callback) {
        this.onShowCreationPanel = callback;
    }
    /**
     * Set callback for when editors should be closed
     */
    setOnCloseEditors(callback) {
        this.onCloseEditors = callback;
    }
    /**
     * Mark property editor as active/inactive
     */
    setEditingProperties(active) {
        this.editingProperties = active;
    }
    /**
     * Mark creation panel as active/inactive
     */
    setCreationPanelActive(active) {
        this.creationPanelActive = active;
    }
    /**
     * Set whether to disable UI interactions (for readonly/clickthrough mode)
     */
    setDisableInteractions(disable) {
        this.disableInteractions = disable;
    }
    /**
     * Get currently selected object index
     */
    getClickedObjectIndex() {
        return this.clickedObjectIndex;
    }
    /**
     * Clear selection state (called when objects are rebuilt from config)
     */
    clearSelection() {
        this.clickedObjectIndex = null;
    }
    /**
     * Update interaction state
     * Returns true if canvas needs redraw
     */
    update(objects) {
        // Readonly/clickthrough mode - disable all UI interactions
        if (this.disableInteractions)
            return false;
        // Click detection: find which object was clicked (track by array index)
        if (mouse.clicks[0] === true || mouse.clicks[2] === true) {
            this.clickedObjectIndex = null;
            this.dragStartPosition = null;
            this.lastDragPosition = null;
            for (let i = 0; i < objects.length; i++) {
                const object = objects[i];
                if (!object)
                    continue;
                const { positionOnCanvas, hitboxSize } = object.config;
                if (!positionOnCanvas || !hitboxSize)
                    continue;
                if ((mouse.x > positionOnCanvas.pxFromCanvasLeft && mouse.y > positionOnCanvas.pxFromCanvasTop)
                    && (mouse.x < positionOnCanvas.pxFromCanvasLeft + hitboxSize.widthInPx && mouse.y < positionOnCanvas.pxFromCanvasTop + hitboxSize.lengthInPx)) {
                    this.draggingOffset.x = positionOnCanvas.pxFromCanvasLeft - mouse.x;
                    this.draggingOffset.y = positionOnCanvas.pxFromCanvasTop - mouse.y;
                    this.clickedObjectIndex = i; // Store array index
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
            const newX = Math.round((mouse.x + this.draggingOffset.x) / this.gridsize) * this.gridsize;
            const newY = Math.round((mouse.y + this.draggingOffset.y) / this.gridsize) * this.gridsize;
            // Store drag position for preview rendering (don't update config until release)
            this.lastDragPosition = { x: newX, y: newY };
        }
        // Drag release: save position using lastDragPosition (since objects are fresh from config)
        if (mouse.buttons[0] === false && clickedObject && this.dragStartPosition) {
            // Use lastDragPosition if available (was dragged), otherwise use current position (just clicked)
            const finalX = this.lastDragPosition?.x ?? clickedObject.config.positionOnCanvas?.pxFromCanvasLeft;
            const finalY = this.lastDragPosition?.y ?? clickedObject.config.positionOnCanvas?.pxFromCanvasTop;
            if (finalX === undefined || finalY === undefined) {
                console.warn('[UserEditModeInteractionsController] Object missing positionOnCanvas on release');
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
    hasSelection() {
        return this.clickedObjectIndex !== null;
    }
    /**
     * Get drag preview position (for rendering ghost during drag)
     * Returns null if not dragging
     */
    getDragPreview() {
        if (this.clickedObjectIndex !== null && this.lastDragPosition) {
            return {
                objectIndex: this.clickedObjectIndex,
                x: this.lastDragPosition.x,
                y: this.lastDragPosition.y
            };
        }
        return null;
    }
    /**
     * Get original position before drag started (for rendering ghost at start position)
     * Returns null if not dragging
     */
    getDragOriginalPosition() {
        if (this.clickedObjectIndex !== null && this.dragStartPosition && this.lastDragPosition) {
            return {
                objectIndex: this.clickedObjectIndex,
                x: this.dragStartPosition.x,
                y: this.dragStartPosition.y
            };
        }
        return null;
    }
}
//# sourceMappingURL=UserEditModeInteractionsController.js.map