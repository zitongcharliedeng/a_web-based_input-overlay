// Omniconfig - Single source of truth for entire overlay scene
// NixOS-style: declarative, explicit (no hidden defaults), type-as-key, spawn templates
// ============================================================================
// DEFAULT TEMPLATES - Complete configs with sensible defaults
// Usage: Spread and override what you need
// Position defaults to 0,0; size defaults to usable values
// Final omniconfig is always explicit and complete
// ============================================================================
// Common constants
const DEFAULT_KEY_IMAGE_URL = "https://raw.githubusercontent.com/zitongcharliedeng/a_web-based_input-overlay/refs/heads/master/webApp/browserInputOverlayView/_assets/images/KeyDefault.png";
// LinearInputIndicator default template - complete config
export const defaultTemplateFor_LinearInputIndicator = {
    positionOnCanvas: { pxFromCanvasLeft: 0, pxFromCanvasTop: 0 },
    hitboxSize: { widthInPx: 100, lengthInPx: 100 }, // Sensible default size
    input: {
        keyboard: { keyCode: null },
        mouse: { button: null, wheel: null },
        gamepad: {
            stick: { type: null, axis: null, direction: null },
            button: { index: null }
        }
    },
    processing: {
        linkedAxis: -1,
        multiplier: 1,
        antiDeadzone: 0,
        fadeOutDuration: 0.5
    },
    display: {
        text: "",
        backgroundImage: DEFAULT_KEY_IMAGE_URL,
        fillStyle: "#00ff00",
        fillStyleBackground: "#222222",
        fontStyle: {
            textAlign: "center",
            fillStyle: "black",
            font: "30px Lucida Console"
        },
        reverseFillDirection: false
    }
};
// PlanarInputIndicator default template - complete config
export const defaultTemplateFor_PlanarInputIndicator = {
    positionOnCanvas: { pxFromCanvasLeft: 0, pxFromCanvasTop: 0 },
    hitboxSize: { widthInPx: 200, lengthInPx: 200 }, // Sensible default size
    input: {
        xAxes: {},
        yAxes: {},
        invertX: false,
        invertY: false
    },
    processing: {
        deadzone: 0.01,
        antiDeadzone: 0
    },
    display: {
        radius: 100,
        stickRadius: 40,
        fillStyle: "#00ff00",
        fillStyleStick: "#ffffff",
        fillStyleBackground: "rgba(0, 0, 0, 0.5)"
    }
};
// Text default template - complete config
export const defaultTemplateFor_Text = {
    positionOnCanvas: { pxFromCanvasLeft: 0, pxFromCanvasTop: 0 },
    hitboxSize: { widthInPx: 600, lengthInPx: 30 }, // Sensible default size for labels
    text: "",
    textStyle: {
        textAlign: "left",
        fillStyle: "black",
        font: "20px Lucida Console"
    },
    shouldStroke: true
};
