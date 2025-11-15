import type { CanvasObjectPosition, CanvasObjectHitbox } from '../viewWhichRendersConfigurationAndUi/canvasRenderer/canvasObjectTypes/BaseCanvasObject';
export interface CanvasConfig {
    width: number;
    height: number;
    backgroundColor: string;
}
interface BaseCanvasObjectConfig {
    id: string;
    positionOnCanvas: CanvasObjectPosition;
    hitboxSize: CanvasObjectHitbox;
    layerLevel: number;
}
export interface LinearInputIndicatorTemplate {
    input: {
        keyboard: {
            keyCode: string | null;
        };
        mouse: {
            button: number | null;
            wheel: 'up' | 'down' | null;
        };
        gamepad: {
            stick: {
                type: 'left' | 'right' | null;
                axis: 'X' | 'Y' | null;
                direction: 'positive' | 'negative' | null;
            };
            button: {
                index: number | null;
            };
        };
    };
    processing: {
        radialCompensationAxis: number;
        multiplier: number;
        antiDeadzone: number;
        fadeOutDuration: number;
    };
    display: {
        text: string;
        fillStyle: string;
        fillStyleBackground: string;
        fontStyle: {
            textAlign: CanvasTextAlign;
            fillStyle: string;
            font: string;
            strokeStyle: string;
            strokeWidth: number;
        };
        reverseFillDirection: boolean;
    };
}
export interface LinearInputIndicatorConfig extends BaseCanvasObjectConfig {
    input: LinearInputIndicatorTemplate['input'];
    processing: LinearInputIndicatorTemplate['processing'];
    display: LinearInputIndicatorTemplate['display'];
}
export interface StyleProperties {
    strokeStyle?: string;
    fillStyle?: string;
    lineWidth?: number;
}
export interface PlanarInputIndicatorTemplate {
    input: {
        xAxes: {
            [gamepadIndex: string]: boolean;
        };
        yAxes: {
            [gamepadIndex: string]: boolean;
        };
        invertX: boolean;
        invertY: boolean;
    };
    processing: {
        deadzone: number;
        antiDeadzone: number;
    };
    display: {
        radius: number;
        stickRadius?: number;
        fillStyle?: string;
        fillStyleStick?: string;
        fillStyleBackground?: string;
        backgroundStyle: StyleProperties;
        xLineStyle: StyleProperties;
        yLineStyle: StyleProperties;
        deadzoneStyle: StyleProperties;
        inputVectorStyle: StyleProperties;
        unitVectorStyle: StyleProperties;
    };
}
export interface PlanarInputIndicatorConfig extends BaseCanvasObjectConfig {
    input: PlanarInputIndicatorTemplate['input'];
    processing: PlanarInputIndicatorTemplate['processing'];
    display: PlanarInputIndicatorTemplate['display'];
}
export interface TextTemplate {
    text: string;
    textStyle: {
        textAlign: CanvasTextAlign;
        fillStyle: string;
        font: string;
        strokeStyle: string;
        strokeWidth: number;
    };
    shouldStroke: boolean;
}
export interface TextConfig extends BaseCanvasObjectConfig {
    text: TextTemplate['text'];
    textStyle: TextTemplate['textStyle'];
    shouldStroke: TextTemplate['shouldStroke'];
}
export interface ImageTemplate {
    src: string;
    opacity: number;
}
export interface ImageConfig extends BaseCanvasObjectConfig {
    src: ImageTemplate['src'];
    opacity: ImageTemplate['opacity'];
}
export interface WebEmbedTemplate {
    url: string;
    opacity: number;
}
export interface WebEmbedConfig extends BaseCanvasObjectConfig {
    url: WebEmbedTemplate['url'];
    opacity: WebEmbedTemplate['opacity'];
}
export type CanvasObjectConfig = ({
    type: 'linearInputIndicator';
} & LinearInputIndicatorConfig) | ({
    type: 'planarInputIndicator';
} & PlanarInputIndicatorConfig) | ({
    type: 'text';
} & TextConfig) | ({
    type: 'image';
} & ImageConfig) | ({
    type: 'webEmbed';
} & WebEmbedConfig);
export declare function assertNever(value: never): never;
export declare function getConfigId(config: CanvasObjectConfig): string;
export interface OmniConfig {
    canvas: CanvasConfig;
    objects: CanvasObjectConfig[];
}
export {};
