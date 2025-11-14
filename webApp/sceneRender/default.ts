import { mouse } from '../inputListeners/mouse.js';
import { keyboard } from '../inputListeners/keyboard.js';
import { PlanarInputIndicator_Radial } from './CanvasObjects/PlanarInputIndicator_Radial.js';
import { LinearInputIndicator } from './CanvasObjects/LinearInputIndicator.js';
import { Text } from './CanvasObjects/Text.js';
import { ImageObject } from './CanvasObjects/Image.js';
import { WebEmbed } from './CanvasObjects/WebEmbed.js';
import { PropertyEdit } from './actions/PropertyEdit.js';
import { Vector } from '../_helpers/Vector.js';
import { canvas_properties } from '../_helpers/draw.js';
import { sceneToConfig, loadConfigFromLocalStorage } from '../persistentData/sceneSerializer.js';
import { ConfigManager } from '../persistentData/ConfigManager.js';
import { CONFIG_VERSION } from '../_helpers/version.js';

declare global {
	interface Window {
		gamepads: (Gamepad | null)[] | null;
		keyboard: typeof keyboard;
		mouse: typeof mouse;
		_gamepadDebugLogged?: boolean;
	}
}

interface CanvasObject {
	positionOnCanvas: { pxFromCanvasTop: number; pxFromCanvasLeft: number };
	hitboxSize: { widthInPx: number; lengthInPx: number };
	update: (delta: number) => boolean;
	draw: (canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D) => void;
	defaultProperties: unknown;
}

interface Scene {
	objects: CanvasObject[];
	draw: (canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D) => void;
	update: (delta: number) => boolean;
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

	// Initialize ConfigManager early (will be updated with actual scene config)
	const configManager = new ConfigManager({
		canvas: { width: canvas.width, height: canvas.height, backgroundColor: 'transparent' },
		objects: []
	});

	configManager.onSave((config) => {
		saveSceneConfig(config);
	});

	const activeScene = createScene(canvas, ctx, configManager);

	// Try to load saved config from localStorage
	const savedConfig = loadSceneConfig();
	if (savedConfig) {
		try {
			if (savedConfig.canvas) {
				canvas.width = savedConfig.canvas.width;
				canvas.height = savedConfig.canvas.height;
			}
			if (savedConfig.objects) {
				activeScene.objects.length = 0;
				for (const objData of savedConfig.objects) {
					activeScene.objects.push(deserializeObject(objData));
				}
			}
		} catch (e) {
			console.error('[Config] Failed to apply saved config, using defaults:', e);
		}
	}

	// Update ConfigManager with actual scene config
	const currentConfig = sceneToConfig(activeScene.objects, canvas);
	configManager.setConfig(currentConfig);

	function frameUpdate(): void {
		ctx.setTransform(1, 0, 0, 1, 0, 0);
		ctx.clearRect(0, 0, canvas.width, canvas.height);

		activeScene.draw(canvas, ctx);
		ctx.closePath();

		for (let i = 0; i < activeScene.objects.length; i++) {
			const object = activeScene.objects[i];
			ctx.setTransform(1, 0, 0, 1, object.positionOnCanvas.pxFromCanvasLeft, object.positionOnCanvas.pxFromCanvasTop);
			object.draw(canvas, ctx);
			ctx.closePath();
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

		if (activeScene.update(delta) === true) {
			updateScreen = true;
		}

		for (let i = 0; i < activeScene.objects.length; i++) {
			const object = activeScene.objects[i];
			if (object.update(delta) === true) {
				updateScreen = true;
			}
		}

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
		localStorage.setItem(SCENE_CONFIG_KEY, JSON.stringify(versionedConfig));
	} catch (e) {
		console.error('[Config] Failed to save:', e);
	}
}

function loadSceneConfig(): any | null {
	try {
		const result = loadConfigFromLocalStorage(SCENE_CONFIG_KEY);
		if (!result.success) {
			if (result.error === 'not_found') {
				return null;
			}
			console.error('[Config] Validation failed:', result.error);
			// Also log the raw localStorage data for debugging
			const raw = localStorage.getItem(SCENE_CONFIG_KEY);
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
	}

	// Fallback: handle old flat format (legacy)
	const { type, x, y, width, height, ...props } = objData;
	switch (type) {
		case 'LinearInputIndicator':
		case 'linearInputIndicator':
			return new LinearInputIndicator(x, y, width, height, props, props.layerLevel);
		case 'PlanarInputIndicator_Radial':
		case 'planarInputIndicator':
			return new PlanarInputIndicator_Radial(x, y, width, height, props, props.layerLevel);
		case 'Text':
		case 'text':
			return new Text(y, x, width, height, props, props.layerLevel);
		default:
			throw new Error(`Unknown object type: ${type}`);
	}
}

import type { LinearInputIndicatorConfig, PlanarInputIndicatorConfig, TextConfig } from '../persistentData/OmniConfig.js';
import { defaultTemplateFor_Text } from './CanvasObjects/Text.js';

function createLinearIndicatorFromConfig(config: LinearInputIndicatorConfig): LinearInputIndicator {
	return new LinearInputIndicator(
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

// Helper to create text labels using default template
function createLabel(x: number, y: number, text: string): Text {
	return createTextFromConfig({
		...defaultTemplateFor_Text,
		positionOnCanvas: { pxFromCanvasLeft: x, pxFromCanvasTop: y },
		text
	});
}

function createScene(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D, configManager: ConfigManager): Scene {
	let yOffset = 20;
	const sectionSpacing = 280;

	const objects: CanvasObject[] = [
		createLabel(20, yOffset, "TEST 1: Left Stick + WASD + Mouse - WITH radial compensation vs WITHOUT"),
		createLabel(20, yOffset + 25, "Move diagonally: LEFT shows ~100% (compensated), RIGHT shows ~70% (raw circular)"),

		new PlanarInputIndicator_Radial(
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

		new LinearInputIndicator(
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
		new LinearInputIndicator(
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
		new LinearInputIndicator(
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
		new LinearInputIndicator(
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

		new LinearInputIndicator(
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
		new LinearInputIndicator(
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
		new LinearInputIndicator(
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
		new LinearInputIndicator(
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

		new LinearInputIndicator(
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
		new LinearInputIndicator(
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
		new LinearInputIndicator(
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
		new LinearInputIndicator(
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

		new LinearInputIndicator(
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
		new LinearInputIndicator(
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
		new LinearInputIndicator(
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
		new LinearInputIndicator(
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

		new LinearInputIndicator(
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
		new LinearInputIndicator(
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

	let clickedObject: CanvasObject | null = null;
	const draggingOffset = new Vector(0, 0);
	const gridsize = 10;
	const propertyEditor = new PropertyEdit();
	let editingProperties = false;
	let creationPanelActive = false;
	let creationClickX = 0;
	let creationClickY = 0;

	// Helper: Show object creation panel
	function showCreationPanel(x: number, y: number) {
		creationClickX = x;
		creationClickY = y;
		creationPanelActive = true;
		const panel = document.getElementById("objectCreationPanel");
		if (panel) panel.hidden = false;
	}

	// Helper: Hide object creation panel
	function hideCreationPanel() {
		creationPanelActive = false;
		const panel = document.getElementById("objectCreationPanel");
		if (panel) panel.hidden = true;
	}

	// Helper: Create object at click position
	function createObjectAt(x: number, y: number, type: string) {
		let newObject: CanvasObject | null = null;

		if (type === "LinearInputIndicator") {
			newObject = new LinearInputIndicator(x, y, 100, 100);
		} else if (type === "PlanarInputIndicator") {
			newObject = new PlanarInputIndicator_Radial(x, y, 200, 200);
		} else if (type === "Text") {
			newObject = new Text(x, y, 200, 30, { text: "New Text" });
		} else if (type === "WebEmbed") {
			newObject = new WebEmbed(x, y, 400, 300, { url: "https://www.twitch.tv/" });
		}

		if (newObject) {
			objects.push(newObject);
			// Save to config
			const updatedConfig = sceneToConfig(objects, canvas);
			saveSceneConfig(updatedConfig);
			configManager.setConfig(updatedConfig);
			console.log("Created new", type, "at", x, y);
		}
	}

	// Setup creation panel button listeners
	const createLinearBtn = document.getElementById("createLinearInputIndicator");
	const createPlanarBtn = document.getElementById("createPlanarInputIndicator");
	const createTextBtn = document.getElementById("createText");
	const createWebEmbedBtn = document.getElementById("createWebEmbed");
	const cancelBtn = document.getElementById("cancelObjectCreation");

	if (createLinearBtn) {
		createLinearBtn.addEventListener("click", () => {
			createObjectAt(creationClickX, creationClickY, "LinearInputIndicator");
			hideCreationPanel();
		});
	}
	if (createPlanarBtn) {
		createPlanarBtn.addEventListener("click", () => {
			createObjectAt(creationClickX, creationClickY, "PlanarInputIndicator");
			hideCreationPanel();
		});
	}
	if (createTextBtn) {
		createTextBtn.addEventListener("click", () => {
			createObjectAt(creationClickX, creationClickY, "Text");
			hideCreationPanel();
		});
	}
	if (createWebEmbedBtn) {
		createWebEmbedBtn.addEventListener("click", () => {
			createObjectAt(creationClickX, creationClickY, "WebEmbed");
			hideCreationPanel();
		});
	}
	if (cancelBtn) {
		cancelBtn.addEventListener("click", () => {
			hideCreationPanel();
		});
	}

	return {
		objects,

		draw(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D): void {
			if (clickedObject !== null) {
				for (let i = 0; i < objects.length; i++) {
					const object = objects[i];
					ctx.setTransform(1, 0, 0, 1, object.positionOnCanvas.pxFromCanvasLeft, object.positionOnCanvas.pxFromCanvasTop);
					ctx.beginPath();
					canvas_properties(ctx, {strokeStyle:"#FF00FF", lineWidth:1})
					ctx.rect(0, 0, object.hitboxSize.widthInPx, object.hitboxSize.lengthInPx);
					ctx.stroke();
				}
			}
		},

		update(delta: number): boolean {
			if (mouse.clicks[0] === true || mouse.clicks[2] === true) {
				clickedObject = null;
				for (let i = 0; i < objects.length; i++) {
					const object = objects[i];
					if ((mouse.x > object.positionOnCanvas.pxFromCanvasLeft && mouse.y > object.positionOnCanvas.pxFromCanvasTop)
					&& (mouse.x < object.positionOnCanvas.pxFromCanvasLeft + object.hitboxSize.widthInPx && mouse.y < object.positionOnCanvas.pxFromCanvasTop + object.hitboxSize.lengthInPx)) {
						draggingOffset.x = object.positionOnCanvas.pxFromCanvasLeft - mouse.x;
						draggingOffset.y = object.positionOnCanvas.pxFromCanvasTop - mouse.y;
						clickedObject = object;
						console.log("Clicked on object:", object);
						break;
					}
				}
			}

			if ((mouse.buttons[0] === false && mouse.buttons[2] === false) && clickedObject !== null) {
				console.log("Released mouse - saving position via ConfigManager");
				// Find object index
				const objectIndex = objects.indexOf(clickedObject);
				if (objectIndex >= 0) {
					// Update config immutably via ConfigManager (triggers auto-save)
					configManager.moveObject(
						objectIndex,
						clickedObject.positionOnCanvas.pxFromCanvasLeft,
						clickedObject.positionOnCanvas.pxFromCanvasTop
					);
				}
				clickedObject = null;
			}

			if (clickedObject !== null && mouse.buttons[0] === true) {
				console.log("Dragging");
				clickedObject.positionOnCanvas.pxFromCanvasLeft = Math.round((mouse.x + draggingOffset.x)/gridsize)*gridsize;
				clickedObject.positionOnCanvas.pxFromCanvasTop = Math.round((mouse.y + draggingOffset.y)/gridsize)*gridsize;
			}

			if (mouse.clicks[2] === true || mouse.clicks[0] === true) {
				if (clickedObject === null && (editingProperties === true || creationPanelActive === true)) {
					console.log("clicked away from editor/panel - saving changes");
					propertyEditor.hidePropertyEdit();
					hideCreationPanel();
					editingProperties = false;

					// Save updated scene to localStorage
					const updatedConfig = sceneToConfig(objects, canvas);
					saveSceneConfig(updatedConfig);
					configManager.setConfig(updatedConfig);
				}
			}

			if (mouse.clicks[2] === true && clickedObject !== null && editingProperties === false && creationPanelActive === false) {
				console.log("Right-clicked object - showing PropertyEdit");
				propertyEditor.showPropertyEdit(clickedObject.defaultProperties, clickedObject);
				editingProperties = true;

				// Add delete option via confirm dialog
				// Note: Delete is handled via 'Delete' key or confirm dialog
				// For now, user can press Delete key while object is selected
			}

			if (mouse.clicks[2] === true && clickedObject === null && editingProperties === false && creationPanelActive === false) {
				console.log("Right-clicked background - showing object creation panel");
				showCreationPanel(mouse.x, mouse.y);
			}

			// Handle delete key (Delete or Backspace)
			if ((keyboard['Delete'] || keyboard['Backspace']) && clickedObject !== null) {
				const objectIndex = objects.indexOf(clickedObject);
				if (objectIndex >= 0) {
					console.log("Deleting object at index", objectIndex);
					// Call cleanup if it exists (for WebEmbed iframe removal)
					if ('cleanup' in clickedObject && typeof (clickedObject as any).cleanup === 'function') {
						(clickedObject as any).cleanup();
					}
					objects.splice(objectIndex, 1);
					clickedObject = null;
					// Save to config
					const updatedConfig = sceneToConfig(objects, canvas);
					saveSceneConfig(updatedConfig);
					configManager.setConfig(updatedConfig);
				}
			}

			return false;
		}
	};
}
