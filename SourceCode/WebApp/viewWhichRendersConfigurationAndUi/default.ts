import { mouse } from './inputReaders/mouse';
import { keyboard } from './inputReaders/keyboard';
import { PlanarInputIndicator_Radial } from './canvasRenderer/canvasObjectTypes/PlanarInputIndicator_Radial';
import { LinearInputIndicator } from './canvasRenderer/canvasObjectTypes/LinearInputIndicator';
import { Text } from './canvasRenderer/canvasObjectTypes/Text';
import { ImageObject } from './canvasRenderer/canvasObjectTypes/Image';
import { WebEmbed } from './canvasRenderer/canvasObjectTypes/WebEmbed';
import { PropertyEdit } from './uiComponents/PropertyEdit';
import { objectsToConfig, loadConfigFromLocalStorage } from '../modelToSaveCustomConfigurationLocally/configSerializer';
import { ConfigManager } from '../modelToSaveCustomConfigurationLocally/ConfigManager';
import type { OmniConfig, LinearInputIndicatorConfig, PlanarInputIndicatorConfig, TextConfig, ImageConfig, WebEmbedConfig } from '../modelToSaveCustomConfigurationLocally/OmniConfig';
import { CONFIG_VERSION } from '../_helpers/version';
import { showToast } from './uiComponents/toast';
import { CANVAS_OBJECT_REGISTRY } from './canvasRenderer/canvasObjectTypes/index';
import type { CanvasObject } from './canvasRenderer/canvasObjectTypes/BaseCanvasObject';
import { CanvasRenderer } from './canvasRenderer/CanvasRenderer';
import { InteractionController } from '../controllerToMutateCustomConfiguration/InteractionController';

declare global {
	interface Window {
		gamepads: (Gamepad | null)[] | null;
		keyboard: typeof keyboard;
		mouse: typeof mouse;
		_gamepadDebugLogged?: boolean;
	}
}

// CL5: CanvasObjectCollection returns initial objects + helper functions
interface CanvasObjectCollection {
	objects: CanvasObject[];
	propertyEditor: PropertyEdit;
	deleteObjectAtIndex: (index: number) => void;
	deleteObjectById: (id: string) => void;
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
	const canvasRenderer = new CanvasRenderer(canvas, deserializeObject);

	// CL3: Create InteractionController (extracted interaction logic)
	const interactionController = new InteractionController();

	// STEP 2: Create canvas (initial objects for default config)
	const activeCanvasObjects = createCanvasObjectCollection(canvas, ctx, configManager, interactionController);

	// CL5: Set up InteractionController callbacks (now that we have helper functions from createCanvasObjectCollection)
	interactionController.setOnMoveObject((objectIndex, x, y) => {
		configManager.moveObject(objectIndex, x, y);
	});

	interactionController.setOnDeleteObject((objectIndex) => {
		activeCanvasObjects.deleteObjectAtIndex(objectIndex);
	});

	interactionController.setOnShowPropertyEdit((obj) => {
		const objectId = obj.id;
		// Find the config for this object using type-safe access
		const config = configManager.config;
		const objConfig = config.objects.find(o => o.id === objectId);

		if (!objConfig) {
			console.error('[PropertyEdit] Could not find config for object', objectId);
			return;
		}

		// Pass entire config - PropertyEdit renders ALL properties programmatically
		activeCanvasObjects.propertyEditor.showPropertyEdit(
			objConfig,
			obj,
			obj.id,
			configManager,
			() => {
				activeCanvasObjects.deleteObjectById(objectId);
			}
		);
		interactionController.setEditingProperties(true);
	});

	interactionController.setOnShowCreationPanel(() => {
		activeCanvasObjects.showBothPanels();
	});

	interactionController.setOnCloseEditors(() => {
		activeCanvasObjects.hideBothPanels();
		// Phase2: Config already updated by editor callbacks - no need to sync from runtime objects
	});

	// STEP 3: Serialize canvas to config
	const initialConfig = objectsToConfig(activeCanvasObjects.objects, canvas);

	// STEP 4: Try to load saved config from localStorage
	const savedConfig = loadSceneConfig();
	const configToUse = savedConfig || initialConfig;

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
	let frameObjects: readonly CanvasObject[] = [];

	// Phase2: Render from config (pure MVC - no cache)
	function frameUpdate(): void {
		canvasRenderer.render(frameObjects);
		// Phase3: View renders hitboxes when Controller has selection
		if (interactionController.hasSelection()) {
			canvasRenderer.renderDebugHitboxes(frameObjects);
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
		interactionController.update(frameObjects);

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

function saveSceneConfig(config: OmniConfig): void {
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

// Unused for now - may be needed for future deserialization
// function deserializeImage(src: string): HTMLImageElement {
// 	const img = new Image();
// 	img.src = src;
// 	return img;
// }

import type { CanvasObjectConfig } from '../modelToSaveCustomConfigurationLocally/OmniConfig';

import { CANVAS_OBJECT_CLASSES } from './canvasRenderer/canvasObjectTypes/index';

function deserializeObject(objData: CanvasObjectConfig): CanvasObject {
	// Loop over classes, use static fromConfig() method
	for (const cls of CANVAS_OBJECT_CLASSES) {
		if (objData.type === cls.TYPE) {
			return cls.fromConfig(objData as any);
		}
	}
	throw new Error(`Unknown object type: ${(objData as any).type}`);
}

// Helper to create text labels using default template
function createLabel(x: number, y: number, text: string): Text {
	return Text.fromConfig({
		type: 'text',
		id: crypto.randomUUID(),
		positionOnCanvas: { pxFromCanvasLeft: x, pxFromCanvasTop: y },
		hitboxSize: { widthInPx: 800, lengthInPx: 30 },
		layerLevel: 20,
		...Text.DEFAULT_TEMPLATE,
		text
	});
}

// CL5: Pass getCachedObjects function and interactionController so callbacks can access runtime state
function createCanvasObjectCollection(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D, configManager: ConfigManager, interactionController: InteractionController): CanvasObjectCollection {
	let yOffset = 20;
	const sectionSpacing = 280;

	const objects: CanvasObject[] = [
		createLabel(20, yOffset, "TEST 1: Left Stick + WASD + Mouse - WITH radial compensation vs WITHOUT"),
		createLabel(20, yOffset + 25, "Move diagonally: LEFT shows ~100% (compensated), RIGHT shows ~70% (raw circular)"),

		new PlanarInputIndicator_Radial(crypto.randomUUID(), 
			20, yOffset + 60, 200, 200,
			{
			input: {
				xAxes: { 0: true },
				yAxes: { 1: true },
				invertX: false,
				invertY: false
				},
				display: {
				radius: 100,
				backgroundStyle: {lineWidth:2, strokeStyle:"#B4B4B4", fillStyle:"rgba(0, 0, 0, 0)"},
				xLineStyle: {strokeStyle:"#FF0000", lineWidth:2},
				yLineStyle: {strokeStyle:"#00FF00", lineWidth:2},
				deadzoneStyle: {fillStyle:"#524d4d"},
				inputVectorStyle: {strokeStyle:"#FFFF00", lineWidth:2},
				unitVectorStyle: {strokeStyle:"#0000FF", lineWidth:2}
				}
		}),

		new LinearInputIndicator({
			positionOnCanvas: { pxFromCanvasLeft: 240, pxFromCanvasTop: yOffset + 60 },
			input: {
				keyboard: { keyCode: "KeyW" },
				mouse: { button: 3, wheel: "up" },
				gamepad: {
				stick: { type: "left", axis: "Y", direction: "negative" },
				button: { index: null }
				}
			},
			processing: { radialCompensationAxis: 0 },
			display: { text: "W" }
		}),
		new LinearInputIndicator({
			positionOnCanvas: { pxFromCanvasLeft: 150, pxFromCanvasTop: yOffset + 160 },
			hitboxSize: { widthInPx: 100, lengthInPx: 100 },
			input: {
				keyboard: { keyCode: "KeyA" },
				mouse: { button: 0 },
				gamepad: {
				stick: { type: "left", axis: "X", direction: "negative" },
				button: { index: null }
				}
			},
			processing: { radialCompensationAxis: 1 },
			display: { text: "A" }
		}),
		new LinearInputIndicator({
			positionOnCanvas: { pxFromCanvasLeft: 250, pxFromCanvasTop: yOffset + 160 },
			hitboxSize: { widthInPx: 100, lengthInPx: 100 },
			input: {
				keyboard: { keyCode: "KeyS" },
				mouse: { button: 4, wheel: "down" },
				gamepad: {
				stick: { type: "left", axis: "Y", direction: "positive" },
				button: { index: null }
				}
			},
			processing: { radialCompensationAxis: 0 },
			display: { text: "S" }
		}),
		new LinearInputIndicator({
			positionOnCanvas: { pxFromCanvasLeft: 350, pxFromCanvasTop: yOffset + 160 },
			hitboxSize: { widthInPx: 100, lengthInPx: 100 },
			input: {
				keyboard: { keyCode: "KeyD" },
				mouse: { button: 1 },
				gamepad: {
					stick: { type: "left", axis: "X", direction: "positive" },
					button: { index: null }
				}
				},
				processing: { radialCompensationAxis: 1 },
			display: { text: "D" }
		}),

		new LinearInputIndicator({
			positionOnCanvas: { pxFromCanvasLeft: 740, pxFromCanvasTop: yOffset + 60 },
			hitboxSize: { widthInPx: 100, lengthInPx: 100 },
			input: {
				keyboard: { keyCode: "KeyW" },
				mouse: { button: 3, wheel: "up" },
				gamepad: {
					stick: { type: "left", axis: "Y", direction: "negative" },
					button: { index: null }
				}
				},
				processing: { radialCompensationAxis: -1 },
			display: { text: "W" }
		}),
		new LinearInputIndicator({
			positionOnCanvas: { pxFromCanvasLeft: 650, pxFromCanvasTop: yOffset + 160 },
			hitboxSize: { widthInPx: 100, lengthInPx: 100 },
			input: {
				keyboard: { keyCode: "KeyA" },
				mouse: { button: 0 },
				gamepad: {
					stick: { type: "left", axis: "X", direction: "negative" },
					button: { index: null }
				}
				},
				processing: { radialCompensationAxis: -1 },
			display: { text: "A" }
		}),
		new LinearInputIndicator({
			positionOnCanvas: { pxFromCanvasLeft: 750, pxFromCanvasTop: yOffset + 160 },
			hitboxSize: { widthInPx: 100, lengthInPx: 100 },
			input: {
				keyboard: { keyCode: "KeyS" },
				mouse: { button: 4, wheel: "down" },
				gamepad: {
					stick: { type: "left", axis: "Y", direction: "positive" },
					button: { index: null }
				}
				},
				processing: { radialCompensationAxis: -1 },
			display: { text: "S" }
		}),
		new LinearInputIndicator({
			positionOnCanvas: { pxFromCanvasLeft: 850, pxFromCanvasTop: yOffset + 160 },
			hitboxSize: { widthInPx: 100, lengthInPx: 100 },
			input: {
				keyboard: { keyCode: "KeyD" },
				mouse: { button: 1 },
				gamepad: {
					stick: { type: "left", axis: "X", direction: "positive" },
					button: { index: null }
				}
				},
				processing: { radialCompensationAxis: -1 },
			display: { text: "D" }
		}),

		createLabel(1050, yOffset, "TEST 1B: Right Gamepad Stick (IJKL)"),
		createLabel(1050, yOffset + 25, "Same as Test 1, but using right stick"),

		new LinearInputIndicator({
			positionOnCanvas: { pxFromCanvasLeft: 1150, pxFromCanvasTop: yOffset + 60 },
			hitboxSize: { widthInPx: 100, lengthInPx: 100 },
			input: {
				keyboard: { keyCode: null },
				gamepad: {
					stick: { type: "right", axis: "Y", direction: "negative" },
					button: { index: null }
				}
				},
				processing: { radialCompensationAxis: 2 },
			display: { text: "I" }
		}),
		new LinearInputIndicator({
			positionOnCanvas: { pxFromCanvasLeft: 1050, pxFromCanvasTop: yOffset + 160 },
			hitboxSize: { widthInPx: 100, lengthInPx: 100 },
			input: {
				keyboard: { keyCode: null },
				gamepad: {
					stick: { type: "right", axis: "X", direction: "negative" },
					button: { index: null }
				}
				},
				processing: { radialCompensationAxis: 3 },
			display: { text: "J" }
		}),
		new LinearInputIndicator({
			positionOnCanvas: { pxFromCanvasLeft: 1150, pxFromCanvasTop: yOffset + 160 },
			hitboxSize: { widthInPx: 100, lengthInPx: 100 },
			input: {
				keyboard: { keyCode: null },
				gamepad: {
					stick: { type: "right", axis: "Y", direction: "positive" },
					button: { index: null }
				}
				},
				processing: { radialCompensationAxis: 2 },
			display: { text: "K" }
		}),
		new LinearInputIndicator({
			positionOnCanvas: { pxFromCanvasLeft: 1250, pxFromCanvasTop: yOffset + 160 },
			hitboxSize: { widthInPx: 100, lengthInPx: 100 },
			input: {
				keyboard: { keyCode: null },
				gamepad: {
					stick: { type: "right", axis: "X", direction: "positive" },
					button: { index: null }
				}
				},
				processing: { radialCompensationAxis: 3 },
			display: { text: "L" }
		}),

		(() => { yOffset += sectionSpacing; return createLabel(20, yOffset, "TEST 3: Gamepad Buttons (Digital)"); })(),
		createLabel(20, yOffset + 25, "Face buttons (A/B/X/Y) - digital on/off, no pressure sensitivity"),

		new LinearInputIndicator({
			positionOnCanvas: { pxFromCanvasLeft: 150, pxFromCanvasTop: yOffset + 60 },
			hitboxSize: { widthInPx: 100, lengthInPx: 100 },
			input: {
				keyboard: { keyCode: null },
				mouse: { button: null, wheel: null },
				gamepad: {
					stick: { type: null, axis: null, direction: null },
					button: { index: 0 }
				}
				},
				display: { text: "A" }
		}),
		new LinearInputIndicator({
			positionOnCanvas: { pxFromCanvasLeft: 250, pxFromCanvasTop: yOffset + 60 },
			hitboxSize: { widthInPx: 100, lengthInPx: 100 },
			input: {
				keyboard: { keyCode: null },
				mouse: { button: null, wheel: null },
				gamepad: {
					stick: { type: null, axis: null, direction: null },
					button: { index: 1 }
				}
				},
				display: { text: "B" }
		}),
		new LinearInputIndicator({
			positionOnCanvas: { pxFromCanvasLeft: 350, pxFromCanvasTop: yOffset + 60 },
			hitboxSize: { widthInPx: 100, lengthInPx: 100 },
			input: {
				keyboard: { keyCode: null },
				mouse: { button: null, wheel: null },
				gamepad: {
					stick: { type: null, axis: null, direction: null },
					button: { index: 2 }
				}
				},
				display: { text: "X" }
		}),
		new LinearInputIndicator({
			positionOnCanvas: { pxFromCanvasLeft: 450, pxFromCanvasTop: yOffset + 60 },
			hitboxSize: { widthInPx: 100, lengthInPx: 100 },
			input: {
				keyboard: { keyCode: null },
				mouse: { button: null, wheel: null },
				gamepad: {
					stick: { type: null, axis: null, direction: null },
					button: { index: 3 }
				}
				},
				display: { text: "Y" }
		}),

		new LinearInputIndicator({
			positionOnCanvas: { pxFromCanvasLeft: 550, pxFromCanvasTop: yOffset + 60 },
			hitboxSize: { widthInPx: 100, lengthInPx: 100 },
			input: {
				keyboard: { keyCode: null },
				gamepad: {
					stick: { type: null, axis: null, direction: null },
					button: { index: 6 }
				}
				},
				display: { text: "LT" }
		}),
		new LinearInputIndicator({
			positionOnCanvas: { pxFromCanvasLeft: 650, pxFromCanvasTop: yOffset + 60 },
			hitboxSize: { widthInPx: 100, lengthInPx: 100 },
			input: {
				keyboard: { keyCode: null },
				gamepad: {
					stick: { type: null, axis: null, direction: null },
					button: { index: 7 }
				}
				},
				display: { text: "RT" }
		}),
	];

	// CL3: Interaction state now managed by InteractionController
	const propertyEditor = new PropertyEdit();

	// Helper: Show unified editor with both panels
	function showBothPanels() {
		interactionController.setCreationPanelActive(true);

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

		// Show unified editor
		const unifiedEditor = document.getElementById("unifiedEditor");
		if (unifiedEditor) unifiedEditor.hidden = false;

		interactionController.setEditingProperties(true);
	}

	// Helper: Hide unified editor
	function hideBothPanels() {
		try {
			propertyEditor.hidePropertyEdit();
		} finally {
			interactionController.setCreationPanelActive(false);
			interactionController.setEditingProperties(false);
		}

		// Hide all panels
		const leftPanel = document.getElementById("leftPanel");
		const rightPanel = document.getElementById("rightPanel");
		if (leftPanel) leftPanel.hidden = true;
		if (rightPanel) rightPanel.hidden = true;

		// Hide entire window
		const unifiedEditor = document.getElementById("unifiedEditor");
		if (unifiedEditor) unifiedEditor.hidden = true;
	}

	// Unused for now - may be needed for future serialization
	// function serializeObjectToConfig(obj: CanvasObject): CanvasObjectConfig | null {
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
		CANVAS_OBJECT_REGISTRY.forEach(entry => {
			const section = document.createElement('div');
			section.className = 'objectTypeSection';

			const header = document.createElement('p');
			header.className = 'sectionHeader';
			header.textContent = entry.displayName;
			section.appendChild(header);

			// Create button for default template
			const button = document.createElement('button');
			button.className = 'createObjectBtn ButtonWhichUserCanPressToUpdateState';
			button.setAttribute('data-type', entry.type);
			button.textContent = `Create ${entry.displayName}`;
			section.appendChild(button);

			content.appendChild(section);
		});
	}

	// Helper: Create object with default position (uses registry)
	// ARCHITECTURE: Config-first approach - ConfigManager is single source of truth
	function createObject(type: string) {
		const entry = CANVAS_OBJECT_REGISTRY.find(e => e.type === type);
		if (!entry) {
			console.error('[Spawn] Unknown type:', type, 'Available:', CANVAS_OBJECT_REGISTRY.map(e => e.type));
			return;
		}

		const objectConfig = {
			type,
			id: crypto.randomUUID(),
			positionOnCanvas: { pxFromCanvasLeft: 100, pxFromCanvasTop: 100 },
			hitboxSize: { widthInPx: 100, lengthInPx: 100 },
			layerLevel: 10,
			...(entry.template as object)
		} as CanvasObjectConfig;

		configManager.addObject(objectConfig);
	}

	// Phase2: Delete object by index
	function deleteObjectAtIndex(index: number) {
		const config = configManager.config;
		if (index < 0 || index >= config.objects.length) return;

		// Deserialize to call cleanup (for WebEmbed iframe removal)
		const objConfig = config.objects[index];
		if (objConfig) {
			try {
				const obj = deserializeObject(objConfig);
				obj.cleanup?.();
			} catch (e) {
				console.error('[Delete] Failed to deserialize for cleanup:', e);
			}
		}

		configManager.deleteObject(index);
	}

	function deleteObjectById(objectId: string) {
		// Phase2: Delete by ID directly from config (now simple!)
		const config = configManager.config;
		const index = config.objects.findIndex(obj => obj.id === objectId);

		if (index === -1) {
			console.error(`[Delete] Object with id ${objectId} not found`);
			return;
		}

		// Call cleanup on deserialized object
		const objConfig = config.objects[index];
		if (objConfig) {
			try {
				const obj = deserializeObject(objConfig);
				obj.cleanup?.();
			} catch (e) {
				console.error('[Delete] Failed to deserialize for cleanup:', e);
			}
		}

		configManager.deleteObjectById(objectId);
	}

	// Populate creation panel from registry (DRY)
	populateCreationPanel();

	// Setup creation panel button listeners (use event delegation)
	const objectCreationContent = document.getElementById('objectCreationContent');
	if (objectCreationContent) {
		objectCreationContent.addEventListener('click', (e) => {
			const target = e.target as HTMLElement;
			if (target.classList.contains('createObjectBtn')) {
				const type = target.getAttribute('data-type');
				const template = target.getAttribute('data-template');
				if (type) {
				createObject(type, template || 'DEFAULT');
				hideBothPanels();  // Close entire unified editor
				}
			}
		});
	}

	// Setup unified Done button (single source of truth)
	const doneUnifiedEditorBtn = document.getElementById("doneUnifiedEditor");
	if (doneUnifiedEditorBtn) {
		doneUnifiedEditorBtn.addEventListener("click", () => {
			hideBothPanels();
			// Phase2: Config already updated by editor callbacks - no need to sync
		});
	}

	// CL5: CanvasObjectCollection returns initial objects + helper functions for external callback setup
	return {
		objects,
		propertyEditor,
		deleteObjectAtIndex,
		deleteObjectById,
		showBothPanels,
		hideBothPanels
	};
}
