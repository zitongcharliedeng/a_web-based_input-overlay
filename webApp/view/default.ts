import { mouse } from './inputReaders/mouse.js';
import { keyboard } from './inputReaders/keyboard.js';
import { PlanarInputIndicator_Radial } from './canvasRenderer/canvasObjectTypes/PlanarInputIndicator_Radial.js';
import { LinearInputIndicator } from './canvasRenderer/canvasObjectTypes/LinearInputIndicator.js';
import { Text } from './canvasRenderer/canvasObjectTypes/Text.js';
import { ImageObject } from './canvasRenderer/canvasObjectTypes/Image.js';
import { WebEmbed } from './canvasRenderer/canvasObjectTypes/WebEmbed.js';
import { PropertyEdit } from './uiComponents/PropertyEdit.js';
import { objectsToConfig, loadConfigFromLocalStorage } from '../model/configSerializer.js';
import { ConfigManager } from '../model/ConfigManager.js';
import { CONFIG_VERSION } from '../_helpers/version.js';
import { showToast } from './uiComponents/toast.js';
import { CANVAS_OBJECT_REGISTRY } from './canvasRenderer/canvasObjectTypes/registry.js';
import { CanvasRenderer } from './canvasRenderer/CanvasRenderer.js';
import { InteractionController } from '../controller/InteractionController.js';

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
	defaultProperties: unknown;
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
		activeCanvasObjects.propertyEditor.showPropertyEdit(
			obj.defaultProperties,
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
		// Save updated canvas from cachedObjects (runtime state)
		const runtimeObjects = cachedObjects;
		const updatedConfig = objectsToConfig(runtimeObjects, canvas);
		console.log('[ClickAway] Syncing config to ConfigManager');
		configManager.setConfig(updatedConfig);
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
						console.log('[Game Loop] Gamepad', i, ':', pads[i]!.id, '- Axes:', pads[i]!.axes.length, 'Buttons:', pads[i]!.buttons.length);
					}
				}
				window._gamepadDebugLogged = true;
			}
		}

		// Phase2: Deserialize config to objects every frame (pure MVC)
		const config = configManager.getConfig();
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

function saveSceneConfig(config: any): void {
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

function loadSceneConfig(): any | null {
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
		if (!result.success) {
			console.error('[Config] Validation failed:', result.error);
			console.error('[Config] Raw data from localStorage:', raw);
			return null;
		}
		return result.config;
	} catch (e) {
		console.error('[Config] Failed to load:', e);
		return null;
	}
}

function deserializeImage(src: string): HTMLImageElement {
	const img = new Image();
	img.src = src;
	return img;
}

function deserializeObject(objData: any): CanvasObject {
	// Handle OmniConfig discriminated union format
	if ('linearInputIndicator' in objData) {
		return createLinearIndicatorFromConfig(objData.linearInputIndicator);
	} else if ('planarInputIndicator' in objData) {
		return createPlanarIndicatorFromConfig(objData.planarInputIndicator);
	} else if ('text' in objData) {
		return createTextFromConfig(objData.text);
	} else if ('image' in objData) {
		return createImageFromConfig(objData.image);
	} else if ('webEmbed' in objData) {
		return createWebEmbedFromConfig(objData.webEmbed);
	}

	// Fallback: handle old flat format (legacy) - generate UUID for missing id
	const { type, x, y, width, height, ...props } = objData;
	switch (type) {
		case 'LinearInputIndicator':
		case 'linearInputIndicator':
			return new LinearInputIndicator(crypto.randomUUID(), x, y, width, height, props, props.layerLevel);
		case 'PlanarInputIndicator_Radial':
		case 'planarInputIndicator':
			return new PlanarInputIndicator_Radial(crypto.randomUUID(), x, y, width, height, props, props.layerLevel);
		case 'Text':
		case 'text':
			return new Text(crypto.randomUUID(), y, x, width, height, props, props.layerLevel);
		default:
			throw new Error(`Unknown object type: ${type}`);
	}
}

import type { LinearInputIndicatorConfig, PlanarInputIndicatorConfig, TextConfig } from '../model/OmniConfig.js';
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
			display: config.display as any  // Temporary: old constructor has different DisplayConfig type
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

function createImageFromConfig(config: import('../persistentData/OmniConfig.js').ImageConfig): ImageObject {
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

function createWebEmbedFromConfig(config: import('../persistentData/OmniConfig.js').WebEmbedConfig): WebEmbed {
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
function createCanvasObjectCollection(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D, configManager: ConfigManager, interactionController: any): CanvasObjectCollection {
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
			configManager.getConfig(),
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
		propertyEditor.hidePropertyEdit();
		interactionController.setCreationPanelActive(false);
		interactionController.setEditingProperties(false);

		// Hide all panels
		const leftPanel = document.getElementById("leftPanel");
		const rightPanel = document.getElementById("rightPanel");
		if (leftPanel) leftPanel.hidden = true;
		if (rightPanel) rightPanel.hidden = true;

		// Hide entire window
		const unifiedEditor = document.getElementById("unifiedEditor");
		if (unifiedEditor) unifiedEditor.hidden = true;
	}

	// Helper: Serialize single object to CanvasObjectConfig format
	function serializeObjectToConfig(obj: CanvasObject): import('../model/OmniConfig.js').CanvasObjectConfig | null {
		const allObjectsConfig = objectsToConfig([obj], canvas);
		if (allObjectsConfig.objects.length > 0) {
			return allObjectsConfig.objects[0];
		}
		return null;
	}

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
		console.log('[Create] Creating new object:', type, template);

		// Find the registry entry
		const entry = CANVAS_OBJECT_REGISTRY.find(e => e.type === type);
		if (!entry) {
			console.error('[Create] Unknown object type:', type);
			return;
		}

		// Find the template
		const templateObj = entry.templates.find(t => t.displayName === template);
		if (!templateObj) {
			console.error('[Create] Unknown template:', template);
			return;
		}

		// 1. Create OmniConfig object (not runtime object) - uses idempotent default position
		const objectConfig = templateObj.createConfig();
		console.log('[Create] Created config:', JSON.stringify(objectConfig, null, 2));

		// Phase2: Add to ConfigManager (single source of truth)
		console.log('[Create] Current config objects:', configManager.config.objects.length);
		console.log('[Create] Adding to ConfigManager');
		configManager.addObject(objectConfig);
		console.log('[Create] After addObject:', configManager.config.objects.length);
	}

	// Phase2: Delete object by index
	function deleteObjectAtIndex(index: number) {
		const config = configManager.getConfig();
		if (index < 0 || index >= config.objects.length) return;

		// Deserialize to call cleanup (for WebEmbed iframe removal)
		try {
			const obj = deserializeObject(config.objects[index]);
			if ('cleanup' in obj && typeof (obj as any).cleanup === 'function') {
				(obj as any).cleanup();
			}
		} catch (e) {
			console.error('[Delete] Failed to deserialize for cleanup:', e);
		}

		console.log('[Delete] Removing from ConfigManager');
		configManager.deleteObject(index);
		console.log("Deleted object at index", index);
	}

	function deleteObjectById(objectId: string) {
		// Phase2: Delete by ID directly from config
		const config = configManager.getConfig();
		const index = config.objects.findIndex(obj => {
			if ('linearInputIndicator' in obj) return obj.linearInputIndicator.id === objectId;
			if ('planarInputIndicator' in obj) return obj.planarInputIndicator.id === objectId;
			if ('text' in obj) return obj.text.id === objectId;
			if ('image' in obj) return obj.image.id === objectId;
			if ('webEmbed' in obj) return obj.webEmbed.id === objectId;
			return false;
		});

		if (index === -1) {
			console.error(`[Delete] Object with id ${objectId} not found`);
			return;
		}

		// Call cleanup on deserialized object
		try {
			const obj = deserializeObject(config.objects[index]);
			if ('cleanup' in obj && typeof (obj as any).cleanup === 'function') {
				(obj as any).cleanup();
			}
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
