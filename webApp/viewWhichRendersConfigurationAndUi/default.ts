import { mouse } from './inputReaders/mouse.js';
import { keyboard } from './inputReaders/keyboard.js';
import { PlanarInputIndicator_Radial } from './canvasRenderer/canvasObjectTypes/PlanarInputIndicator_Radial.js';
import { LinearInputIndicator } from './canvasRenderer/canvasObjectTypes/LinearInputIndicator.js';
import { Text } from './canvasRenderer/canvasObjectTypes/Text.js';
import { ImageObject } from './canvasRenderer/canvasObjectTypes/Image.js';
import { WebEmbed } from './canvasRenderer/canvasObjectTypes/WebEmbed.js';
import { PropertyEdit } from './uiComponents/PropertyEdit.js';
import { objectsToConfig, loadConfigFromLocalStorage } from '../modelToSaveCustomConfigurationLocally/configSerializer.js';
import { ConfigManager } from '../modelToSaveCustomConfigurationLocally/ConfigManager.js';
import type { OmniConfig, LinearInputIndicatorConfig, PlanarInputIndicatorConfig, TextConfig, ImageConfig, WebEmbedConfig } from '../modelToSaveCustomConfigurationLocally/OmniConfig.js';
import { CONFIG_VERSION } from '../_helpers/version.js';
import { showToast } from './uiComponents/toast.js';
import { CANVAS_OBJECT_REGISTRY } from './canvasRenderer/canvasObjectTypes/registry.js';
import { CanvasRenderer } from './canvasRenderer/CanvasRenderer.js';
import { InteractionController } from '../controllerToMutateCustomConfiguration/InteractionController.js';

declare global {
	interface Window {
		gamepads: (Gamepad | null)[] | null;
		keyboard: typeof keyboard;
		mouse: typeof mouse;
		_gamepadDebugLogged?: boolean;
	}
}

interface CanvasObject {
	id: string;  // UUID for stable object identity
	positionOnCanvas: { pxFromCanvasTop: number; pxFromCanvasLeft: number };
	hitboxSize: { widthInPx: number; lengthInPx: number };
	update: (delta: number) => boolean;
	draw: (canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D) => void;
	cleanup?: () => void;  // Optional cleanup for objects like WebEmbed
	[key: string]: unknown;  // Allow additional properties
}

// CL5: CanvasObjectCollection now only returns initial objects for config generation
interface CanvasObjectCollection {
	objects: CanvasObject[];  // Only used for initial config - runtime uses cachedObjects
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
	console.log('[Init] Creating ConfigManager (empty initially)');
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
		console.log('[ClickAway] Closing editors');
	});

	// STEP 3: Serialize canvas to config
	console.log('[Init] Serializing canvas to config');
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
		console.log('[ConfigManager] onSave callback triggered, saving to localStorage');
		console.log('[ConfigManager] Config to save:', JSON.stringify(config, null, 2).substring(0, 500) + '...');
		saveSceneConfig(config);
		showToast('Saved');
	});

	// Phase2: No onChange cache rebuild - config is deserialized every frame (pure MVC)

	// STEP 7: Update ConfigManager with actual config
	console.log('[Init] Updating ConfigManager with', configToUse.objects.length, 'objects');
	configManager.setConfig(configToUse);

	// Phase2: Frame-local objects for interaction handling
	let frameObjects: CanvasObject[] = [];

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
				console.log('[Game Loop] Gamepad detected! Count:', connectedCount);
				for (let i = 0; i < pads.length; i++) {
					if (pads[i]) {
						const pad = pads[i];
					if (pad) {
						console.log('[Game Loop] Gamepad', i, ':', pad.id, '- Axes:', pad.axes.length, 'Buttons:', pad.buttons.length);
					}
					}
				}
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
		console.log('[Save] Writing to localStorage with key:', SCENE_CONFIG_KEY);
		console.log('[Save] Object count:', config.objects?.length || 0);
		localStorage.setItem(SCENE_CONFIG_KEY, JSON.stringify(versionedConfig));
		console.log('[Save] Successfully saved to localStorage');
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

import type { CanvasObjectConfig } from '../modelToSaveCustomConfigurationLocally/OmniConfig.js';

function deserializeObject(objData: CanvasObjectConfig): CanvasObject {
	// Exhaustive type switch on flat discriminated union
	switch (objData.type) {
		case 'linearInputIndicator':
			return createLinearIndicatorFromConfig(objData);
		case 'planarInputIndicator':
			return createPlanarIndicatorFromConfig(objData);
		case 'text':
			return createTextFromConfig(objData);
		case 'image':
			return createImageFromConfig(objData);
		case 'webEmbed':
			return createWebEmbedFromConfig(objData);
		default:
			// TypeScript enforces exhaustiveness - this line ensures we handle all cases
			return ((x: never) => { throw new Error(`Unhandled object type: ${JSON.stringify(x)}`); })(objData);
	}
}

import { defaultTemplateFor_Text } from './canvasRenderer/canvasObjectTypes/Text.js';

function createLinearIndicatorFromConfig(config: LinearInputIndicatorConfig): LinearInputIndicator {
	return new LinearInputIndicator(
		config.id,
		config.positionOnCanvas.pxFromCanvasLeft,
		config.positionOnCanvas.pxFromCanvasTop,
		config.hitboxSize.widthInPx,
		config.hitboxSize.lengthInPx,
		{
			input: config.input,
			processing: config.processing,
			display: config.display
		},
		config.layerLevel
	);
}

function createPlanarIndicatorFromConfig(config: PlanarInputIndicatorConfig): PlanarInputIndicator_Radial {
	return new PlanarInputIndicator_Radial(
		config.id,
		config.positionOnCanvas.pxFromCanvasLeft,
		config.positionOnCanvas.pxFromCanvasTop,
		config.hitboxSize.widthInPx,
		config.hitboxSize.lengthInPx,
		{
			input: config.input,
			processing: config.processing,
			display: config.display
		},
		config.layerLevel
	);
}

function createTextFromConfig(config: TextConfig): Text {
	return new Text(
		config.id,
		config.positionOnCanvas.pxFromCanvasTop,
		config.positionOnCanvas.pxFromCanvasLeft,
		config.hitboxSize.widthInPx,
		config.hitboxSize.lengthInPx,
		{
			text: config.text,
			textStyle: {
				textAlign: config.textStyle.textAlign as CanvasTextAlign,
				fillStyle: config.textStyle.fillStyle,
				font: config.textStyle.font,
				strokeStyle: config.textStyle.strokeStyle,
				strokeWidth: config.textStyle.strokeWidth
			},
			shouldStroke: config.shouldStroke
		},
		config.layerLevel
	);
}

function createImageFromConfig(config: ImageConfig): ImageObject {
	return new ImageObject(
		config.id,
		config.positionOnCanvas.pxFromCanvasTop,
		config.positionOnCanvas.pxFromCanvasLeft,
		config.hitboxSize.widthInPx,
		config.hitboxSize.lengthInPx,
		{
			src: config.src,
			opacity: config.opacity
		},
		config.layerLevel
	);
}

function createWebEmbedFromConfig(config: WebEmbedConfig): WebEmbed {
	return new WebEmbed(
		config.id,
		config.positionOnCanvas.pxFromCanvasLeft,
		config.positionOnCanvas.pxFromCanvasTop,
		config.hitboxSize.widthInPx,
		config.hitboxSize.lengthInPx,
		{
			url: config.url,
			opacity: config.opacity
		},
		config.layerLevel
	);
}

// Helper to create text labels using default template
function createLabel(x: number, y: number, text: string): Text {
	return createTextFromConfig({
		id: crypto.randomUUID(),
		positionOnCanvas: { pxFromCanvasLeft: x, pxFromCanvasTop: y },
		hitboxSize: { widthInPx: 800, lengthInPx: 30 },
		layerLevel: 20,
		...defaultTemplateFor_Text,
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
			}
		),

		new LinearInputIndicator(crypto.randomUUID(), 
			240, yOffset + 60, 100, 100,
			{
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
			}
		),
		new LinearInputIndicator(crypto.randomUUID(), 
			150, yOffset + 160, 100, 100,
			{
				input: {
					keyboard: { keyCode: "KeyA" },
					mouse: { button: 0 },
					gamepad: {
						stick: { type: "left", axis: "X", direction: "negative" },
						button: { index: null }
					}
				},
				processing: { radialCompensationAxis: 1 }, display: { text: "A" }
			}
		),
		new LinearInputIndicator(crypto.randomUUID(), 
			250, yOffset + 160, 100, 100,
			{
				input: {
					keyboard: { keyCode: "KeyS" },
					mouse: { button: 4, wheel: "down" },
					gamepad: {
						stick: { type: "left", axis: "Y", direction: "positive" },
						button: { index: null }
					}
				},
				processing: { radialCompensationAxis: 0 }, display: { text: "S" }
			}
		),
		new LinearInputIndicator(crypto.randomUUID(), 
			350, yOffset + 160, 100, 100,
			{
				input: {
					keyboard: { keyCode: "KeyD" },
					mouse: { button: 1 },
					gamepad: {
						stick: { type: "left", axis: "X", direction: "positive" },
						button: { index: null }
					}
				},
				processing: { radialCompensationAxis: 1 }, display: { text: "D" }
			}
		),

		new LinearInputIndicator(crypto.randomUUID(), 
			740, yOffset + 60, 100, 100,
			{
				input: {
					keyboard: { keyCode: "KeyW" },
					mouse: { button: 3, wheel: "up" },
					gamepad: {
						stick: { type: "left", axis: "Y", direction: "negative" },
						button: { index: null }
					}
				},
				processing: { radialCompensationAxis: -1 }, display: { text: "W" }
			}
		),
		new LinearInputIndicator(crypto.randomUUID(), 
			650, yOffset + 160, 100, 100,
			{
				input: {
					keyboard: { keyCode: "KeyA" },
					mouse: { button: 0 },
					gamepad: {
						stick: { type: "left", axis: "X", direction: "negative" },
						button: { index: null }
					}
				},
				processing: { radialCompensationAxis: -1 }, display: { text: "A" }
			}
		),
		new LinearInputIndicator(crypto.randomUUID(), 
			750, yOffset + 160, 100, 100,
			{
				input: {
					keyboard: { keyCode: "KeyS" },
					mouse: { button: 4, wheel: "down" },
					gamepad: {
						stick: { type: "left", axis: "Y", direction: "positive" },
						button: { index: null }
					}
				},
				processing: { radialCompensationAxis: -1 }, display: { text: "S" }
			}
		),
		new LinearInputIndicator(crypto.randomUUID(), 
			850, yOffset + 160, 100, 100,
			{
				input: {
					keyboard: { keyCode: "KeyD" },
					mouse: { button: 1 },
					gamepad: {
						stick: { type: "left", axis: "X", direction: "positive" },
						button: { index: null }
					}
				},
				processing: { radialCompensationAxis: -1 }, display: { text: "D" }
			}
		),

		createLabel(1050, yOffset, "TEST 1B: Right Gamepad Stick (IJKL)"),
		createLabel(1050, yOffset + 25, "Same as Test 1, but using right stick"),

		new LinearInputIndicator(crypto.randomUUID(), 
			1150, yOffset + 60, 100, 100,
			{
				input: {
					keyboard: { keyCode: null },
					gamepad: {
						stick: { type: "right", axis: "Y", direction: "negative" },
						button: { index: null }
					}
				},
				processing: { radialCompensationAxis: 2 }, display: { text: "I" }
			}
		),
		new LinearInputIndicator(crypto.randomUUID(), 
			1050, yOffset + 160, 100, 100,
			{
				input: {
					keyboard: { keyCode: null },
					gamepad: {
						stick: { type: "right", axis: "X", direction: "negative" },
						button: { index: null }
					}
				},
				processing: { radialCompensationAxis: 3 }, display: { text: "J" }
			}
		),
		new LinearInputIndicator(crypto.randomUUID(), 
			1150, yOffset + 160, 100, 100,
			{
				input: {
					keyboard: { keyCode: null },
					gamepad: {
						stick: { type: "right", axis: "Y", direction: "positive" },
						button: { index: null }
					}
				},
				processing: { radialCompensationAxis: 2 }, display: { text: "K" }
			}
		),
		new LinearInputIndicator(crypto.randomUUID(), 
			1250, yOffset + 160, 100, 100,
			{
				input: {
					keyboard: { keyCode: null },
					gamepad: {
						stick: { type: "right", axis: "X", direction: "positive" },
						button: { index: null }
					}
				},
				processing: { radialCompensationAxis: 3 }, display: { text: "L" }
			}
		),

		(() => { yOffset += sectionSpacing; return createLabel(20, yOffset, "TEST 3: Gamepad Buttons (Digital)"); })(),
		createLabel(20, yOffset + 25, "Face buttons (A/B/X/Y) - digital on/off, no pressure sensitivity"),

		new LinearInputIndicator(crypto.randomUUID(), 
			150, yOffset + 60, 100, 100,
			{
				input: {
					keyboard: { keyCode: null },
					mouse: { button: null, wheel: null },
					gamepad: {
						stick: { type: null, axis: null, direction: null },
						button: { index: 0 }
					}
				},
				display: { text: "A" }
			}
		),
		new LinearInputIndicator(crypto.randomUUID(), 
			250, yOffset + 60, 100, 100,
			{
				input: {
					keyboard: { keyCode: null },
					mouse: { button: null, wheel: null },
					gamepad: {
						stick: { type: null, axis: null, direction: null },
						button: { index: 1 }
					}
				},
				display: { text: "B" }
			}
		),
		new LinearInputIndicator(crypto.randomUUID(), 
			350, yOffset + 60, 100, 100,
			{
				input: {
					keyboard: { keyCode: null },
					mouse: { button: null, wheel: null },
					gamepad: {
						stick: { type: null, axis: null, direction: null },
						button: { index: 2 }
					}
				},
				display: { text: "X" }
			}
		),
		new LinearInputIndicator(crypto.randomUUID(), 
			450, yOffset + 60, 100, 100,
			{
				input: {
					keyboard: { keyCode: null },
					mouse: { button: null, wheel: null },
					gamepad: {
						stick: { type: null, axis: null, direction: null },
						button: { index: 3 }
					}
				},
				display: { text: "Y" }
			}
		),

		new LinearInputIndicator(crypto.randomUUID(), 
			550, yOffset + 60, 100, 100,
			{
				input: {
					keyboard: { keyCode: null },
					gamepad: {
						stick: { type: null, axis: null, direction: null },
						button: { index: 6 }
					}
				},
				display: { text: "LT" }
			}
		),
		new LinearInputIndicator(crypto.randomUUID(), 
			650, yOffset + 60, 100, 100,
			{
				input: {
					keyboard: { keyCode: null },
					gamepad: {
						stick: { type: null, axis: null, direction: null },
						button: { index: 7 }
					}
				},
				display: { text: "RT" }
			}
		),
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
				console.log('[Canvas] Applying updated config from editor');
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

			// Create buttons for each template
			entry.templates.forEach(template => {
				const button = document.createElement('button');
				button.className = 'createObjectBtn ButtonWhichUserCanPressToUpdateState';
				button.setAttribute('data-type', entry.type);
				button.setAttribute('data-template', template.displayName);
				button.textContent = template.name;
				section.appendChild(button);
			});

			content.appendChild(section);
		});
	}

	// Helper: Create object with default position (uses registry)
	// ARCHITECTURE: Config-first approach - ConfigManager is single source of truth
	function createObject(type: string, template: string = 'DEFAULT') {
		console.error('=== SPAWN DEBUG START ===');
		console.error('Type:', type, 'Template:', template);

		// Find the registry entry
		const entry = CANVAS_OBJECT_REGISTRY.find(e => e.type === type);
		console.error('Registry entry found:', !!entry);
		if (!entry) {
			console.error('FAIL: Unknown object type:', type);
			console.error('Available types:', CANVAS_OBJECT_REGISTRY.map(e => e.type));
			return;
		}

		// Find the template
		const templateObj = entry.templates.find(t => t.displayName === template);
		console.error('Template found:', !!templateObj);
		if (!templateObj) {
			console.error('FAIL: Unknown template:', template);
			console.error('Available templates:', entry.templates.map(t => t.displayName));
			return;
		}

		// 1. Create OmniConfig object (not runtime object) - uses idempotent default position
		const objectConfig = templateObj.createConfig();
		console.error('Config created:', JSON.stringify(objectConfig, null, 2));

		// Phase2: Add to ConfigManager (single source of truth)
		const beforeCount = configManager.config.objects.length;
		console.error('Before addObject:', beforeCount);
		configManager.addObject(objectConfig);
		const afterCount = configManager.config.objects.length;
		console.error('After addObject:', afterCount);
		console.error('Success:', afterCount > beforeCount);
		console.error('=== SPAWN DEBUG END ===');
	}

	// Phase2: Delete object by index
	function deleteObjectAtIndex(index: number) {
		const config = configManager.config;
		if (index < 0 || index >= config.objects.length) return;

		// Deserialize to call cleanup (for WebEmbed iframe removal)
		try {
			const obj = deserializeObject(config.objects[index]);
			obj.cleanup?.();
		} catch (e) {
			console.error('[Delete] Failed to deserialize for cleanup:', e);
		}

		console.log('[Delete] Removing from ConfigManager');
		configManager.deleteObject(index);
		console.log("Deleted object at index", index);
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
		try {
			const obj = deserializeObject(config.objects[index]);
			obj.cleanup?.();
		} catch (e) {
			console.error('[Delete] Failed to deserialize for cleanup:', e);
		}

		console.log('[Delete] Removing from ConfigManager by ID');
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
			console.log('[Done] Unified Editor - closing (config already updated)');
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
