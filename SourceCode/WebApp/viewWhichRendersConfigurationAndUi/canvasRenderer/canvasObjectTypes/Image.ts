import { CanvasObject } from './BaseCanvasObject';
import { deepMerge } from '../_helpers/deepMerge';
import type { ImageConfig, ImageTemplate, CanvasObjectConfig } from '../../../modelToSaveCustomConfigurationLocally/OmniConfig';
import { ImageDefaults } from '../../../modelToSaveCustomConfigurationLocally/OmniConfig';

class ImageObject extends CanvasObject {
    static readonly TYPE = 'image' as const;
    static readonly DISPLAY_NAME = 'Image';

    static fromConfig(config: CanvasObjectConfig, objArrayIdx: number): ImageObject {
        if (!('image' in config)) {
            throw new Error('Invalid config for ImageObject: expected { image: {...} }');
        }
        return new ImageObject(config.image, objArrayIdx);
    }

    src: ImageTemplate['src'];
    opacity: ImageTemplate['opacity'];
    imageElement: HTMLImageElement;

    constructor(config: Partial<ImageConfig>, objArrayIdx: number) {
        const merged = deepMerge(ImageDefaults, config);

        super(
            objArrayIdx,
            merged.positionOnCanvas,
            merged.hitboxSize,
            "image",
            merged.layerLevel
        );

        this.src = merged.src;
        this.opacity = merged.opacity;

        this.imageElement = new window.Image();
        this.imageElement.src = this.src;
    }

    update(): boolean {
        // Images are static - no updates needed
        // Return false if image not loaded, true once loaded
        return this.imageElement.complete;
    }

    draw(_canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D): void {
        // Only draw if image is loaded
        if (!this.imageElement.complete) return;

        // Save context state
        const prevAlpha = ctx.globalAlpha;
        ctx.globalAlpha = this.opacity;

        // Draw image scaled to hitbox dimensions
        try {
            ctx.drawImage(
                this.imageElement,
                0, 0,
                this.imageElement.width, this.imageElement.height,
                0, 0,
                this.hitboxSize.widthInPx, this.hitboxSize.lengthInPx
            );
        } catch {
            // Image loading failed - skip silently
        }

        // Restore context state
        ctx.globalAlpha = prevAlpha;
    }
}

export { ImageObject };
export type { ImageConfig } from '../../../modelToSaveCustomConfigurationLocally/OmniConfig';
