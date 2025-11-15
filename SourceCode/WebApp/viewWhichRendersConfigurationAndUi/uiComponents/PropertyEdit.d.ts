import type { ConfigManager } from '../../modelToSaveCustomConfigurationLocally/ConfigManager';
import type { OmniConfig, CanvasObjectConfig } from '../../modelToSaveCustomConfigurationLocally/OmniConfig';
interface CanvasObject {
    id: string;
    className?: string;
    canvasObjectType?: string;
    positionOnCanvas: {
        pxFromCanvasLeft: number;
        pxFromCanvasTop: number;
    };
    hitboxSize: {
        widthInPx: number;
        lengthInPx: number;
    };
    layerLevel: number;
    defaultProperties?: Record<string, unknown>;
    constructor: {
        name: string;
    };
}
declare class PropertyEdit {
    className: string;
    targetObject: CanvasObject | null;
    targetObjectId: string | null;
    configManager: ConfigManager | null;
    targetScene: OmniConfig | null;
    applySceneConfig: ((config: OmniConfig) => void) | null;
    deleteCallback: (() => void) | null;
    pendingChanges: Map<string, {
        path: string[];
        value: unknown;
    }>;
    hidePropertyEdit(): void;
    showPropertyEdit(config: CanvasObjectConfig, targetObject: CanvasObject, objectId: string, configManager: ConfigManager, deleteCallback?: () => void): void;
    showCanvasConfig(config: OmniConfig, canvas: HTMLCanvasElement, applyCallback: (config: OmniConfig) => void): void;
    private renderProperties;
    private isRecord;
    private createPropertyHeader;
    private createPropertyRow;
    private createInput;
    private valueToString;
    private parseValue;
    private getNestedValue;
    private setNestedValue;
    private isPlainObject;
    update(): void;
    draw(): void;
}
export { PropertyEdit };
