import type { CustomisableCanvasConfig } from './CustomisableCanvasConfig';
export declare function loadConfigFromJSON(jsonString: string): {
    success: true;
    config: CustomisableCanvasConfig;
} | {
    success: false;
    error: string;
};
export declare function loadConfigFromLocalStorage(key: string): {
    success: true;
    config: CustomisableCanvasConfig;
} | {
    success: false;
    error: string;
} | {
    success: false;
    error: 'not_found';
};
