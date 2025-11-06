
function scene_default(canvas, ctx) {

    // The image used to frame the key
    var KeyImage = new Image();
    KeyImage.src = "./images/KeyDefault.png";

    var yOffset = 20;
    var sectionSpacing = 280;

    // Helper to create text labels
    function createLabel(x, y, text) {
        return new Text(x, y, 600, 30, {
            text: text,
            textAlign: "left",
            fillStyle: "#FFFFFF",
            font: "20px Lucida Console"
        });
    }

    // The objects to be rendered
    this.objects = [

        // ===== TEST CASE 1: Left Gamepad Stick =====
        createLabel(20, yOffset, "TEST 1: Left Gamepad Stick - WITH radial compensation vs WITHOUT"),
        createLabel(20, yOffset + 25, "Move diagonally: LEFT shows ~100% (compensated), RIGHT shows ~70% (raw circular)"),

        new Thumbstick(
            20, yOffset + 60, 200, 200,
            {
                backgroundProperties: {lineWidth:4, strokeStyle:"#B4B4B4", fillStyle:"rgba(37, 37, 37, 0.43)"},
                xLineProperties: {strokeStyle:"#B4B4B4", lineWidth:4},
                yLineProperties: {strokeStyle:"#B4B4B4", lineWidth:4},
                deadzoneProperties: {fillStyle:"#524d4d"},
                inputVectorProperties: {strokeStyle:"#B4B4B4", lineWidth:4},
                unitVectorProperties: {strokeStyle:"#524d4d", lineWidth:4},
            }
        ),

        // WASD - WITH radial compensation (linkedAxis)
        new LinearInputIndicator(
            240, yOffset + 60, 100, 100,
            {
                input: {
                    keyboard: { keyCode: null },
                    gamepad: {
                        stick: { type: "left", axis: "Y", direction: "negative" },
                        button: { index: null }
                    }
                },
                processing: { linkedAxis: 0 }, keyText:"W\nWith\nCompensation", backgroundImage:KeyImage
            }
        ),
        new LinearInputIndicator(
            150, yOffset + 160, 100, 100,
            {
                input: {
                    keyboard: { keyCode: null },
                    gamepad: {
                        stick: { type: "left", axis: "X", direction: "negative" },
                        button: { index: null }
                    }
                },
                processing: { linkedAxis: 1 }, keyText:"A\nWith\nCompensation", backgroundImage:KeyImage
            }
        ),
        new LinearInputIndicator(
            250, yOffset + 160, 100, 100,
            {
                input: {
                    keyboard: { keyCode: null },
                    gamepad: {
                        stick: { type: "left", axis: "Y", direction: "positive" },
                        button: { index: null }
                    }
                },
                processing: { linkedAxis: 0 }, keyText:"S\nWith\nCompensation", backgroundImage:KeyImage
            }
        ),
        new LinearInputIndicator(
            350, yOffset + 160, 100, 100,
            {
                input: {
                    keyboard: { keyCode: null },
                    gamepad: {
                        stick: { type: "left", axis: "X", direction: "positive" },
                        button: { index: null }
                    }
                },
                processing: { linkedAxis: 1 }, keyText:"D\nWith\nCompensation", backgroundImage:KeyImage
            }
        ),

        // WASD - WITHOUT radial compensation (linkedAxis: -1)
        new LinearInputIndicator(
            490, yOffset + 60, 100, 100,
            {
                input: {
                    keyboard: { keyCode: null },
                    gamepad: {
                        stick: { type: "left", axis: "Y", direction: "negative" },
                        button: { index: null }
                    }
                },
                processing: { linkedAxis: -1 }, keyText:"W\nWithout\nCompensation", backgroundImage:KeyImage
            }
        ),
        new LinearInputIndicator(
            400, yOffset + 160, 100, 100,
            {
                input: {
                    keyboard: { keyCode: null },
                    gamepad: {
                        stick: { type: "left", axis: "X", direction: "negative" },
                        button: { index: null }
                    }
                },
                processing: { linkedAxis: -1 }, keyText:"A\nWithout\nCompensation", backgroundImage:KeyImage
            }
        ),
        new LinearInputIndicator(
            500, yOffset + 160, 100, 100,
            {
                input: {
                    keyboard: { keyCode: null },
                    gamepad: {
                        stick: { type: "left", axis: "Y", direction: "positive" },
                        button: { index: null }
                    }
                },
                processing: { linkedAxis: -1 }, keyText:"S\nWithout\nCompensation", backgroundImage:KeyImage
            }
        ),
        new LinearInputIndicator(
            600, yOffset + 160, 100, 100,
            {
                input: {
                    keyboard: { keyCode: null },
                    gamepad: {
                        stick: { type: "left", axis: "X", direction: "positive" },
                        button: { index: null }
                    }
                },
                processing: { linkedAxis: -1 }, keyText:"D\nWithout\nCompensation", backgroundImage:KeyImage
            }
        ),

        // ===== TEST CASE 1B: Right Gamepad Stick =====
        (function() { yOffset += sectionSpacing; return createLabel(20, yOffset, "TEST 1B: Right Gamepad Stick (IJKL)"); })(),
        createLabel(20, yOffset + 25, "Same as Test 1, but using right stick instead of left"),

        new LinearInputIndicator(
            150, yOffset + 60, 100, 100,
            {
                input: {
                    keyboard: { keyCode: null },
                    gamepad: {
                        stick: { type: "right", axis: "Y", direction: "negative" },
                        button: { index: null }
                    }
                },
                processing: { linkedAxis: 2 }, keyText:"I\nUp", backgroundImage:KeyImage
            }
        ),
        new LinearInputIndicator(
            250, yOffset + 160, 100, 100,
            {
                input: {
                    keyboard: { keyCode: null },
                    gamepad: {
                        stick: { type: "right", axis: "Y", direction: "positive" },
                        button: { index: null }
                    }
                },
                processing: { linkedAxis: 2 }, keyText:"K\nDown", backgroundImage:KeyImage
            }
        ),
        new LinearInputIndicator(
            350, yOffset + 160, 100, 100,
            {
                input: {
                    keyboard: { keyCode: null },
                    gamepad: {
                        stick: { type: "right", axis: "X", direction: "positive" },
                        button: { index: null }
                    }
                },
                processing: { linkedAxis: 3 }, keyText:"L\nRight", backgroundImage:KeyImage
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
                keyText:"Z\nDigital", backgroundImage:KeyImage
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
                keyText:"X\nDigital", backgroundImage:KeyImage
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
                keyText:"C\nDigital", backgroundImage:KeyImage
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
                    gamepad: {
                        stick: { type: null, axis: null, direction: null },
                        button: { index: 0 }  // A button
                    }
                },
                keyText:"A\nBtn 0", backgroundImage:KeyImage
            }
        ),
        new LinearInputIndicator(
            250, yOffset + 60, 100, 100,
            {
                input: {
                    keyboard: { keyCode: null },
                    gamepad: {
                        stick: { type: null, axis: null, direction: null },
                        button: { index: 1 }  // B button
                    }
                },
                keyText:"B\nBtn 1", backgroundImage:KeyImage
            }
        ),
        new LinearInputIndicator(
            350, yOffset + 60, 100, 100,
            {
                input: {
                    keyboard: { keyCode: null },
                    gamepad: {
                        stick: { type: null, axis: null, direction: null },
                        button: { index: 2 }  // X button
                    }
                },
                keyText:"X\nBtn 2", backgroundImage:KeyImage
            }
        ),
        new LinearInputIndicator(
            450, yOffset + 60, 100, 100,
            {
                input: {
                    keyboard: { keyCode: null },
                    gamepad: {
                        stick: { type: null, axis: null, direction: null },
                        button: { index: 3 }  // Y button
                    }
                },
                keyText:"Y\nBtn 3", backgroundImage:KeyImage
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
                keyText:"LT\nAnalog", backgroundImage:KeyImage
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
                keyText:"RT\nAnalog", backgroundImage:KeyImage
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
                keyText:"SPACE", backgroundImage:KeyImage
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
                processing: { linkedAxis: 0 }, keyText:"W\nForward\nGamepad Up", backgroundImage:KeyImage
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
                processing: { linkedAxis: 0 }, keyText:"S\nBackward\nGamepad Down", backgroundImage:KeyImage
            }
        ),
    ];

    // Object dragging and property editing
    var clickedObject = null;
    var draggingOffset = new Vector(0, 0);
    var gridsize = 10;
    var propertyEditor = new PropertyEdit(0, 0, 10, 10);
    var editingProperties = false;

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

    this.update = function(delta) {
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
        } if ((mouse.button1 === false && mouse.button3 === false) && clickedObject !== null) {
            console.log("Released mouse");
            clickedObject = null;
        }
        if (clickedObject !== null && mouse.button1 === true) {
            console.log("Dragging");
            clickedObject.x = Math.round((mouse.x + draggingOffset.x)/gridsize)*gridsize;
            clickedObject.y = Math.round((mouse.y + draggingOffset.y)/gridsize)*gridsize;
        }

        if (mouse.button3Click === true || mouse.button1Click === true) {
            if (clickedObject === null && editingProperties === true) {
                console.log("clicked away from editor");
                propertyEditor.hidePropertyEdit();
                editingProperties = false;
            }
        }
        if (mouse.button3Click === true && clickedObject !== null && editingProperties === false) {
            console.log("Editing object");
            propertyEditor.showPropertyEdit(clickedObject.defaultProperties, clickedObject);
            editingProperties = true;
        }
    }
}
