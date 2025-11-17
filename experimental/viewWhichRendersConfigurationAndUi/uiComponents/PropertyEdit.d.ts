import type { ConfigManager } from '../../modelToSaveCustomConfigurationLocally/ConfigManager';
import type { CustomisableCanvasConfig, CanvasObjectConfig } from '../../modelToSaveCustomConfigurationLocally/CustomisableCanvasConfig';
import type { CanvasObjectInstance } from '../canvasRenderer/canvasObjectTypes/BaseCanvasObject';
declare class PropertyEdit {
    className: string;
    targetObject: CanvasObjectInstance | null;
    targetObjectIndex: number | null;
    configManager: ConfigManager | null;
    targetScene: CustomisableCanvasConfig | null;
    applySceneConfig: ((config: CustomisableCanvasConfig) => void) | null;
    deleteCallback: (() => void) | null;
    pendingChanges: Map<string, {
        path: string[];
        value: unknown;
    }>;
    hidePropertyEdit(): void;
    showPropertyEdit(config: CanvasObjectConfig, targetObject: CanvasObjectInstance, objArrayIdx: number, configManager: ConfigManager, deleteCallback?: () => void): void;
    showCanvasConfig(config: CustomisableCanvasConfig, canvas: HTMLCanvasElement, applyCallback: (config: CustomisableCanvasConfig) => void): void;
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
