import { CanvasObject } from './BaseCanvasObject';
import { Vector } from '../../../_helpers/Vector';
import type { PlanarInputIndicatorTemplate, CanvasObjectConfig } from '../../../modelToSaveCustomConfigurationLocally/OmniConfig';
interface AxisMapping {
    [axisIndex: number]: boolean;
}
interface StyleProperties {
    strokeStyle?: string;
    fillStyle?: string;
    lineWidth?: number;
}
interface PlanarInputConfig {
    xAxes?: AxisMapping;
    yAxes?: AxisMapping;
    invertX?: boolean;
    invertY?: boolean;
}
interface PlanarProcessingConfig {
    deadzone?: number;
    antiDeadzone?: number;
}
interface PlanarDisplayConfig {
    radius?: number;
    backgroundStyle?: StyleProperties;
    xLineStyle?: StyleProperties;
    yLineStyle?: StyleProperties;
    deadzoneStyle?: StyleProperties;
    inputVectorStyle?: StyleProperties;
    unitVectorStyle?: StyleProperties;
}
interface PlanarInputIndicator_RadialProperties {
    input?: PlanarInputConfig;
    processing?: PlanarProcessingConfig;
    display?: PlanarDisplayConfig;
}
interface PlanarInputConfigDefaults {
    xAxes: AxisMapping;
    yAxes: AxisMapping;
    invertX: boolean;
    invertY: boolean;
}
interface PlanarProcessingConfigDefaults {
    deadzone: number;
    antiDeadzone: number;
}
interface PlanarDisplayConfigDefaults {
    radius: number;
    backgroundStyle: StyleProperties;
    xLineStyle: StyleProperties;
    yLineStyle: StyleProperties;
    deadzoneStyle: StyleProperties;
    inputVectorStyle: StyleProperties;
    unitVectorStyle: StyleProperties;
}
declare class PlanarInputIndicator_Radial extends CanvasObject {
    static readonly TYPE: "planarInputIndicator";
    static readonly DISPLAY_NAME = "PlanarInputIndicator_Radial";
    static readonly DEFAULT_TEMPLATE: PlanarInputIndicatorTemplate;
    static fromConfig(config: CanvasObjectConfig): PlanarInputIndicator_Radial;
    defaultProperties: PlanarInputIndicator_RadialProperties;
    className: string;
    inputVector: Vector;
    previousX: number;
    previousY: number;
    input: PlanarInputConfigDefaults;
    processing: PlanarProcessingConfigDefaults;
    display: PlanarDisplayConfigDefaults;
    constructor(id: string, x: number, y: number, width: number, height: number, properties?: PlanarInputIndicator_RadialProperties, layerLevel?: number);
    update(): boolean;
    draw(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D): void;
}
export { PlanarInputIndicator_Radial };
export declare const defaultTemplateFor_PlanarInputIndicator: PlanarInputIndicatorTemplate;
