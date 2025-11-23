import { mouse, keyboard, getGamepads } from './inputReaders';
import { deserializeCanvasObject } from './canvasRenderer/canvasObjectTypes/index.js';
import { PropertyEdit } from './uiComponents/PropertyEdit';
import { loadConfigFromLocalStorage } from '../modelToSaveCustomConfigurationLocally/configSerializer';
import { ConfigManager } from '../modelToSaveCustomConfigurationLocally/ConfigManager';
import type { CustomisableCanvasConfig, CanvasObjectConfig } from '../modelToSaveCustomConfigurationLocally/CustomisableCanvasConfig';
import { ALL_CANVAS_OBJECT_CLASSES_BY_CLASSNAME } from '../modelToSaveCustomConfigurationLocally/CustomisableCanvasConfig';
import { showToast } from './uiComponents/Toast';
import type { CanvasObjectInstance } from './canvasRenderer/canvasObjectTypes/BaseCanvasObject';
import { CanvasRenderer } from './canvasRenderer/CanvasRenderer';
import { UserEditModeInteractionsController } from '../controllerToMutateCustomConfiguration/UserEditModeInteractionsController';
import { LinearInputIndicatorSchema, PlanarInputIndicatorSchema, TextSchema, ImageSchema, WebEmbedSchema } from '../modelToSaveCustomConfigurationLocally/configSchema';
import type { z } from 'zod';
import type { CanvasObjectClassName } from '../modelToSaveCustomConfigurationLocally/CustomisableCanvasConfig';

// Map class names to their Zod schemas for proper default generation
const CANVAS_OBJECT_SCHEMAS: Record<CanvasObjectClassName, z.ZodSchema<any>> = {
	LinearInputIndicator: LinearInputIndicatorSchema,
	PlanarInputIndicator: PlanarInputIndicatorSchema,
	Text: TextSchema,
	Image: ImageSchema,
	WebEmbed: WebEmbedSchema
};

declare global {
	interface Window {
		gamepads: (Gamepad | null)[] | null;
		keyboard: typeof keyboard;
		mouse: typeof mouse;
		_gamepadDebugLogged?: boolean;
	}
}

// UI Helpers interface (no longer includes objects - those come from config)
interface UIHelpers {
	propertyEditor: PropertyEdit;
	deleteObjectAtIndex: (index: number) => void;
	showBothPanels: () => void;
	hideBothPanels: () => void;
}

window.gamepads = null;
window.keyboard = keyboard;
window.mouse = mouse;

// Single source of truth for delete key (DRY principle)
const DELETE_OBJECT_KEY = 'Delete';

window.addEventListener("load", function (): void {
	const canvas = document.getElementById("canvas") as HTMLCanvasElement;
	if (!canvas) {
		throw new Error("Canvas element not found");
	}

	const ctxOrNull = canvas.getContext("2d");
	if (!ctxOrNull) {
		throw new Error("Could not get 2D context");
	}
	const ctx: CanvasRenderingContext2D = ctxOrNull;

	canvas.width = window.innerWidth;
	canvas.height = window.innerHeight;

	// Phase2: Create ConfigManager FIRST (pure MVC - config is source of truth)
	const configManager = new ConfigManager({
		canvas: { width: canvas.width, height: canvas.height, backgroundColor: 'transparent' },
		objects: []
	});

	// Phase2: Create CanvasRenderer with deserializer (no caching)
	const canvasRenderer = new CanvasRenderer(canvas, deserializeCanvasObject);

	// CL3: Create UserEditModeInteractionsController (extracted interaction logic)
	const userEditModeInteractionsController = new UserEditModeInteractionsController();

	// Initialize readonly mode from Electron (if running in Electron wrapper)
	if (window.electronAPI) {
		const isAppInReadonlyClickthroughMode = window.electronAPI.isAppInReadonlyClickthroughMode();
		userEditModeInteractionsController.setDisableInteractions(isAppInReadonlyClickthroughMode);
		console.log('[default.ts] Readonly/clickthrough mode:', isAppInReadonlyClickthroughMode);
	}

	// SpawnMenu removed - using existing showBothPanels UI instead

	// STEP 2: Create default config (NO objects yet - pure config)
	const defaultConfig = createDefaultConfig(canvas);

	// STEP 3: Create UI helpers (moved out of config creation)
	const uiHelpers = createUIHelpers(canvas, configManager, userEditModeInteractionsController);

	// CL5: Set up InteractionController callbacks
	userEditModeInteractionsController.setOnMoveObject((objectIndex, x, y) => {
		configManager.moveObject(objectIndex, x, y);
	});

	userEditModeInteractionsController.setOnDeleteObject((objectIndex) => {
		uiHelpers.deleteObjectAtIndex(objectIndex);
	});

	userEditModeInteractionsController.setOnShowPropertyEdit((obj) => {
		const objArrayIdx = obj.objArrayIdx;
		// Find the config for this object using array index
		const config = configManager.config;
		const objConfig = config.objects[objArrayIdx];

		if (!objConfig) {
			console.error('[PropertyEdit] Could not find config for object at index', objArrayIdx);
			return;
		}

		// Pass entire config - PropertyEdit renders ALL properties programmatically
		uiHelpers.propertyEditor.showPropertyEdit(
			objConfig,
			obj,
			objArrayIdx,
			configManager,
			() => {
				uiHelpers.deleteObjectAtIndex(objArrayIdx);
			}
		);
		userEditModeInteractionsController.setEditingProperties(true);
	});

	userEditModeInteractionsController.setOnShowCreationPanel(() => {
		uiHelpers.showBothPanels();
	});

	userEditModeInteractionsController.setOnCloseEditors(() => {
		uiHelpers.hideBothPanels();
		// Phase2: Config already updated by editor callbacks - no need to sync from runtime objects
	});

	// Add right-click canvas menu handler
	canvas.addEventListener('contextmenu', (e: MouseEvent) => {
		e.preventDefault();

		// Readonly/clickthrough mode - no context menus
		if (window.electronAPI && window.electronAPI.isAppInReadonlyClickthroughMode()) {
			return;
		}

		// Check if clicking on empty space (not on an object)
		let clickedOnObject = false;
		const currentConfig = configManager.config;
		const currentObjects = currentConfig.objects.map((objData: CanvasObjectConfig, index: number) => deserializeCanvasObject(objData, index));

		for (let i = 0; i < currentObjects.length; i++) {
			const obj = currentObjects[i];
			if (obj) {
				const { positionOnCanvas, hitboxSize } = obj.config;
				if (positionOnCanvas && hitboxSize) {
					const inBounds = (e.offsetX > positionOnCanvas.pxFromCanvasLeft && e.offsetY > positionOnCanvas.pxFromCanvasTop)
						&& (e.offsetX < positionOnCanvas.pxFromCanvasLeft + hitboxSize.widthInPx
						&& e.offsetY < positionOnCanvas.pxFromCanvasTop + hitboxSize.lengthInPx);
					if (inBounds) {
						clickedOnObject = true;
						break;
					}
				}
			}
		}

		// Show canvas config menu with creation panel on empty space
		if (!clickedOnObject) {
			uiHelpers.showBothPanels();
		}
	});

	// STEP 4: Try to load saved config from localStorage, or use default
	const savedConfig = loadSceneConfig();
	const configToUse = savedConfig || defaultConfig;

	// STEP 5: Apply canvas dimensions
	if (configToUse.canvas) {
		canvas.width = configToUse.canvas.width;
		canvas.height = configToUse.canvas.height;
	}

	// STEP 6: Register callbacks BEFORE updating config (so they trigger properly)

	// Save callback
	configManager.onSave((config) => {
		saveSceneConfig(config);
		showToast('Saved');
	});

	// Phase2: No onChange cache rebuild - config is deserialized every frame (pure MVC)

	// STEP 7: Update ConfigManager with actual config
	configManager.setConfig(configToUse);

	// Phase2: Frame-local objects for interaction handling
	let frameObjects: readonly CanvasObjectInstance[] = [];

	// Phase2: Render from config (pure MVC - no cache)
	function frameUpdate(): void {
		const selectedIndices = userEditModeInteractionsController.getSelectedIndices();
		const dragPreview = userEditModeInteractionsController.getDragPreview();

		// Skip ALL selected objects during drag (prevents iframe double-render for WebEmbed)
		const skipIndices = dragPreview && selectedIndices.size > 0 ? selectedIndices : undefined;
		canvasRenderer.render(frameObjects, skipIndices);

		// Render selection box if drag-to-select is active
		const selectionBox = userEditModeInteractionsController.getSelectionBox();
		if (selectionBox) {
			canvasRenderer.renderSelectionBox(
				selectionBox.startX,
				selectionBox.startY,
				selectionBox.endX,
				selectionBox.endY
			);
		}

		// Phase3: View renders hitboxes for selected objects only
		if (userEditModeInteractionsController.hasSelection()) {
			canvasRenderer.renderDebugHitboxes(frameObjects, selectedIndices);
		}

		// Render drag ghosts for multi-select
		if (dragPreview && selectedIndices.size > 0) {
			for (const index of selectedIndices) {
				const object = frameObjects[index];
				if (!object) continue;

				const { positionOnCanvas } = object.config;
				if (!positionOnCanvas) continue;

				// Ghost at original position (half opacity)
				canvasRenderer.renderOverlay((canvas, ctx) => {
					ctx.save();
					ctx.globalAlpha = 0.5;
					ctx.setTransform(
						1, 0, 0, 1,
						positionOnCanvas.pxFromCanvasLeft,
						positionOnCanvas.pxFromCanvasTop
					);
					object.draw(canvas, ctx, true);
					ctx.restore();
				});

				// Ghost at new position (full opacity)
				canvasRenderer.renderOverlay((canvas, ctx) => {
					ctx.save();
					ctx.globalAlpha = 1.0;
					ctx.setTransform(
						1, 0, 0, 1,
						positionOnCanvas.pxFromCanvasLeft + dragPreview.deltaX,
						positionOnCanvas.pxFromCanvasTop + dragPreview.deltaY
					);
					object.draw(canvas, ctx, true);
					ctx.restore();
				});
			}
		}
	}

	let previousTime = 0;
	function updateLoop(currentTime: number): void {
		const delta = (currentTime - previousTime) / 1000;
		previousTime = currentTime;

		let updateScreen = false;

		// Get gamepads through unified facade (automatically uses web or desktop based on platform)
		window.gamepads = getGamepads();

		if (!window._gamepadDebugLogged) {
			const pads = window.gamepads;
			let connectedCount = 0;
			for (let i = 0; i < pads.length; i++) {
				if (pads[i]) connectedCount++;
			}
			if (connectedCount > 0) {
				window._gamepadDebugLogged = true;
			}
		}

		// Phase2: Deserialize config to objects every frame (pure MVC)
		const config = configManager.config;
		frameObjects = canvasRenderer.update(config, delta);
		updateScreen = true; // Always redraw (60fps)

		// InteractionController updates (handles dragging, clicks, etc.)
		userEditModeInteractionsController.update(frameObjects);

		// Update delete snackbar visibility
		updateDeleteSnackbarVisibility();

		if (updateScreen) {
			frameUpdate();
		}

		mouse.update(delta);

		window.requestAnimationFrame(updateLoop);
	}

	window.requestAnimationFrame(updateLoop);
	frameUpdate();

	function resizeCanvas(): void {
		canvas.width = window.innerWidth;
		canvas.height = window.innerHeight;
		frameUpdate();
	}
	window.addEventListener("resize", resizeCanvas);

	const deleteSelectedSnackbar = document.getElementById("deleteSelectedSnackbar");

	if (deleteSelectedSnackbar) {
		deleteSelectedSnackbar.textContent = `PRESS ${DELETE_OBJECT_KEY.toUpperCase()} TO DELETE SELECTED CANVAS OBJECTS`;
	}

	function updateDeleteSnackbarVisibility(): void {
		if (!deleteSelectedSnackbar) return;

		if (userEditModeInteractionsController.hasSelection()) {
			deleteSelectedSnackbar.style.display = 'block';
		} else {
			deleteSelectedSnackbar.style.display = 'none';
		}
	}

	document.addEventListener("keydown", (e: KeyboardEvent) => {
		if (e.key === DELETE_OBJECT_KEY && userEditModeInteractionsController.hasSelection()) {
			e.preventDefault();

			const selectedCount = userEditModeInteractionsController.getSelectedIndices().size;
			const message = selectedCount === 1
				? "Delete this object?"
				: `Delete ${selectedCount} objects?`;

			if (confirm(message)) {
				userEditModeInteractionsController.deleteSelectedObjects();
			}
		}
	});
}, false);

/**
 * Build-time constant injected by esbuild's define plugin
 * @generated esbuild.config.ts (define configuration)
 */
declare const __CURRENT_PROJECT_GIT_HASH__: string;

const SCENE_CONFIG_KEY = 'analogKeyboardOverlay_sceneConfig';

function saveSceneConfig(config: CustomisableCanvasConfig): void {
	try {
		const versionedConfig = { version: __CURRENT_PROJECT_GIT_HASH__, ...config };
		localStorage.setItem(SCENE_CONFIG_KEY, JSON.stringify(versionedConfig));
	} catch (e) {
		console.error('[Config] Failed to save:', e);
	}
}

function loadSceneConfig() {
	try {
		const raw = localStorage.getItem(SCENE_CONFIG_KEY);
		if (!raw) {
			return null;
		}

		// Parse to check version
		const parsed = JSON.parse(raw);
		if (parsed.version !== __CURRENT_PROJECT_GIT_HASH__) {
			console.warn(`[Config] Version mismatch: stored=${parsed.version}, current=${__CURRENT_PROJECT_GIT_HASH__}. Clearing localStorage.`);
			localStorage.removeItem(SCENE_CONFIG_KEY);
			showToast(`Config version changed - reset to defaults`);
			return null;
		}

		const result = loadConfigFromLocalStorage(SCENE_CONFIG_KEY);
		if (result.success) {
			return result.config;
		} else {
			console.error('[Config] Validation failed:', result.error);
			console.error('[Config] Raw data from localStorage:', raw);
			return null;
		}
	} catch (e) {
		console.error('[Config] Failed to load:', e);
		return null;
	}
}

// Create default scene configuration (CustomisableCanvasConfig)
function createDefaultConfig(canvas: HTMLCanvasElement): CustomisableCanvasConfig {
	const objects: CanvasObjectConfig[] = [
		// Intro text
		{ Text: TextSchema.parse({
			positionOnCanvas: { pxFromCanvasLeft: 20, pxFromCanvasTop: 20 },
			hitboxSize: { widthInPx: 600, lengthInPx: 25 },
			text: "This is a text box and the two joystick arrow keys, one has circle correction, check it out!",
			textStyle: { textAlign: "left", font: "15px Lucida Console" }
		}) },

		// Left side: WITH radial compensation (planar is 200x200, centered joystick)
		{ PlanarInputIndicator: PlanarInputIndicatorSchema.parse({
			positionOnCanvas: { pxFromCanvasLeft: 120, pxFromCanvasTop: 80 }
		}) },
		{ LinearInputIndicator: LinearInputIndicatorSchema.parse({
			positionOnCanvas: { pxFromCanvasLeft: 183, pxFromCanvasTop: 80 },
			input: {
				keyboard: { keyCode: "ArrowUp" },
				gamepad: { stick: { type: "left", axis: "Y", direction: "negative" } }
			},
			processing: { radialCompensationAxis: 0 },
			display: { text: "↑" }
		}) },
		{ LinearInputIndicator: LinearInputIndicatorSchema.parse({
			positionOnCanvas: { pxFromCanvasLeft: 120, pxFromCanvasTop: 155 },
			input: {
				keyboard: { keyCode: "ArrowLeft" },
				gamepad: { stick: { type: "left", axis: "X", direction: "negative" } }
			},
			processing: { radialCompensationAxis: 1 },
			display: { text: "←" }
		}) },
		{ LinearInputIndicator: LinearInputIndicatorSchema.parse({
			positionOnCanvas: { pxFromCanvasLeft: 195, pxFromCanvasTop: 155 },
			input: {
				keyboard: { keyCode: "ArrowDown" },
				gamepad: { stick: { type: "left", axis: "Y", direction: "positive" } }
			},
			processing: { radialCompensationAxis: 0 },
			display: { text: "↓" }
		}) },
		{ LinearInputIndicator: LinearInputIndicatorSchema.parse({
			positionOnCanvas: { pxFromCanvasLeft: 270, pxFromCanvasTop: 155 },
			input: {
				keyboard: { keyCode: "ArrowRight" },
				gamepad: { stick: { type: "left", axis: "X", direction: "positive" } }
			},
			processing: { radialCompensationAxis: 1 },
			display: { text: "→" }
		}) },

		// Right side: WITHOUT radial compensation
		{ PlanarInputIndicator: PlanarInputIndicatorSchema.parse({
			positionOnCanvas: { pxFromCanvasLeft: 470, pxFromCanvasTop: 80 }
		}) },
		{ LinearInputIndicator: LinearInputIndicatorSchema.parse({
			positionOnCanvas: { pxFromCanvasLeft: 533, pxFromCanvasTop: 80 },
			input: {
				keyboard: { keyCode: "ArrowUp" },
				gamepad: { stick: { type: "left", axis: "Y", direction: "negative" } }
			},
			display: { text: "↑" }
		}) },
		{ LinearInputIndicator: LinearInputIndicatorSchema.parse({
			positionOnCanvas: { pxFromCanvasLeft: 470, pxFromCanvasTop: 155 },
			input: {
				keyboard: { keyCode: "ArrowLeft" },
				gamepad: { stick: { type: "left", axis: "X", direction: "negative" } }
			},
			display: { text: "←" }
		}) },
		{ LinearInputIndicator: LinearInputIndicatorSchema.parse({
			positionOnCanvas: { pxFromCanvasLeft: 545, pxFromCanvasTop: 155 },
			input: {
				keyboard: { keyCode: "ArrowDown" },
				gamepad: { stick: { type: "left", axis: "Y", direction: "positive" } }
			},
			display: { text: "↓" }
		}) },
		{ LinearInputIndicator: LinearInputIndicatorSchema.parse({
			positionOnCanvas: { pxFromCanvasLeft: 620, pxFromCanvasTop: 155 },
			input: {
				keyboard: { keyCode: "ArrowRight" },
				gamepad: { stick: { type: "left", axis: "X", direction: "positive" } }
			},
			display: { text: "→" }
		}) },

		// Center: Standalone planar indicator (mouse/joystick visualization)
		{ PlanarInputIndicator: PlanarInputIndicatorSchema.parse({
			positionOnCanvas: { pxFromCanvasLeft: 860, pxFromCanvasTop: 440 }
		}) },

		// Right side WebEmbed (iframe border hugs right edge of canvas)
		// WebEmbed: 640x480, iframe has 50px padding, so iframe is 540 wide
		// Canvas right edge: 1920, iframe right = 1920, so left = 1920 - 540 = 1380
		// Accounting for padding offset: 1380 - 50 = 1330
		{ WebEmbed: WebEmbedSchema.parse({
			positionOnCanvas: { pxFromCanvasLeft: 1330, pxFromCanvasTop: 300 }
		}) },

		// Bottom left linear indicators - Row 1 (Zip, Crouch, Dash, Jump, Melee, Reload)
		// 75px wide + 10px gap = 85px spacing
		{ LinearInputIndicator: LinearInputIndicatorSchema.parse({
			positionOnCanvas: { pxFromCanvasLeft: 20, pxFromCanvasTop: 740 },
			input: { keyboard: { keyCode: "KeyW" } },
			display: { text: "Zip" }
		}) },
		{ LinearInputIndicator: LinearInputIndicatorSchema.parse({
			positionOnCanvas: { pxFromCanvasLeft: 105, pxFromCanvasTop: 740 },
			input: { keyboard: { keyCode: "KeyW" } },
			display: { text: "Crouch" }
		}) },
		{ LinearInputIndicator: LinearInputIndicatorSchema.parse({
			positionOnCanvas: { pxFromCanvasLeft: 190, pxFromCanvasTop: 740 },
			input: { keyboard: { keyCode: "KeyW" } },
			display: { text: "Dash" }
		}) },
		{ LinearInputIndicator: LinearInputIndicatorSchema.parse({
			positionOnCanvas: { pxFromCanvasLeft: 275, pxFromCanvasTop: 740 },
			input: { keyboard: { keyCode: "KeyW" } },
			display: { text: "Jump" }
		}) },
		{ LinearInputIndicator: LinearInputIndicatorSchema.parse({
			positionOnCanvas: { pxFromCanvasLeft: 360, pxFromCanvasTop: 740 },
			input: { keyboard: { keyCode: "KeyW" } },
			display: { text: "Melee" }
		}) },
		{ LinearInputIndicator: LinearInputIndicatorSchema.parse({
			positionOnCanvas: { pxFromCanvasLeft: 445, pxFromCanvasTop: 740 },
			input: { keyboard: { keyCode: "KeyW" } },
			display: { text: "Reload" }
		}) },

		// Bottom left linear indicators - Row 2 (A1, A2, A3, A4) - centered under Row 1
		{ LinearInputIndicator: LinearInputIndicatorSchema.parse({
			positionOnCanvas: { pxFromCanvasLeft: 105, pxFromCanvasTop: 825 },
			input: { keyboard: { keyCode: "KeyW" } },
			display: { text: "A1" }
		}) },
		{ LinearInputIndicator: LinearInputIndicatorSchema.parse({
			positionOnCanvas: { pxFromCanvasLeft: 190, pxFromCanvasTop: 825 },
			input: { keyboard: { keyCode: "KeyW" } },
			display: { text: "A2" }
		}) },
		{ LinearInputIndicator: LinearInputIndicatorSchema.parse({
			positionOnCanvas: { pxFromCanvasLeft: 275, pxFromCanvasTop: 825 },
			input: { keyboard: { keyCode: "KeyW" } },
			display: { text: "A3" }
		}) },
		{ LinearInputIndicator: LinearInputIndicatorSchema.parse({
			positionOnCanvas: { pxFromCanvasLeft: 360, pxFromCanvasTop: 825 },
			input: { keyboard: { keyCode: "KeyW" } },
			display: { text: "A4" }
		}) },

		// Bottom left linear indicators - Row 3 (I1, I2, I3, I4) - centered under Row 1
		{ LinearInputIndicator: LinearInputIndicatorSchema.parse({
			positionOnCanvas: { pxFromCanvasLeft: 105, pxFromCanvasTop: 910 },
			input: { keyboard: { keyCode: "KeyW" } },
			display: { text: "I1" }
		}) },
		{ LinearInputIndicator: LinearInputIndicatorSchema.parse({
			positionOnCanvas: { pxFromCanvasLeft: 190, pxFromCanvasTop: 910 },
			input: { keyboard: { keyCode: "KeyW" } },
			display: { text: "I2" }
		}) },
		{ LinearInputIndicator: LinearInputIndicatorSchema.parse({
			positionOnCanvas: { pxFromCanvasLeft: 275, pxFromCanvasTop: 910 },
			input: { keyboard: { keyCode: "KeyW" } },
			display: { text: "I3" }
		}) },
		{ LinearInputIndicator: LinearInputIndicatorSchema.parse({
			positionOnCanvas: { pxFromCanvasLeft: 360, pxFromCanvasTop: 910 },
			input: { keyboard: { keyCode: "KeyW" } },
			display: { text: "I4" }
		}) },
	];

	return {
		canvas: { width: canvas.width, height: canvas.height, backgroundColor: 'transparent' },
		objects
	};
}

// UI Helper functions (moved out of config creation)
function createUIHelpers(canvas: HTMLCanvasElement, configManager: ConfigManager, userEditModeInteractionsController: UserEditModeInteractionsController): UIHelpers {
	// CL3: Interaction state now managed by UserEditModeInteractionsController
	const propertyEditor = new PropertyEdit();

	// Helper: Show unified editor with both panels
	function showBothPanels() {
		userEditModeInteractionsController.setCreationPanelActive(true);

		// Phase2: Show canvas config (from ConfigManager - no cache)
		propertyEditor.showCanvasConfig(
			configManager.config,
			canvas,
			(config) => {
				configManager.setConfig(config);
			}
		);

		// Show both panels
		const leftPanel = document.getElementById("leftPanel");
		const rightPanel = document.getElementById("rightPanel");
		if (leftPanel) leftPanel.hidden = false;
		if (rightPanel) rightPanel.hidden = false;

		// Show container
		const containerForPossibleEditorWindows = document.getElementById("containerForPossibleEditorWindows");
		if (containerForPossibleEditorWindows) containerForPossibleEditorWindows.hidden = false;

		// Populate spawn buttons when showing panel
		populateCreationPanel();

		userEditModeInteractionsController.setEditingProperties(true);
	}

	// Helper: Hide unified editor
	function hideBothPanels() {
		try {
			propertyEditor.hidePropertyEdit();
		} finally {
			userEditModeInteractionsController.setCreationPanelActive(false);
			userEditModeInteractionsController.setEditingProperties(false);
		}

		// Hide all panels
		const leftPanel = document.getElementById("leftPanel");
		const rightPanel = document.getElementById("rightPanel");
		if (leftPanel) leftPanel.hidden = true;
		if (rightPanel) rightPanel.hidden = true;

		// Hide entire window
		const containerForPossibleEditorWindows = document.getElementById("containerForPossibleEditorWindows");
		if (containerForPossibleEditorWindows) containerForPossibleEditorWindows.hidden = true;
	}

	// Unused for now - may be needed for future serialization
	// function serializeObjectToConfig(obj: CanvasObjectInstance): CanvasObjectConfig | null {
	// 	const allObjectsConfig = objectsToConfig([obj], canvas);
	// 	if (allObjectsConfig.objects.length > 0) {
	// 		return allObjectsConfig.objects[0];
	// 	}
	// 	return null;
	// }

	// Helper: Populate creation panel from registry (DRY)
	function populateCreationPanel() {
		const content = document.getElementById('objectCreationContent');
		if (!content) return;

		// Clear existing content
		content.innerHTML = '';

		// Iterate through registry and create sections
		Object.entries(ALL_CANVAS_OBJECT_CLASSES_BY_CLASSNAME).forEach(([className, ClassConstructor]) => {
			const section = document.createElement('div');
			section.className = 'objectTypeSection';

			const header = document.createElement('p');
			header.className = 'sectionHeader';
			header.textContent = className;
			section.appendChild(header);

			// Create button for default template
			const button = document.createElement('button');
			button.className = 'createObjectBtn ButtonWhichUserCanPressToUpdateState';
			button.setAttribute('data-type', className);
			button.textContent = `Create ${className}`;
			section.appendChild(button);

			content.appendChild(section);
		});
	}

	// Helper: Create object with default position (uses Zod schemas for complete defaults)
	// ARCHITECTURE: Config-first approach - ConfigManager is single source of truth
	function createObject(type: string) {
		if (!(type in ALL_CANVAS_OBJECT_CLASSES_BY_CLASSNAME)) {
			console.error('[Spawn] Unknown type:', type, 'Available:', Object.keys(ALL_CANVAS_OBJECT_CLASSES_BY_CLASSNAME));
			return;
		}

		const schema = CANVAS_OBJECT_SCHEMAS[type as CanvasObjectClassName];
		if (!schema) {
			console.error(`No schema found for ${type}`);
			return;
		}

		// Use Zod to generate complete defaults (with default position)
		const innerConfig = schema.parse({});

		// Wrap in NixOS-style discriminated union
		const config = { [type]: innerConfig } as CanvasObjectConfig;
		configManager.addObject(config);
	}

	// Phase2: Delete object by index
	function deleteObjectAtIndex(objArrayIdx: number) {
		const config = configManager.config;
		if (objArrayIdx < 0 || objArrayIdx >= config.objects.length) return;

		// Deserialize to call cleanup (for WebEmbed iframe removal)
		const objConfig = config.objects[objArrayIdx];
		if (objConfig) {
			try {
				const obj = deserializeCanvasObject(objConfig, objArrayIdx);
				obj.cleanup?.();
			} catch (e) {
				console.error('[Delete] Failed to deserialize for cleanup:', e);
			}
		}

		configManager.deleteObject(objArrayIdx);
	}

	// Setup creation panel button listeners (use event delegation)
	const objectCreationContent = document.getElementById('objectCreationContent');
	if (objectCreationContent) {
		objectCreationContent.addEventListener('click', (e) => {
			const target = e.target as HTMLElement;
			if (target.classList.contains('createObjectBtn')) {
				const type = target.getAttribute('data-type');
				if (type) {
					createObject(type);
					hideBothPanels();  // Close entire unified editor
				}
			}
		});
	}

	// Setup Done button
	const doneBtn = document.getElementById("doneContainerForPossibleEditorWindows");
	if (doneBtn) {
		doneBtn.addEventListener("click", () => {
			hideBothPanels();
			// Phase2: Config already updated by editor callbacks - no need to sync
		});
	}

	// Setup Toggle Readonly Mode button (Electron only)
	const toggleReadonlyBtn = document.getElementById("toggleReadonlyModeButton");
	if (toggleReadonlyBtn && window.electronAPI) {
		toggleReadonlyBtn.style.display = 'flex';

		toggleReadonlyBtn.addEventListener("click", () => {
			const confirmed = confirm('Switch to readonly clickthrough mode?\n\nYou will need Task Manager to close the app.');
			if (!confirmed) return;

			userEditModeInteractionsController.setDisableInteractions(true);
			window.electronAPI!.toggleReadonlyMode();
			showToast('Readonly mode active - use Task Manager to close');
			hideBothPanels();
		});
	}

	// Setup Reset to Default Config button
	const resetToDefaultConfigBtn = document.getElementById("resetToDefaultConfigButton");
	if (resetToDefaultConfigBtn) {
		resetToDefaultConfigBtn.addEventListener("click", () => {
			const confirmed = confirm('Reset to default configuration?\n\nThis will replace your current config with the default layout.');
			if (!confirmed) return;

			const newDefaultConfig = createDefaultConfig(canvas);
			configManager.setConfig(newDefaultConfig);
			showToast('Reset to default config');
			hideBothPanels();
		});
	}

	// CL5: Return helper functions for UI interaction
	return {
		propertyEditor,
		deleteObjectAtIndex,
		showBothPanels,
		hideBothPanels
	};
}
