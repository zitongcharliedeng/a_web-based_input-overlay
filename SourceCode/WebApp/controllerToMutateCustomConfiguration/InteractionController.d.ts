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
import type { CanvasObject } from '../viewWhichRendersConfigurationAndUi/canvasRenderer/canvasObjectTypes/index';
export declare class InteractionController {
    private clickedObjectId;
    private draggingOffset;
    private gridsize;
    private editingProperties;
    private creationPanelActive;
    private dragStartPosition;
    private lastDragPosition;
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
    setOnShowPropertyEdit(callback: (obj: CanvasObject) => void): void;
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
     * Get currently selected object ID
     */
    getClickedObjectId(): string | null;
    /**
     * Clear selection state (called when objects are rebuilt from config)
     */
    clearSelection(): void;
    /**
     * Update interaction state
     * Returns true if canvas needs redraw
     */
    update(objects: CanvasObject[]): boolean;
    /**
     * Check if any object is selected (for View to decide whether to render hitboxes)
     */
    hasSelection(): boolean;
}
