import { mouse } from '../browserInputListeners/_compiled/mouse.js';
import { keyboard } from '../browserInputListeners/_compiled/keyboard.js';
import { PlanarInputIndicator_Radial } from './_compiled/objects/PlanarInputIndicator_Radial.js';
import { LinearInputIndicator } from './_compiled/objects/LinearInputIndicator.js';
import { Text } from './_compiled/objects/Text.js';
import { PropertyEdit } from './_compiled/actions/PropertyEdit.js';
import { Vector } from './_compiled/_helpers/Vector.js';
import { canvas_properties } from './_helpers/draw.js';

// Global variables
var canvas;

// Make input systems globally accessible for input indicators
window.gamepads = null;
window.keyboard = keyboard;
window.mouse = mouse;

// Main framework - game loop and scene initialization
window.addEventListener("load", function () {

	// Initialize canvas
	canvas = document.getElementById("canvas");
	var ctx = canvas.getContext("2d");
	canvas.width = window.innerWidth;
	canvas.height = window.innerHeight;

	// Input systems already initialized (imported as objects)

	// Create and initialize the scene
	var activeScene = new scene_default(canvas, ctx);

	// Render function - draws scene and all objects
	var frameUpdate = function() {
		// Clear canvas
		ctx.setTransform(1, 0, 0, 1, 0, 0);
		ctx.clearRect(0, 0, canvas.width, canvas.height);

		// Draw scene-level graphics (e.g., selection outlines)
		activeScene.draw.call(activeScene, canvas, ctx);
		ctx.closePath();

		// Draw all objects in the scene
		for (var i = 0; i < activeScene.objects.length; i++) {
			var object = activeScene.objects[i];
			ctx.setTransform(1, 0, 0, 1, object.x, object.y);
			object.draw.call(object, canvas, ctx);
			ctx.closePath();
		}
	}

	// Main update loop - runs every frame
	var previousTime = 0;
	var updateLoop = function(currentTime) {
		// Calculate delta time
		var delta = (currentTime - previousTime) / 1000;
		previousTime = currentTime;

		// Track if screen needs redraw
		var updateScreen = false;

		// Update gamepad state
		window.gamepads = navigator.getGamepads();

		// Debug: Log gamepad detection (once)
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
						console.log('[Game Loop] Gamepad', i, ':', pads[i].id, '- Axes:', pads[i].axes.length, 'Buttons:', pads[i].buttons.length);
					}
				}
				window._gamepadDebugLogged = true;
			}
		}

		// Update scene logic
		if (activeScene.update.call(activeScene, delta) === true) {
			updateScreen = true;
		}

		// Update all objects
		for (var i = 0; i < activeScene.objects.length; i++) {
			var object = activeScene.objects[i];
			if (object.update.call(object, delta) === true) {
				updateScreen = true;
			}
		}

		// Redraw if needed
		if (updateScreen) {
			frameUpdate();
		}

		// Update mouse state
		mouse.update(delta);

		// Schedule next frame
		window.requestAnimationFrame(updateLoop);
	}

	// Start the game loop
	window.requestAnimationFrame(updateLoop);
	frameUpdate();

	// Handle window resizing
	function resizeCanvas() {
		canvas.width = window.innerWidth;
		canvas.height = window.innerHeight;
		frameUpdate();
	}
	window.addEventListener("resize", resizeCanvas);

}, false);


// Scene definition - contains all visual objects and interaction logic
function scene_default(canvas, ctx) {

	// Load background image for keys
	var KeyImage = new Image();
	KeyImage.src = "./browserInputOverlayView/_assets/images/KeyDefault.png";

	var yOffset = 20;
	var sectionSpacing = 280;

	// Helper to create text labels
	function createLabel(x, y, text) {
		return new Text(y, x, 600, 30, {
			text: text,
			textAlign: "left",
			fillStyle: "#FFFFFF",
			font: "20px Lucida Console"
		});
	}

	// All objects to be rendered in the scene
	this.objects = [

		// ===== TEST CASE 1: Left Gamepad Stick + WASD + Mouse Buttons =====
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

		// WASD - WITH radial compensation (linkedAxis)
		// W key + M4 (Back) + Left Stick Y-
		new LinearInputIndicator(
			240, yOffset + 60, 100, 100,
			{
				input: {
					keyboard: { keyCode: "KeyW" },
					mouse: { button: 3 },  // M4 - Back button
					gamepad: {
						stick: { type: "left", axis: "Y", direction: "negative" },
						button: { index: null }
					}
				},
				processing: { linkedAxis: 0 }, display: { text: "W\nWith\nCompensation", backgroundImage: KeyImage }
			}
		),
		// A key + M1 (Left) + Left Stick X-
		new LinearInputIndicator(
			150, yOffset + 160, 100, 100,
			{
				input: {
					keyboard: { keyCode: "KeyA" },
					mouse: { button: 0 },  // M1 - Left button
					gamepad: {
						stick: { type: "left", axis: "X", direction: "negative" },
						button: { index: null }
					}
				},
				processing: { linkedAxis: 1 }, display: { text: "A\nWith\nCompensation", backgroundImage: KeyImage }
			}
		),
		// S key + M5 (Forward) + Left Stick Y+
		new LinearInputIndicator(
			250, yOffset + 160, 100, 100,
			{
				input: {
					keyboard: { keyCode: "KeyS" },
					mouse: { button: 4 },  // M5 - Forward button
					gamepad: {
						stick: { type: "left", axis: "Y", direction: "positive" },
						button: { index: null }
					}
				},
				processing: { linkedAxis: 0 }, display: { text: "S\nWith\nCompensation", backgroundImage: KeyImage }
			}
		),
		// D key + M3 (Middle) + Left Stick X+
		new LinearInputIndicator(
			350, yOffset + 160, 100, 100,
			{
				input: {
					keyboard: { keyCode: "KeyD" },
					mouse: { button: 1 },  // M3 - Middle button
					gamepad: {
						stick: { type: "left", axis: "X", direction: "positive" },
						button: { index: null }
					}
				},
				processing: { linkedAxis: 1 }, display: { text: "D\nWith\nCompensation", backgroundImage: KeyImage }
			}
		),

		// WASD - WITHOUT radial compensation (linkedAxis: -1)
		new LinearInputIndicator(
			740, yOffset + 60, 100, 100,
			{
				input: {
					keyboard: { keyCode: "KeyW" },
					mouse: { button: 3 },  // M4 - Back button
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
					mouse: { button: 0 },  // M1 - Left button
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
					mouse: { button: 4 },  // M5 - Forward button
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
					mouse: { button: 1 },  // M3 - Middle button
					gamepad: {
						stick: { type: "left", axis: "X", direction: "positive" },
						button: { index: null }
					}
				},
				processing: { linkedAxis: -1 }, display: { text: "D\nWithout\nCompensation", backgroundImage: KeyImage }
			}
		),

		// ===== TEST CASE 1B: Right Gamepad Stick =====
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

		// ===== TEST CASE 2: Digital Keyboard Keys =====
		(function() { yOffset += sectionSpacing; return createLabel(20, yOffset, "TEST 2: Digital Keyboard Keys (Non-Analog)"); })(),
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

		// ===== TEST CASE 3: Gamepad Buttons (Digital) =====
		(function() { yOffset += sectionSpacing; return createLabel(20, yOffset, "TEST 3: Gamepad Buttons (Digital)"); })(),
		createLabel(20, yOffset + 25, "Face buttons (A/B/X/Y) - digital on/off, no pressure sensitivity"),

		new LinearInputIndicator(
			150, yOffset + 60, 100, 100,
			{
				input: {
					keyboard: { keyCode: null },
					mouse: { button: null, wheel: null },
					gamepad: {
						stick: { type: null, axis: null, direction: null },
						button: { index: 0 }  // A button
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
						button: { index: 1 }  // B button
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
						button: { index: 2 }  // X button
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
						button: { index: 3 }  // Y button
					}
				},
				display: { text: "Y\nBtn 3", backgroundImage: KeyImage }
			}
		),

		// ===== TEST CASE 3B: Gamepad Triggers (Analog) =====
		(function() { yOffset += sectionSpacing; return createLabel(20, yOffset, "TEST 3B: Gamepad Triggers (Analog Pressure)"); })(),
		createLabel(20, yOffset + 25, "LT/RT triggers - should show gradual fill based on pressure (0-100%)"),

		new LinearInputIndicator(
			150, yOffset + 60, 100, 100,
			{
				input: {
					keyboard: { keyCode: null },
					gamepad: {
						stick: { type: null, axis: null, direction: null },
						button: { index: 6 }  // LT (Left Trigger)
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
						button: { index: 7 }  // RT (Right Trigger)
					}
				},
				display: { text: "RT\nAnalog", backgroundImage: KeyImage }
			}
		),

		// ===== TEST CASE 4: Rectangular Dimensions =====
		(function() { yOffset += sectionSpacing; return createLabel(20, yOffset, "TEST 4: Rectangular Dimensions"); })(),
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

		// ===== TEST CASE 4B: Super Long Thin Bar =====
		(function() { yOffset += sectionSpacing; return createLabel(20, yOffset, "TEST 4B: Super Long Thin Vertical Bars"); })(),
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

		// ===== TEST CASE 5: Mouse Buttons + Scroll Wheel =====
		(function() { yOffset += sectionSpacing; return createLabel(20, yOffset, "TEST 5: Mouse Buttons + Scroll Wheel"); })(),
		createLabel(20, yOffset + 25, "All 5 standard mouse buttons + scroll up/down"),

		// M1 - Left Mouse Button
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

		// M2 - Right Mouse Button
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

		// M3 - Middle Mouse Button (Wheel Click)
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

		// M4 - Back Button
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

		// M5 - Forward Button
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

		// Scroll Up
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

		// Scroll Down
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

	// Object dragging and property editing state
	var clickedObject = null;
	var draggingOffset = new Vector(0, 0);
	var gridsize = 10;
	var propertyEditor = new PropertyEdit(0, 0, 10, 10);
	var editingProperties = false;

	// Scene draw function - renders selection outlines
	this.draw = function(canvas, ctx) {
		if (clickedObject !== null) {
			for (var i = 0; i < this.objects.length; i++) {
				var object = this.objects[i];
				ctx.setTransform(1, 0, 0, 1, object.x, object.y);
				ctx.beginPath();
				canvas_properties(ctx, {strokeStyle:"#FF00FF", lineWidth:1})
				ctx.rect(0, 0, object.width, object.height);
				ctx.stroke();
			}
		}
	}

	// Scene update function - handles object dragging and property editing
	this.update = function(delta) {
		// Handle object selection
		if (mouse.button1Click === true || mouse.button3Click === true) {
			clickedObject = null;
			for (var i = 0; i < this.objects.length; i++) {
				var object = this.objects[i];
				if ((mouse.x > object.x && mouse.y > object.y)
				&& (mouse.x < object.x + object.width && mouse.y < object.y + object.height)) {
					draggingOffset.x = object.x - mouse.x;
					draggingOffset.y = object.y - mouse.y;
					clickedObject = object;
					console.log("Clicked on object:", object);
					break;
				}
			}
		}

		// Handle object release
		if ((mouse.button1 === false && mouse.button3 === false) && clickedObject !== null) {
			console.log("Released mouse");
			clickedObject = null;
		}

		// Handle object dragging
		if (clickedObject !== null && mouse.button1 === true) {
			console.log("Dragging");
			clickedObject.x = Math.round((mouse.x + draggingOffset.x)/gridsize)*gridsize;
			clickedObject.y = Math.round((mouse.y + draggingOffset.y)/gridsize)*gridsize;
		}

		// Handle property editor visibility
		if (mouse.button3Click === true || mouse.button1Click === true) {
			if (clickedObject === null && editingProperties === true) {
				console.log("clicked away from editor");
				propertyEditor.hidePropertyEdit();
				editingProperties = false;
			}
		}

		// Show property editor on right-click
		if (mouse.button3Click === true && clickedObject !== null && editingProperties === false) {
			console.log("Editing object");
			propertyEditor.showPropertyEdit(clickedObject.defaultProperties, clickedObject);
			editingProperties = true;
		}
	}
}
