// Omniconfig - Single source of truth for entire overlay scene
// NixOS-style: declarative, explicit (no hidden defaults), type-as-key, spawn templates
// ============================================================================
// SPAWN TEMPLATES - Match patterns used in current test scene
// ============================================================================
// Common display defaults
const DEFAULT_KEY_IMAGE_URL = "https://raw.githubusercontent.com/zitongcharliedeng/a_web-based_input-overlay/refs/heads/master/webApp/browserInputOverlayView/_assets/images/KeyDefault.png";
const DEFAULT_DISPLAY = {
    text: "",
    backgroundImage: DEFAULT_KEY_IMAGE_URL,
    fillStyle: "#00ff00",
    fillStyleBackground: "#222222",
    fontStyle: {
        textAlign: "center",
        fillStyle: "white",
        font: "30px Lucida Console"
    },
    reverseFillDirection: false
};
// Pattern 1: Multi-input (keyboard + mouse + gamepad stick)
export function spawnMultiInputLinearIndicator(params) {
    return {
        positionOnCanvas: params.positionOnCanvas,
        hitboxSize: params.hitboxSize,
        input: {
            keyboard: { keyCode: params.keyCode },
            mouse: { button: params.mouseButton, wheel: null },
            gamepad: {
                stick: { type: params.stickType, axis: params.stickAxis, direction: params.stickDirection },
                button: { index: null }
            }
        },
        processing: {
            linkedAxis: params.linkedAxis,
            multiplier: 1,
            antiDeadzone: 0
        },
        display: {
            ...DEFAULT_DISPLAY,
            text: params.text
        }
    };
}
// Pattern 2: Gamepad stick only
export function spawnGamepadStickLinearIndicator(params) {
    return {
        positionOnCanvas: params.positionOnCanvas,
        hitboxSize: params.hitboxSize,
        input: {
            keyboard: { keyCode: null },
            mouse: { button: null, wheel: null },
            gamepad: {
                stick: { type: params.stickType, axis: params.stickAxis, direction: params.stickDirection },
                button: { index: null }
            }
        },
        processing: {
            linkedAxis: params.linkedAxis,
            multiplier: 1,
            antiDeadzone: 0
        },
        display: {
            ...DEFAULT_DISPLAY,
            text: params.text
        }
    };
}
// Pattern 3: Keyboard only (digital)
export function spawnKeyboardLinearIndicator(params) {
    return {
        positionOnCanvas: params.positionOnCanvas,
        hitboxSize: params.hitboxSize,
        input: {
            keyboard: { keyCode: params.keyCode },
            mouse: { button: null, wheel: null },
            gamepad: {
                stick: { type: null, axis: null, direction: null },
                button: { index: null }
            }
        },
        processing: {
            linkedAxis: -1,
            multiplier: 1,
            antiDeadzone: 0
        },
        display: {
            ...DEFAULT_DISPLAY,
            text: params.text
        }
    };
}
// Pattern 4: Gamepad button only
export function spawnGamepadButtonLinearIndicator(params) {
    return {
        positionOnCanvas: params.positionOnCanvas,
        hitboxSize: params.hitboxSize,
        input: {
            keyboard: { keyCode: null },
            mouse: { button: null, wheel: null },
            gamepad: {
                stick: { type: null, axis: null, direction: null },
                button: { index: params.buttonIndex }
            }
        },
        processing: {
            linkedAxis: -1,
            multiplier: 1,
            antiDeadzone: 0
        },
        display: {
            ...DEFAULT_DISPLAY,
            text: params.text
        }
    };
}
// Pattern 5: Planar indicator (joystick visualization)
export function spawnPlanarIndicator(params) {
    return {
        positionOnCanvas: params.positionOnCanvas,
        hitboxSize: params.hitboxSize,
        input: {
            xAxes: params.xAxes,
            yAxes: params.yAxes,
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
}
// Pattern 6: Text label
export function spawnTextLabel(params) {
    return {
        positionOnCanvas: params.positionOnCanvas,
        hitboxSize: params.hitboxSize,
        text: params.text,
        textStyle: {
            textAlign: "left",
            fillStyle: "#FFFFFF",
            font: params.font || "20px Lucida Console"
        },
        shouldStroke: false
    };
}
