import { CanvasObject } from './index.js';
import { canvas_fill_rec, canvas_text, canvas_properties } from '../_helpers/draw.js';
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
        fadeOutDuration: 0.2,
    },
    display: {
        text: "SampleText",
        reverseFillDirection: false,
        backgroundImage: new Image(),
        fillStyle: "rgba(255, 255, 255, 0.5)",
        fillStyleBackground: "rgba(37, 37, 37, 0.43)",
        fontStyle: { textAlign: "center", fillStyle: "black", font: "30px Lucida Console", strokeStyle: "white", strokeWidth: 3 },
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
class LinearInputIndicator extends CanvasObject {
    constructor(x, y, width, height, properties) {
        super({ pxFromCanvasTop: y, pxFromCanvasLeft: x }, { widthInPx: width, lengthInPx: height }, "linearInputIndicator");
        this.defaultProperties = defaultLinearInputIndicatorProperties;
        this.className = "LinearInputIndicator";
        // Internal properties from input config
        this.keyCode = null;
        this.mouseButton = null;
        this.mouseWheel = null;
        this.hasStickInput = false;
        this.axis = null;
        this.revertedAxis = false;
        this.hasButtonInput = false;
        this.button = null;
        // Internal properties from processing config
        this.linkedAxis = -1;
        this.multiplier = 1;
        this.antiDeadzone = 0.0;
        this.fadeOutDuration = 0.0;
        // No fade state needed - pure signal processing
        // Internal properties from display config
        this.keyText = "SampleText";
        this.reverseFillDirection = false;
        this.backgroundImage = new Image();
        this.fillStyle = "rgba(255, 255, 255, 0.5)";
        this.fillStyleBackground = "rgba(37, 37, 37, 0.43)";
        this.fontStyle = { textAlign: "center", fillStyle: "black", font: "30px Lucida Console", strokeStyle: "white", strokeWidth: 3 };
        // Runtime values
        this.value = 0;
        this._previousValue = 0;
        this.opacity = 1.0; // Fade opacity instead of value
        // Config properties (before flattening)
        this.input = defaultLinearInputIndicatorProperties.input;
        this.processing = defaultLinearInputIndicatorProperties.processing;
        this.display = defaultLinearInputIndicatorProperties.display;
        const props = properties ?? {};
        const defaults = defaultLinearInputIndicatorProperties;
        this.input = {
            keyboard: { ...defaults.input.keyboard, ...props.input?.keyboard },
            mouse: { ...defaults.input.mouse, ...props.input?.mouse },
            gamepad: {
                stick: { ...defaults.input.gamepad.stick, ...props.input?.gamepad?.stick },
                button: { ...defaults.input.gamepad.button, ...props.input?.gamepad?.button }
            }
        };
        this.processing = { ...defaults.processing, ...props.processing };
        this.display = { ...defaults.display, ...props.display };
        this.value = 0;
        this._previousValue = 0;
        this.syncProperties();
    }
    syncProperties() {
        if (this.input) {
            this.keyCode = this.input.keyboard?.keyCode ?? null;
            this.mouseButton = this.input.mouse?.button ?? null;
            this.mouseWheel = this.input.mouse?.wheel ?? null;
            const stick = this.input.gamepad?.stick;
            this.hasStickInput = stick ? (asConventionalGamepadAxisNumber(stick) !== null) : false;
            if (this.hasStickInput && stick) {
                this.axis = asConventionalGamepadAxisNumber(stick);
                this.revertedAxis = (stick.direction === "negative");
            }
            else {
                this.hasStickInput = false;
                this.axis = null;
                this.revertedAxis = false;
            }
            const buttonIndex = this.input.gamepad?.button?.index;
            this.hasButtonInput = (buttonIndex !== null && buttonIndex !== undefined);
            if (this.hasButtonInput) {
                this.button = buttonIndex ?? null;
            }
            else {
                this.hasButtonInput = false;
                this.button = null;
            }
        }
        if (this.processing) {
            this.linkedAxis = this.processing.linkedAxis ?? -1;
            this.multiplier = this.processing.multiplier ?? 1;
            this.antiDeadzone = this.processing.antiDeadzone ?? 0.0;
            this.fadeOutDuration = this.processing.fadeOutDuration ?? 0.0;
        }
        if (this.display) {
            this.keyText = this.display.text ?? "SampleText";
            this.reverseFillDirection = this.display.reverseFillDirection ?? false;
            this.backgroundImage = this.display.backgroundImage ?? new Image();
            this.fillStyle = this.display.fillStyle ?? "rgba(255, 255, 255, 0.5)";
            this.fillStyleBackground = this.display.fillStyleBackground ?? "rgba(37, 37, 37, 0.43)";
            this.fontStyle = this.display.fontStyle ?? { textAlign: "center", fillStyle: "black", font: "30px Lucida Console", strokeStyle: "white", strokeWidth: 3 };
        }
    }
    applyOpacityToColor(color, opacity) {
        // Parse rgba(r, g, b, a) or rgb(r, g, b)
        const rgbaMatch = color.match(/^rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)$/);
        if (rgbaMatch) {
            const r = rgbaMatch[1];
            const g = rgbaMatch[2];
            const b = rgbaMatch[3];
            const a = rgbaMatch[4] ? parseFloat(rgbaMatch[4]) : 1.0;
            const newAlpha = a * opacity;
            return `rgba(${r}, ${g}, ${b}, ${newAlpha})`;
        }
        // Parse hex colors (#RRGGBB or #RGB)
        const hexMatch = color.match(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/);
        if (hexMatch) {
            let hex = hexMatch[1];
            // Expand shorthand form (e.g. "03F") to full form (e.g. "0033FF")
            if (hex.length === 3) {
                hex = hex.split('').map(char => char + char).join('');
            }
            const r = parseInt(hex.substring(0, 2), 16);
            const g = parseInt(hex.substring(2, 4), 16);
            const b = parseInt(hex.substring(4, 6), 16);
            return `rgba(${r}, ${g}, ${b}, ${opacity})`;
        }
        // Fallback: return original color (shouldn't happen with our configs)
        return color;
    }
    update(delta) {
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
            if (gamepad !== null && gamepad.axes && this.hasStickInput && this.axis !== null) {
                if (gamepad.axes[this.axis] !== null && gamepad.axes[this.axis] !== undefined
                    && ((this.revertedAxis === true && gamepad.axes[this.axis] < 0)
                        || (this.revertedAxis === false && gamepad.axes[this.axis] > 0))) {
                    if (this.linkedAxis >= 0 && gamepad.axes[this.linkedAxis]) {
                        //Converts circular back to square coordinates
                        value += Math.abs(gamepad.axes[this.axis]) * Math.sqrt(1 + 2 * Math.pow(Math.abs(gamepad.axes[this.linkedAxis]), 2));
                    }
                    else if (this.linkedAxis < 0) {
                        value += (Math.abs(gamepad.axes[this.axis]) - newAntiDeadzone) / (1 - newAntiDeadzone);
                    }
                }
                if (this.linkedAxis >= 0 && gamepad.axes[this.linkedAxis]) {
                    linkedValue += Math.abs(gamepad.axes[this.linkedAxis]);
                }
            }
            if (gamepad !== null && gamepad.buttons && this.hasButtonInput && this.button !== null) {
                if (gamepad.buttons[this.button]) {
                    value += gamepad.buttons[this.button].value;
                }
            }
        }
        // Calculate raw input value (clamped 0-1)
        // Guard against divide-by-zero
        if (newAntiDeadzone >= 1.0)
            newAntiDeadzone = 0.999;
        const rawValue = Math.max(Math.min((value - newAntiDeadzone) / (1 - newAntiDeadzone) * this.multiplier, 1), 0);
        // Signal processing approach: fade opacity, not fill amount
        if (rawValue > 0) {
            // Input active - instant response, full opacity
            this.value = rawValue;
            this.opacity = 1.0;
        }
        else if (this.fadeOutDuration > 0 && this.value > 0) {
            // Input inactive - keep fill at current value, fade opacity to 0
            // Decay rate: higher fadeOutDuration = slower decay
            const decayRate = 1.0 / this.fadeOutDuration;
            this.opacity = this.opacity * Math.exp(-decayRate * delta);
            // Clamp to 0 when very small (prevent floating point drift)
            if (this.opacity < 0.001) {
                this.opacity = 0;
                this.value = 0; // Clear value when fade complete
            }
        }
        else {
            // No fade - instant off
            this.value = 0;
            this.opacity = 1.0;
        }
        return true;
    }
    draw(canvas, ctx) {
        // Fill background
        ctx.beginPath();
        canvas_fill_rec(ctx, 0, 0, this.hitboxSize.widthInPx, this.hitboxSize.lengthInPx, { fillStyle: this.fillStyleBackground });
        // Draw background image scaled to dimensions
        try {
            ctx.drawImage(this.backgroundImage, 0, 0, this.backgroundImage.width, this.backgroundImage.height, 0, 0, this.hitboxSize.widthInPx, this.hitboxSize.lengthInPx);
        }
        catch (e) {
            // Image not loaded yet or failed to load - skip silently
            // Will retry next frame when image loads
        }
        // Fill value (vertical fill from bottom or top) - drawn on top of image
        // Apply opacity to fillStyle for fade effect
        const fillStyleWithOpacity = this.applyOpacityToColor(this.fillStyle, this.opacity);
        ctx.beginPath();
        if (this.reverseFillDirection == true)
            canvas_fill_rec(ctx, 0, this.hitboxSize.lengthInPx, this.hitboxSize.widthInPx, -this.hitboxSize.lengthInPx * this.value, { fillStyle: fillStyleWithOpacity });
        else
            canvas_fill_rec(ctx, 0, 0, this.hitboxSize.widthInPx, this.hitboxSize.lengthInPx * this.value, { fillStyle: fillStyleWithOpacity });
        // Print key text centered with configurable stroke outline
        const textX = this.hitboxSize.widthInPx * 0.5;
        const textY = this.hitboxSize.lengthInPx * 0.5;
        canvas_properties(ctx, this.fontStyle);
        ctx.strokeStyle = this.fontStyle.strokeStyle ?? "white";
        ctx.lineWidth = this.fontStyle.strokeWidth ?? 3;
        ctx.strokeText(this.keyText, textX, textY);
        canvas_text(ctx, textX, textY, this.keyText, this.fontStyle);
    }
}
export { LinearInputIndicator };
