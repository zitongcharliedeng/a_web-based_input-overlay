import { CanvasObject } from './BaseCanvasObject';
import type { CanvasObjectPosition } from './BaseCanvasObject';
import type { LinearInputIndicatorConfig, LinearInputIndicatorTemplate, CanvasObjectConfig } from '../../../modelToSaveCustomConfigurationLocally/OmniConfig';
type DeepPartial<T> = T extends object ? {
    [P in keyof T]?: DeepPartial<T[P]>;
} : T;
declare class LinearInputIndicator extends CanvasObject {
    static readonly TYPE: "linearInputIndicator";
    static readonly DISPLAY_NAME = "LinearInputIndicator";
    static readonly DEFAULT_TEMPLATE: LinearInputIndicatorTemplate;
    static readonly TEMPLATES: {
        W: {
            input: {
                keyboard: {
                    keyCode: string;
                };
            };
            display: {
                text: string;
            };
        };
        A: {
            input: {
                keyboard: {
                    keyCode: string;
                };
            };
            display: {
                text: string;
            };
        };
        S: {
            input: {
                keyboard: {
                    keyCode: string;
                };
            };
            display: {
                text: string;
                reverseFillDirection: boolean;
            };
        };
        D: {
            input: {
                keyboard: {
                    keyCode: string;
                };
            };
            display: {
                text: string;
            };
        };
        SPACE: {
            input: {
                keyboard: {
                    keyCode: string;
                };
            };
            display: {
                text: string;
            };
        };
        MOUSE_LEFT: {
            input: {
                mouse: {
                    button: number;
                };
            };
            display: {
                text: string;
            };
        };
        MOUSE_RIGHT: {
            input: {
                mouse: {
                    button: number;
                };
            };
            display: {
                text: string;
            };
        };
        GAMEPAD_A: {
            input: {
                gamepad: {
                    button: {
                        index: number;
                    };
                };
            };
            display: {
                text: string;
            };
        };
    };
    static spawn(templateName: keyof typeof LinearInputIndicator.TEMPLATES, overrides?: DeepPartial<LinearInputIndicatorConfig>): LinearInputIndicator;
    static fromConfig(config: CanvasObjectConfig): LinearInputIndicator;
    className: string;
    input: LinearInputIndicatorTemplate['input'];
    processing: LinearInputIndicatorTemplate['processing'];
    display: LinearInputIndicatorTemplate['display'];
    value: number;
    _previousValue: number;
    opacity: number;
    constructor(config: {
        positionOnCanvas: CanvasObjectPosition;
    } & DeepPartial<Omit<LinearInputIndicatorConfig, 'type' | 'positionOnCanvas'>>);
    private applyOpacityToColor;
    update(delta: number): boolean;
    draw(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D): void;
}
export { LinearInputIndicator };
export declare const defaultTemplateFor_LinearInputIndicator: LinearInputIndicatorTemplate;
