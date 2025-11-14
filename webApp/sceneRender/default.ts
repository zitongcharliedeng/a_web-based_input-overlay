import { mouse } from '../inputListeners/mouse.js';
import { keyboard } from '../inputListeners/keyboard.js';
import { PlanarInputIndicator_Radial } from './CanvasObjects/PlanarInputIndicator_Radial.js';
import { LinearInputIndicator } from './CanvasObjects/LinearInputIndicator.js';
import { Text } from './CanvasObjects/Text.js';
import { ImageObject } from './CanvasObjects/Image.js';
import { WebEmbed } from './CanvasObjects/WebEmbed.js';
import { PropertyEdit } from './actions/PropertyEdit.js';
import { sceneToConfig, loadConfigFromLocalStorage } from '../persistentData/sceneSerializer.js';
import { ConfigManager } from '../persistentData/ConfigManager.js';
import { CONFIG_VERSION } from '../_helpers/version.js';
import { showToast } from '../_helpers/toast.js';
import { CANVAS_OBJECT_REGISTRY } from './CanvasObjects/registry.js';
import { CanvasRenderer } from './view/CanvasRenderer.js';
import { InteractionController } from './controller/InteractionController.js';

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

// CL5: Scene now only returns initial objects for config generation
interface Scene {
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

	// CL2: Create CanvasRenderer (extracted render logic)
	const canvasRenderer = new CanvasRenderer(canvas);

	// CL3: Create InteractionController (extracted interaction logic)
	const interactionController = new InteractionController();

	// STEP 1: Create ConfigManager FIRST (must exist before createScene)
	console.log('[Init] Creating ConfigManager (empty initially)');
	const configManager = new ConfigManager({
		canvas: { width: canvas.width, height: canvas.height, backgroundColor: 'transparent' },
		objects: []
	});

	// CL5: cachedObjects is declared below, so use forward reference via getter
	let cachedObjects: CanvasObject[] = [];

	// STEP 2: Create scene (initial objects for default config)
	// Pass getter so callbacks can access runtime cachedObjects
	const activeScene = createScene(canvas, ctx, configManager, () => cachedObjects);

	// CL5: Set up InteractionController callbacks (now that we have helper functions from createScene)
	interactionController.setOnMoveObject((objectIndex, x, y) => {
		configManager.moveObject(objectIndex, x, y);
	});

	interactionController.setOnDeleteObject((objectIndex) => {
		activeScene.deleteObjectAtIndex(objectIndex);
	});

	interactionController.setOnShowPropertyEdit((obj) => {
		const objectId = obj.id;
		activeScene.propertyEditor.showPropertyEdit(
			obj.defaultProperties,
			obj,
			obj.id,
			configManager,
			() => {
				activeScene.deleteObjectById(objectId);
			}
		);
		interactionController.setEditingProperties(true);
	});

	interactionController.setOnShowCreationPanel(() => {
		activeScene.showBothPanels();
	});

	interactionController.setOnCloseEditors(() => {
		activeScene.hideBothPanels();
		// Save updated scene from cachedObjects (runtime state)
		const runtimeObjects = cachedObjects;
		const updatedConfig = sceneToConfig(runtimeObjects, canvas);
		console.log('[ClickAway] Syncing config to ConfigManager');
		configManager.setConfig(updatedConfig);
	});

	// STEP 3: Serialize scene to config
	console.log('[Init] Serializing scene to config');
	const initialConfig = sceneToConfig(activeScene.objects, canvas);

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

	// CL5: Rebuild cache when config changes
	// Config is source of truth, objects[] is cached view for performance
	configManager.onChange((newConfig) => {
		console.log('[ConfigManager] Config changed, rebuilding object cache:', newConfig.objects.length, 'objects');

		// CRITICAL: Clear interaction state before rebuild (object instances will change)
		// This prevents stale object references in InteractionController
		const hadClickedObject = interactionController.getClickedObject() !== null;
		if (hadClickedObject) {
			console.log('[ConfigManager] Clearing InteractionController state before rebuild');
			interactionController.clearSelection();
		}

		cachedObjects = [];
		let successCount = 0;
		let failCount = 0;
		for (let i = 0; i < newConfig.objects.length; i++) {
			try {
				const objData = newConfig.objects[i];
				const obj = deserializeObject(objData);
				cachedObjects.push(obj);
				successCount++;
			} catch (e) {
				console.error('[ConfigManager] Failed to deserialize object at index', i, ':', e);
				console.error('[ConfigManager] Object data:', JSON.stringify(newConfig.objects[i], null, 2));
				failCount++;
			}
		}
		console.log('[ConfigManager] Cache rebuilt:', successCount, 'succeeded,', failCount, 'failed');
	});

	// STEP 7: Update ConfigManager with actual config (triggers onChange to rebuild objects[])
	console.log('[Init] Updating ConfigManager with', configToUse.objects.length, 'objects');
	configManager.setConfig(configToUse);

	// CL2: Replaced with CanvasRenderer.render()
	// CL4: Now passes objects[] and scene separately
	// CL5: Render from cachedObjects (rebuilt from config)
	function frameUpdate(): void {
		canvasRenderer.render(cachedObjects);
		canvasRenderer.renderOverlay((canvas, ctx) => {
			interactionController.drawHitboxes(canvas, ctx, cachedObjects);
		});
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

		// CL2: Replaced with CanvasRenderer.update()
		// CL4: Now passes objects[] and scene separately
		// CL5: Update cachedObjects (rebuilt from config)
		if (canvasRenderer.update(cachedObjects, delta)) {
			updateScreen = true;
		}

		// CL5: InteractionController updates (handles dragging, clicks, etc.)
		interactionController.update(cachedObjects);
		// Note: InteractionController doesn't affect updateScreen since it's handled via ConfigManager callbacks

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

import type { LinearInputIndicatorConfig, PlanarInputIndicatorConfig, TextConfig } from '../persistentData/OmniConfig.js';
import { defaultTemplateFor_Text } from './CanvasObjects/Text.js';

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

// CL5: Pass getCachedObjects function so callbacks can access runtime state
function createScene(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D, configManager: ConfigManager, getCachedObjects: () => CanvasObject[]): Scene {
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

		// CL5: Show scene config on left panel (from cachedObjects)
		propertyEditor.showSceneConfig(
			{ objects: getCachedObjects() },
			canvas,
			(config) => {
				console.log('[Scene] Applying updated config from editor');
				// CL5: ConfigManager.onChange() will automatically rebuild cachedObjects
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
	function serializeObjectToConfig(obj: CanvasObject): import('../persistentData/OmniConfig.js').CanvasObjectConfig | null {
		const allObjectsConfig = sceneToConfig([obj], canvas);
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

		// CL5: Add to ConfigManager (single source of truth)
		// ConfigManager.onChange() will automatically rebuild cachedObjects
		console.log('[Create] Current cachedObjects length:', getCachedObjects().length);
		console.log('[Create] Current ConfigManager objects:', configManager.config.objects.length);
		console.log('[Create] Adding to ConfigManager (SoT) - onChange will rebuild cache');
		configManager.addObject(objectConfig);
		console.log('[Create] After addObject - ConfigManager objects:', configManager.config.objects.length);
	}

	// CL5: Delete object by index (from cachedObjects)
	function deleteObjectAtIndex(index: number) {
		const runtimeObjects = getCachedObjects();
		if (index < 0 || index >= runtimeObjects.length) return;

		const obj = runtimeObjects[index];
		const objType = (obj as any).className || 'Object';

		// Call cleanup if it exists (for WebEmbed iframe removal)
		if ('cleanup' in obj && typeof (obj as any).cleanup === 'function') {
			(obj as any).cleanup();
		}

		// CL5: Use ConfigManager to update config (single source of truth)
		// ConfigManager.onChange() will automatically rebuild cachedObjects
		console.log('[Delete] Removing from ConfigManager (SoT) - onChange will rebuild cache');
		configManager.deleteObject(index);
		console.log("Deleted object at index", index);
	}

	function deleteObjectById(objectId: string) {
		// CL5: Find object by ID in cachedObjects
		const runtimeObjects = getCachedObjects();
		const obj = runtimeObjects.find(o => o.id === objectId);
		if (!obj) {
			console.error(`[Delete] Object with id ${objectId} not found`);
			return;
		}

		const objType = (obj as any).className || 'Object';

		// Call cleanup if it exists (for WebEmbed iframe removal)
		if ('cleanup' in obj && typeof (obj as any).cleanup === 'function') {
			(obj as any).cleanup();
		}

		// CL5: Use ConfigManager to update config (single source of truth)
		// ConfigManager.onChange() will automatically rebuild cachedObjects
		console.log('[Delete] Removing from ConfigManager by ID (SoT) - onChange will rebuild cache');
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
			console.log('[Done] Unified Editor - saving and closing');
			hideBothPanels();

			// CL5: Save updated scene from cachedObjects (runtime state)
			const runtimeObjects = getCachedObjects();
			console.log('[Done] Serializing', runtimeObjects.length, 'objects to config');
			const updatedConfig = sceneToConfig(runtimeObjects, canvas);
			console.log('[Done] Serialized', updatedConfig.objects.length, 'objects');
			console.log('[Done] Syncing config to ConfigManager');
			configManager.setConfig(updatedConfig);
		});
	}

	// CL5: Scene returns initial objects + helper functions for external callback setup
	return {
		objects,
		propertyEditor,
		deleteObjectAtIndex,
		deleteObjectById,
		showBothPanels,
		hideBothPanels
	};
}
