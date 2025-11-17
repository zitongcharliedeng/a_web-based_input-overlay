import { CanvasObjectInstance } from './BaseCanvasObject';
import { ImageSchema } from '../../../modelToSaveCustomConfigurationLocally/configSchema';
export class Image extends CanvasObjectInstance {
    constructor(configOverrides, objArrayIdx) {
        super(objArrayIdx);
        this.config = ImageSchema.parse(configOverrides || {});
        this.runtimeState = {
            imageElement: new window.Image()
        };
        this.runtimeState.imageElement.src = this.config.src;
    }
    update() {
        return this.runtimeState.imageElement.complete;
    }
    draw(_canvas, ctx) {
        if (!this.runtimeState.imageElement.complete)
            return;
        ctx.save();
        ctx.globalAlpha *= this.config.opacity;
        try {
            ctx.drawImage(this.runtimeState.imageElement, 0, 0, this.runtimeState.imageElement.width, this.runtimeState.imageElement.height, 0, 0, this.config.hitboxSize.widthInPx, this.config.hitboxSize.lengthInPx);
        }
        catch {
        }
        ctx.restore();
    }
}
//# sourceMappingURL=Image.js.map