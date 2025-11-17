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
import type { CanvasObjectInstance } from '../viewWhichRendersConfigurationAndUi/canvasRenderer/canvasObjectTypes/index';
export declare class UserEditModeInteractionsController {
    private clickedObjectIndex;
    private draggingOffset;
    private gridsize;
    private editingProperties;
    private creationPanelActive;
    private dragStartPosition;
    private lastDragPosition;
    private disableInteractions;
    private onMoveObject;
    private onDeleteObject;
    private onShowPropertyEdit;
    private onShowCreationPanel;
    private onCloseEditors;
    /**
     * Set callback for when object is moved
     */
    setOnMoveObject(callback: (objectIndex: number, x: number, y: number) => void): void;
    /**
     * Set callback for when object is deleted
     */
    setOnDeleteObject(callback: (objectIndex: number) => void): void;
    /**
     * Set callback for when property edit should be shown
     */
    setOnShowPropertyEdit(callback: (obj: CanvasObjectInstance) => void): void;
    /**
     * Set callback for when creation panel should be shown
     */
    setOnShowCreationPanel(callback: () => void): void;
    /**
     * Set callback for when editors should be closed
     */
    setOnCloseEditors(callback: () => void): void;
    /**
     * Mark property editor as active/inactive
     */
    setEditingProperties(active: boolean): void;
    /**
     * Mark creation panel as active/inactive
     */
    setCreationPanelActive(active: boolean): void;
    /**
     * Set whether to disable UI interactions (for readonly/clickthrough mode)
     */
    setDisableInteractions(disable: boolean): void;
    /**
     * Get currently selected object index
     */
    getClickedObjectIndex(): number | null;
    /**
     * Clear selection state (called when objects are rebuilt from config)
     */
    clearSelection(): void;
    /**
     * Update interaction state
     * Returns true if canvas needs redraw
     */
    update(objects: readonly CanvasObjectInstance[]): boolean;
    /**
     * Check if any object is selected (for View to decide whether to render hitboxes)
     */
    hasSelection(): boolean;
    /**
     * Get drag preview position (for rendering ghost during drag)
     * Returns null if not dragging
     */
    getDragPreview(): {
        objectIndex: number;
        x: number;
        y: number;
    } | null;
    /**
     * Get original position before drag started (for rendering ghost at start position)
     * Returns null if not dragging
     */
    getDragOriginalPosition(): {
        objectIndex: number;
        x: number;
        y: number;
    } | null;
}
