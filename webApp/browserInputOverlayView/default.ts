import { mouse } from '../browserInputListeners/mouse.js';
import { keyboard } from '../browserInputListeners/keyboard.js';
import { PlanarInputIndicator_Radial } from './objects/PlanarInputIndicator_Radial.js';
import { LinearInputIndicator } from './objects/LinearInputIndicator.js';
import { Text } from './objects/Text.js';
import { PropertyEdit } from './actions/PropertyEdit.js';
import { Vector } from './_helpers/Vector.js';
import { canvas_properties } from './_helpers/draw.js';

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

	const ctx = canvas.getContext("2d");
	if (!ctx) {
		throw new Error("Could not get 2D context");
	}

	canvas.width = window.innerWidth;
	canvas.height = window.innerHeight;

	const activeScene = createScene(canvas, ctx);

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

function deserializeImage(src: string): HTMLImageElement {
	const img = new Image();
	img.src = src;
	return img;
}

function deserializeObject(objData: any): CanvasObject {
	const { type, x, y, width, height, ...props } = objData;

	if (props.display && props.display.backgroundImage && typeof props.display.backgroundImage === 'string') {
		props.display.backgroundImage = deserializeImage(props.display.backgroundImage);
	}

	switch (type) {
		case 'LinearInputIndicator':
		case 'linearInputIndicator':
			return new LinearInputIndicator(x, y, width, height, props);
		case 'PlanarInputIndicator_Radial':
		case 'planarInputIndicator':
			return new PlanarInputIndicator_Radial(x, y, width, height, props);
		case 'Text':
		case 'text':
			return new Text(y, x, width, height, props);
		default:
			throw new Error(`Unknown object type: ${type}`);
	}
}

function createScene(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D): Scene {
	const KeyImage = new Image();
	KeyImage.src = "https://raw.githubusercontent.com/zitongcharliedeng/a_web-based_input-overlay/refs/heads/master/webApp/browserInputOverlayView/_assets/images/KeyDefault.png";

	let yOffset = 20;
	const sectionSpacing = 280;

	function createLabel(x: number, y: number, text: string): Text {
		return new Text(y, x, 600, 30, {
			text: text,
			textStyle: {
				textAlign: "left",
				fillStyle: "#FFFFFF",
				font: "20px Lucida Console"
			}
		});
	}

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
					backgroundStyle: {lineWidth:4, strokeStyle:"#B4B4B4", fillStyle:"rgba(37, 37, 37, 0.43)"},
					xLineStyle: {strokeStyle:"#B4B4B4", lineWidth:4},
					yLineStyle: {strokeStyle:"#B4B4B4", lineWidth:4},
					deadzoneStyle: {fillStyle:"#524d4d"},
					inputVectorStyle: {strokeStyle:"#B4B4B4", lineWidth:4},
					unitVectorStyle: {strokeStyle:"#524d4d", lineWidth:4}
				}
			}
		),

		new LinearInputIndicator(
			240, yOffset + 60, 100, 100,
			{
				input: {
					keyboard: { keyCode: "KeyW" },
					mouse: { button: 3 },
					gamepad: {
						stick: { type: "left", axis: "Y", direction: "negative" },
						button: { index: null }
					}
				},
				processing: { linkedAxis: 0 }, display: { text: "W\nWith\nCompensation", backgroundImage: KeyImage }
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
				processing: { linkedAxis: 1 }, display: { text: "A\nWith\nCompensation", backgroundImage: KeyImage }
			}
		),
		new LinearInputIndicator(
			250, yOffset + 160, 100, 100,
			{
				input: {
					keyboard: { keyCode: "KeyS" },
					mouse: { button: 4 },
					gamepad: {
						stick: { type: "left", axis: "Y", direction: "positive" },
						button: { index: null }
					}
				},
				processing: { linkedAxis: 0 }, display: { text: "S\nWith\nCompensation", backgroundImage: KeyImage }
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
				processing: { linkedAxis: 1 }, display: { text: "D\nWith\nCompensation", backgroundImage: KeyImage }
			}
		),

		new LinearInputIndicator(
			740, yOffset + 60, 100, 100,
			{
				input: {
					keyboard: { keyCode: "KeyW" },
					mouse: { button: 3 },
					gamepad: {
						stick: { type: "left", axis: "Y", direction: "negative" },
						button: { index: null }
					}
				},
				processing: { linkedAxis: -1 }, display: { text: "W\nWithout\nCompensation", backgroundImage: KeyImage }
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
				processing: { linkedAxis: -1 }, display: { text: "A\nWithout\nCompensation", backgroundImage: KeyImage }
			}
		),
		new LinearInputIndicator(
			750, yOffset + 160, 100, 100,
			{
				input: {
					keyboard: { keyCode: "KeyS" },
					mouse: { button: 4 },
					gamepad: {
						stick: { type: "left", axis: "Y", direction: "positive" },
						button: { index: null }
					}
				},
				processing: { linkedAxis: -1 }, display: { text: "S\nWithout\nCompensation", backgroundImage: KeyImage }
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
				processing: { linkedAxis: -1 }, display: { text: "D\nWithout\nCompensation", backgroundImage: KeyImage }
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
				processing: { linkedAxis: 2 }, display: { text: "I\nUp", backgroundImage: KeyImage }
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
				processing: { linkedAxis: 3 }, display: { text: "J\nLeft", backgroundImage: KeyImage }
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
				processing: { linkedAxis: 2 }, display: { text: "K\nDown", backgroundImage: KeyImage }
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
				processing: { linkedAxis: 3 }, display: { text: "L\nRight", backgroundImage: KeyImage }
			}
		),

		(() => { yOffset += sectionSpacing; return createLabel(20, yOffset, "TEST 2: Digital Keyboard Keys (Non-Analog)"); })(),
		createLabel(20, yOffset + 25, "Press ZXC keys - should light up momentarily, no gamepad interaction"),

		new LinearInputIndicator(
			150, yOffset + 60, 100, 100,
			{
				input: {
					keyboard: { keyCode: "KeyZ" },
					gamepad: {
						stick: { type: null, axis: null, direction: null },
						button: { index: null }
					}
				},
				display: { text: "Z\nDigital", backgroundImage: KeyImage }
			}
		),
		new LinearInputIndicator(
			250, yOffset + 60, 100, 100,
			{
				input: {
					keyboard: { keyCode: "KeyX" },
					gamepad: {
						stick: { type: null, axis: null, direction: null },
						button: { index: null }
					}
				},
				display: { text: "X\nDigital", backgroundImage: KeyImage }
			}
		),
		new LinearInputIndicator(
			350, yOffset + 60, 100, 100,
			{
				input: {
					keyboard: { keyCode: "KeyC" },
					gamepad: {
						stick: { type: null, axis: null, direction: null },
						button: { index: null }
					}
				},
				display: { text: "C\nDigital", backgroundImage: KeyImage }
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
				display: { text: "A\nBtn 0", backgroundImage: KeyImage }
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
				display: { text: "B\nBtn 1", backgroundImage: KeyImage }
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
				display: { text: "X\nBtn 2", backgroundImage: KeyImage }
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
				display: { text: "Y\nBtn 3", backgroundImage: KeyImage }
			}
		),

		(() => { yOffset += sectionSpacing; return createLabel(20, yOffset, "TEST 3B: Gamepad Triggers (Analog Pressure)"); })(),
		createLabel(20, yOffset + 25, "LT/RT triggers - should show gradual fill based on pressure (0-100%)"),

		new LinearInputIndicator(
			150, yOffset + 60, 100, 100,
			{
				input: {
					keyboard: { keyCode: null },
					gamepad: {
						stick: { type: null, axis: null, direction: null },
						button: { index: 6 }
					}
				},
				display: { text: "LT\nAnalog", backgroundImage: KeyImage }
			}
		),
		new LinearInputIndicator(
			250, yOffset + 60, 100, 100,
			{
				input: {
					keyboard: { keyCode: null },
					gamepad: {
						stick: { type: null, axis: null, direction: null },
						button: { index: 7 }
					}
				},
				display: { text: "RT\nAnalog", backgroundImage: KeyImage }
			}
		),

		(() => { yOffset += sectionSpacing; return createLabel(20, yOffset, "TEST 4: Rectangular Dimensions"); })(),
		createLabel(20, yOffset + 25, "Spacebar key - 4x width, slightly taller height (400x120)"),

		new LinearInputIndicator(
			150, yOffset + 60, 400, 120,
			{
				input: {
					keyboard: { keyCode: "Space" },
					gamepad: {
						stick: { type: null, axis: null, direction: null },
						button: { index: null }
					}
				},
				display: { text: "SPACE", backgroundImage: KeyImage }
			}
		),

		(() => { yOffset += sectionSpacing; return createLabel(20, yOffset, "TEST 4B: Super Long Thin Vertical Bars"); })(),
		createLabel(20, yOffset + 25, "W key + gamepad forward (Y negative) vs S key + gamepad backward (Y positive) - 40x600 dimensions"),

		new LinearInputIndicator(
			150, yOffset + 60, 40, 600,
			{
				input: {
					keyboard: { keyCode: "KeyW" },
					gamepad: {
						stick: { type: "left", axis: "Y", direction: "negative" },
						button: { index: null }
					}
				},
				processing: { linkedAxis: 0 }, display: { text: "W\nForward\nGamepad Up", backgroundImage: KeyImage }
			}
		),
		new LinearInputIndicator(
			250, yOffset + 60, 40, 600,
			{
				input: {
					keyboard: { keyCode: "KeyS" },
					gamepad: {
						stick: { type: "left", axis: "Y", direction: "positive" },
						button: { index: null }
					}
				},
				processing: { linkedAxis: 0 }, display: { text: "S\nBackward\nGamepad Down", backgroundImage: KeyImage }
			}
		),

		(() => { yOffset += sectionSpacing; return createLabel(20, yOffset, "TEST 5: Mouse Buttons + Scroll Wheel"); })(),
		createLabel(20, yOffset + 25, "All 5 standard mouse buttons + scroll up/down"),

		new LinearInputIndicator(
			50, yOffset + 60, 100, 100,
			{
				input: {
					keyboard: { keyCode: null },
					mouse: { button: 0, wheel: null },
					gamepad: {
						stick: { type: null, axis: null, direction: null },
						button: { index: null }
					}
				},
				display: { text: "M1\nLeft\nClick", backgroundImage: KeyImage }
			}
		),

		new LinearInputIndicator(
			170, yOffset + 60, 100, 100,
			{
				input: {
					keyboard: { keyCode: null },
					mouse: { button: 2, wheel: null },
					gamepad: {
						stick: { type: null, axis: null, direction: null },
						button: { index: null }
					}
				},
				display: { text: "M2\nRight\nClick", backgroundImage: KeyImage }
			}
		),

		new LinearInputIndicator(
			290, yOffset + 60, 100, 100,
			{
				input: {
					keyboard: { keyCode: null },
					mouse: { button: 1, wheel: null },
					gamepad: {
						stick: { type: null, axis: null, direction: null },
						button: { index: null }
					}
				},
				display: { text: "M3\nWheel\nClick", backgroundImage: KeyImage }
			}
		),

		new LinearInputIndicator(
			410, yOffset + 60, 100, 100,
			{
				input: {
					keyboard: { keyCode: null },
					mouse: { button: 3, wheel: null },
					gamepad: {
						stick: { type: null, axis: null, direction: null },
						button: { index: null }
					}
				},
				display: { text: "M4\nBack\nButton", backgroundImage: KeyImage }
			}
		),

		new LinearInputIndicator(
			530, yOffset + 60, 100, 100,
			{
				input: {
					keyboard: { keyCode: null },
					mouse: { button: 4, wheel: null },
					gamepad: {
						stick: { type: null, axis: null, direction: null },
						button: { index: null }
					}
				},
				display: { text: "M5\nForward\nButton", backgroundImage: KeyImage }
			}
		),

		new LinearInputIndicator(
			650, yOffset + 60, 100, 100,
			{
				input: {
					keyboard: { keyCode: null },
					mouse: { button: null, wheel: "up" },
					gamepad: {
						stick: { type: null, axis: null, direction: null },
						button: { index: null }
					}
				},
				display: { text: "Scroll\nUp", backgroundImage: KeyImage }
			}
		),

		new LinearInputIndicator(
			770, yOffset + 60, 100, 100,
			{
				input: {
					keyboard: { keyCode: null },
					mouse: { button: null, wheel: "down" },
					gamepad: {
						stick: { type: null, axis: null, direction: null },
						button: { index: null }
					}
				},
				display: { text: "Scroll\nDown", backgroundImage: KeyImage }
			}
		),
	];

	let clickedObject: CanvasObject | null = null;
	const draggingOffset = new Vector(0, 0);
	const gridsize = 10;
	const propertyEditor = new PropertyEdit();
	let editingProperties = false;

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
				console.log("Released mouse");
				clickedObject = null;
			}

			if (clickedObject !== null && mouse.buttons[0] === true) {
				console.log("Dragging");
				clickedObject.positionOnCanvas.pxFromCanvasLeft = Math.round((mouse.x + draggingOffset.x)/gridsize)*gridsize;
				clickedObject.positionOnCanvas.pxFromCanvasTop = Math.round((mouse.y + draggingOffset.y)/gridsize)*gridsize;
			}

			if (mouse.clicks[2] === true || mouse.clicks[0] === true) {
				if (clickedObject === null && editingProperties === true) {
					console.log("clicked away from editor");
					propertyEditor.hidePropertyEdit();
					editingProperties = false;
				}
			}

			if (mouse.clicks[2] === true && clickedObject !== null && editingProperties === false) {
				console.log("Editing object");
				propertyEditor.showPropertyEdit(clickedObject.defaultProperties, clickedObject);
				editingProperties = true;
			}

			if (mouse.clicks[2] === true && clickedObject === null && editingProperties === false) {
				console.log("Editing scene config");
				propertyEditor.showSceneConfig(this, canvas, (config: any) => {
					console.log("Applying scene config:", config);
					if (config.canvas) {
						canvas.width = config.canvas.width;
						canvas.height = config.canvas.height;
					}
					if (config.objects) {
						objects.length = 0;
						for (const objData of config.objects) {
							objects.push(deserializeObject(objData));
						}
					}
				});
				editingProperties = true;
			}

			return false;
		}
	};
}
