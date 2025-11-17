import { mouse } from './inputReaders/DOM_API/mouse';
import { keyboard } from './inputReaders/DOM_API/keyboard';
import './inputReaders/ElectronAppWrapper_API';
import { deserializeCanvasObject } from './canvasRenderer/canvasObjectTypes/index.js';
import { PropertyEdit } from './uiComponents/PropertyEdit';
import { loadConfigFromLocalStorage } from '../modelToSaveCustomConfigurationLocally/configSerializer';
import { ConfigManager } from '../modelToSaveCustomConfigurationLocally/ConfigManager';
import type { CustomisableCanvasConfig, CanvasObjectConfig } from '../modelToSaveCustomConfigurationLocally/CustomisableCanvasConfig';
import { ALL_CANVAS_OBJECT_CLASSES_BY_CLASSNAME } from '../modelToSaveCustomConfigurationLocally/CustomisableCanvasConfig';
import { CONFIG_VERSION } from '../_helpers/version';
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
		canvasRenderer.render(frameObjects);
		// Phase3: View renders hitboxes when Controller has selection
		if (userEditModeInteractionsController.hasSelection()) {
			canvasRenderer.renderDebugHitboxes(frameObjects);
		}
		// Render drag preview (semi-transparent clone at drag position)
		const dragPreview = userEditModeInteractionsController.getDragPreview();
		if (dragPreview) {
			const object = frameObjects[dragPreview.objectIndex];
			if (object) {
				canvasRenderer.renderOverlay((canvas, ctx) => {
					ctx.save();
					ctx.globalAlpha = 0.5;
					ctx.setTransform(1, 0, 0, 1, dragPreview.x, dragPreview.y);
					object.draw(canvas, ctx);
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

		window.gamepads = navigator.getGamepads();

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
}, false);

const SCENE_CONFIG_KEY = 'analogKeyboardOverlay_sceneConfig';

function saveSceneConfig(config: CustomisableCanvasConfig): void {
	try {
		const versionedConfig = { version: CONFIG_VERSION, ...config };
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
		if (parsed.version !== CONFIG_VERSION) {
			console.warn(`[Config] Version mismatch: stored=${parsed.version}, current=${CONFIG_VERSION}. Clearing localStorage.`);
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
		{ Text: TextSchema.parse({
			positionOnCanvas: { pxFromCanvasLeft: 20, pxFromCanvasTop: 20 },
			hitboxSize: { widthInPx: 800, lengthInPx: 30 },
			text: "TEST 1: Left Stick + WASD + Mouse - WITH radial compensation vs WITHOUT",
			textStyle: { textAlign: "left", font: "20px Lucida Console" }
		}) },
		{ Text: TextSchema.parse({
			positionOnCanvas: { pxFromCanvasLeft: 20, pxFromCanvasTop: 45 },
			hitboxSize: { widthInPx: 800, lengthInPx: 30 },
			text: "Move diagonally: LEFT shows ~100% (compensated), RIGHT shows ~70% (raw circular)",
			textStyle: { textAlign: "left", font: "20px Lucida Console" }
		}) },

		{ PlanarInputIndicator: PlanarInputIndicatorSchema.parse({
			positionOnCanvas: { pxFromCanvasLeft: 20, pxFromCanvasTop: 80 },
			input: {
				xAxes: { "0": true },
				yAxes: { "1": true }
			}
		}) },

		{ LinearInputIndicator: LinearInputIndicatorSchema.parse({
			positionOnCanvas: { pxFromCanvasLeft: 240, pxFromCanvasTop: 80 },
			input: {
				keyboard: { keyCode: "KeyW" },
				mouse: { button: 3, wheel: "up" },
				gamepad: {
					stick: { type: "left", axis: "Y", direction: "negative" }
				}
			},
			processing: { radialCompensationAxis: 0 },
			display: { text: "W" }
		}) },
		{ LinearInputIndicator: LinearInputIndicatorSchema.parse({
			positionOnCanvas: { pxFromCanvasLeft: 150, pxFromCanvasTop: 180 },
			input: {
				keyboard: { keyCode: "KeyA" },
				mouse: { button: 0 },
				gamepad: { stick: { type: "left", axis: "X", direction: "negative" } }
			},
			processing: { radialCompensationAxis: 1 },
			display: { text: "A" }
		}) },
		{ LinearInputIndicator: LinearInputIndicatorSchema.parse({
			positionOnCanvas: { pxFromCanvasLeft: 250, pxFromCanvasTop: 180 },
			input: {
				keyboard: { keyCode: "KeyS" },
				mouse: { button: 4, wheel: "down" },
				gamepad: { stick: { type: "left", axis: "Y", direction: "positive" } }
			},
			processing: { radialCompensationAxis: 0 },
			display: { text: "S" }
		}) },
		{ LinearInputIndicator: LinearInputIndicatorSchema.parse({
			positionOnCanvas: { pxFromCanvasLeft: 350, pxFromCanvasTop: 180 },
			input: {
				keyboard: { keyCode: "KeyD" },
				mouse: { button: 1 },
				gamepad: { stick: { type: "left", axis: "X", direction: "positive" } }
			},
			processing: { radialCompensationAxis: 1 },
			display: { text: "D" }
		}) },

		{ LinearInputIndicator: LinearInputIndicatorSchema.parse({
			positionOnCanvas: { pxFromCanvasLeft: 740, pxFromCanvasTop: 80 },
			input: {
				keyboard: { keyCode: "KeyW" },
				mouse: { button: 3, wheel: "up" },
				gamepad: { stick: { type: "left", axis: "Y", direction: "negative" } }
			},
			display: { text: "W" }
		}) },
		{ LinearInputIndicator: LinearInputIndicatorSchema.parse({
			positionOnCanvas: { pxFromCanvasLeft: 650, pxFromCanvasTop: 180 },
			input: {
				keyboard: { keyCode: "KeyA" },
				mouse: { button: 0 },
				gamepad: { stick: { type: "left", axis: "X", direction: "negative" } }
			},
			display: { text: "A" }
		}) },
		{ LinearInputIndicator: LinearInputIndicatorSchema.parse({
			positionOnCanvas: { pxFromCanvasLeft: 750, pxFromCanvasTop: 180 },
			input: {
				keyboard: { keyCode: "KeyS" },
				mouse: { button: 4, wheel: "down" },
				gamepad: { stick: { type: "left", axis: "Y", direction: "positive" } }
			},
			display: { text: "S" }
		}) },
		{ LinearInputIndicator: LinearInputIndicatorSchema.parse({
			positionOnCanvas: { pxFromCanvasLeft: 850, pxFromCanvasTop: 180 },
			input: {
				keyboard: { keyCode: "KeyD" },
				mouse: { button: 1 },
				gamepad: { stick: { type: "left", axis: "X", direction: "positive" } }
			},
			display: { text: "D" }
		}) },

		{ Text: TextSchema.parse({
			positionOnCanvas: { pxFromCanvasLeft: 1050, pxFromCanvasTop: 20 },
			hitboxSize: { widthInPx: 800, lengthInPx: 30 },
			text: "TEST 1B: Right Gamepad Stick (IJKL)",
			textStyle: { textAlign: "left", font: "20px Lucida Console" }
		}) },
		{ Text: TextSchema.parse({
			positionOnCanvas: { pxFromCanvasLeft: 1050, pxFromCanvasTop: 45 },
			hitboxSize: { widthInPx: 800, lengthInPx: 30 },
			text: "Same as Test 1, but using right stick",
			textStyle: { textAlign: "left", font: "20px Lucida Console" }
		}) },

		{ LinearInputIndicator: LinearInputIndicatorSchema.parse({
			positionOnCanvas: { pxFromCanvasLeft: 1150, pxFromCanvasTop: 80 },
			input: {
				gamepad: { stick: { type: "right", axis: "Y", direction: "negative" } }
			},
			processing: { radialCompensationAxis: 2 },
			display: { text: "I" }
		}) },
		{ LinearInputIndicator: LinearInputIndicatorSchema.parse({
			positionOnCanvas: { pxFromCanvasLeft: 1050, pxFromCanvasTop: 180 },
			input: {
				gamepad: { stick: { type: "right", axis: "X", direction: "negative" } }
			},
			processing: { radialCompensationAxis: 3 },
			display: { text: "J" }
		}) },
		{ LinearInputIndicator: LinearInputIndicatorSchema.parse({
			positionOnCanvas: { pxFromCanvasLeft: 1150, pxFromCanvasTop: 180 },
			input: {
				gamepad: { stick: { type: "right", axis: "Y", direction: "positive" } }
			},
			processing: { radialCompensationAxis: 2 },
			display: { text: "K" }
		}) },
		{ LinearInputIndicator: LinearInputIndicatorSchema.parse({
			positionOnCanvas: { pxFromCanvasLeft: 1250, pxFromCanvasTop: 180 },
			input: {
				gamepad: { stick: { type: "right", axis: "X", direction: "positive" } }
			},
			processing: { radialCompensationAxis: 3 },
			display: { text: "L" }
		}) },

		{ Text: TextSchema.parse({
			positionOnCanvas: { pxFromCanvasLeft: 20, pxFromCanvasTop: 300 },
			hitboxSize: { widthInPx: 800, lengthInPx: 30 },
			text: "TEST 3: Gamepad Buttons (Digital)",
			textStyle: { textAlign: "left", font: "20px Lucida Console" }
		}) },
		{ Text: TextSchema.parse({
			positionOnCanvas: { pxFromCanvasLeft: 20, pxFromCanvasTop: 325 },
			hitboxSize: { widthInPx: 800, lengthInPx: 30 },
			text: "Face buttons (A/B/X/Y) - digital on/off, no pressure sensitivity",
			textStyle: { textAlign: "left", font: "20px Lucida Console" }
		}) },

		{ LinearInputIndicator: LinearInputIndicatorSchema.parse({
			positionOnCanvas: { pxFromCanvasLeft: 150, pxFromCanvasTop: 360 },
			input: { gamepad: { button: { index: 0 } } },
			display: { text: "A" }
		}) },
		{ LinearInputIndicator: LinearInputIndicatorSchema.parse({
			positionOnCanvas: { pxFromCanvasLeft: 250, pxFromCanvasTop: 360 },
			input: { gamepad: { button: { index: 1 } } },
			display: { text: "B" }
		}) },
		{ LinearInputIndicator: LinearInputIndicatorSchema.parse({
			positionOnCanvas: { pxFromCanvasLeft: 350, pxFromCanvasTop: 360 },
			input: { gamepad: { button: { index: 2 } } },
			display: { text: "X" }
		}) },
		{ LinearInputIndicator: LinearInputIndicatorSchema.parse({
			positionOnCanvas: { pxFromCanvasLeft: 450, pxFromCanvasTop: 360 },
			input: { gamepad: { button: { index: 3 } } },
			display: { text: "Y" }
		}) },

		{ LinearInputIndicator: LinearInputIndicatorSchema.parse({
			positionOnCanvas: { pxFromCanvasLeft: 550, pxFromCanvasTop: 360 },
			input: { gamepad: { button: { index: 6 } } },
			display: { text: "LT" }
		}) },
		{ LinearInputIndicator: LinearInputIndicatorSchema.parse({
			positionOnCanvas: { pxFromCanvasLeft: 650, pxFromCanvasTop: 360 },
			input: { gamepad: { button: { index: 7 } } },
			display: { text: "RT" }
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

	// CL5: Return helper functions for UI interaction
	return {
		propertyEditor,
		deleteObjectAtIndex,
		showBothPanels,
		hideBothPanels
	};
}
