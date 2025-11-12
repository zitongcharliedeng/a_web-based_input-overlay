import { applyProperties, deepMerge } from '../_helpers/applyProperties.js';
import { canvas_fill_rec, canvas_text } from '../_helpers/draw.js';
// Default restorepoint properties
const defaultLinearInputIndicatorProperties = {
    input: {
        keyboard: {
            keyCode: null
        },
        mouse: {
            button: null,
            wheel: null
        },
        gamepad: {
            stick: {
                type: null,
                axis: null,
                direction: null
            },
            button: {
                index: null
            }
        }
    },
    processing: {
        linkedAxis: -1,
        multiplier: 1,
        antiDeadzone: 0.0,
    },
    display: {
        text: "SampleText",
        reverseFillDirection: false,
        backgroundImage: new Image(),
        fillStyle: "rgba(255, 255, 255, 0.5)",
        fillStyleBackground: "rgba(37, 37, 37, 0.43)",
        fontStyle: { textAlign: "center", fillStyle: "white", font: "30px Lucida Console" },
    }
};
/**
 * Converts stick configuration to standard gamepad API axis index
 * Maps: left X=0, left Y=1, right X=2, right Y=3
 *
 * TODO: Right stick (type="right") is untested due to lack of hardware.
 *       Assumes symmetry with left stick. Test when right stick controller available.
 */
function asConventionalGamepadAxisNumber(stick) {
    if (stick.type === null || stick.axis === null)
        return null;
    return (stick.type === "left" ? 0 : 2) + (stick.axis === "X" ? 0 : 1);
}
// LinearInputIndicator - Visual representation of linear (0-1.0) input value
function LinearInputIndicator(x, y, width, height, properties) {
    // Framework properties
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.defaultProperties = defaultLinearInputIndicatorProperties;
    this.className = "LinearInputIndicator";
    // Merge properties using deep merge for nested objects
    const mergedProperties = deepMerge(defaultLinearInputIndicatorProperties, properties || {});
    applyProperties(this, mergedProperties);
    // Convert new API structures to internal properties for update() to use
    if (this.input) {
        // Keyboard
        this.keyCode = this.input.keyboard.keyCode;
        // Mouse
        this.mouseButton = this.input.mouse.button;
        this.mouseWheel = this.input.mouse.wheel;
        // Gamepad stick
        this.hasStickInput = (asConventionalGamepadAxisNumber(this.input.gamepad.stick) !== null);
        if (this.hasStickInput) {
            this.axis = asConventionalGamepadAxisNumber(this.input.gamepad.stick);
            this.revertedAxis = (this.input.gamepad.stick.direction === "negative");
        }
        // Gamepad button
        this.hasButtonInput = (this.input.gamepad.button.index !== null);
        if (this.hasButtonInput) {
            this.button = this.input.gamepad.button.index;
        }
    }
    if (this.processing) {
        // Processing properties (already flat, just assign)
        this.linkedAxis = this.processing.linkedAxis;
        this.multiplier = this.processing.multiplier;
        this.antiDeadzone = this.processing.antiDeadzone;
    }
    if (this.display) {
        // Display properties (flatten for internal use)
        this.keyText = this.display.text;
        this.reverseFillDirection = this.display.reverseFillDirection;
        this.backgroundImage = this.display.backgroundImage;
        this.fillStyle = this.display.fillStyle;
        this.fillStyleBackground = this.display.fillStyleBackground;
        this.fontStyle = this.display.fontStyle;
    }
    // Object values
    this.value = 0;
    this._previousValue = 0;
}
// Update loop
LinearInputIndicator.prototype.update = function (delta) {
    var value = 0;
    var linkedValue = 0;
    // Get keyboard input
    const keyboard = window.keyboard;
    value += keyboard[this.keyCode] ? 1 : 0;
    // Get mouse input
    const mouse = window.mouse;
    if (this.mouseButton !== null && mouse.buttons[this.mouseButton]) {
        value += 1;
    }
    // Get mouse wheel input (single-frame events like clicks)
    if (this.mouseWheel !== null && mouse.wheelEvents) {
        if (this.mouseWheel === "up" && mouse.wheelEvents.up) {
            value += 1;
        }
        else if (this.mouseWheel === "down" && mouse.wheelEvents.down) {
            value += 1;
        }
    }
    // Key antiDeadzone has to be lowered when a linked axis surpasses the antiDeadzone for better directional indications
    // This is a lazy way to achieve this, but works for now
    var newAntiDeadzone = Math.max(0, this.antiDeadzone - linkedValue * 0.5);
    // Get gamepad input
    const gamepads = window.gamepads;
    for (var id in gamepads) {
        var gamepad = gamepads[id];
        if (gamepad !== null && gamepad.axes && this.hasStickInput) {
            if (gamepad.axes[this.axis]
                && (this.revertedAxis === true && gamepad.axes[this.axis] < 0)
                || (this.revertedAxis === false && gamepad.axes[this.axis] > 0)) {
                if (gamepad.axes[this.linkedAxis]) {
                    //Converts circular back to square coordinates
                    value += Math.abs(gamepad.axes[this.axis]) * Math.sqrt(1 + 2 * Math.pow(Math.abs(gamepad.axes[this.linkedAxis]), 2));
                }
                else {
                    value += (Math.abs(gamepad.axes[this.axis]) - newAntiDeadzone) / (1 - newAntiDeadzone);
                }
            }
            if (gamepad.axes[this.linkedAxis]) {
                linkedValue += Math.abs(gamepad.axes[this.linkedAxis]);
            }
        }
        if (gamepad !== null && gamepad.buttons && this.hasButtonInput) {
            if (gamepad.buttons[this.button]) {
                value += gamepad.buttons[this.button].value;
            }
        }
    }
    // Update input
    this.value = Math.max(Math.min((value - newAntiDeadzone) / (1 - newAntiDeadzone) * this.multiplier, 1), 0);
    // Update position
    return true; //Math.abs(this._previousValue - this.value) > this.antiDeadzone;
};
// Draw function
LinearInputIndicator.prototype.draw = function (canvas, ctx) {
    // Fill background
    ctx.beginPath();
    canvas_fill_rec(ctx, 0, 0, this.width, this.height, { fillStyle: this.fillStyleBackground });
    // Fill value (vertical fill from bottom or top)
    ctx.beginPath();
    if (this.reverseFillDirection == true)
        canvas_fill_rec(ctx, 0, this.height, this.width, -this.height * this.value, { fillStyle: this.fillStyle });
    else
        canvas_fill_rec(ctx, 0, 0, this.width, this.height * this.value, { fillStyle: this.fillStyle });
    // Draw background image scaled to dimensions
    ctx.drawImage(this.backgroundImage, 0, 0, this.backgroundImage.width, this.backgroundImage.height, 0, 0, this.width, this.height);
    // Print key text centered
    canvas_text(ctx, this.width * 0.5, this.height * 0.5, this.keyText, this.fontStyle);
};
export { LinearInputIndicator };
