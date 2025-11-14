import { validateOmniConfig } from './modelToSaveCustomConfigurationLocally/configSchema.js';

const testData = {"version":"89ccefa","canvas":{"width":2880,"height":1426,"backgroundColor":"transparent"},"objects":[{"text":{"positionOnCanvas":{"pxFromCanvasLeft":20,"pxFromCanvasTop":20},"hitboxSize":{"widthInPx":600,"lengthInPx":30},"layerLevel":20,"text":"TEST 1: Left Stick + WASD + Mouse - WITH radial compensation vs WITHOUT","textStyle":{"textAlign":"left","fillStyle":"black","font":"20px Lucida Console","strokeStyle":"white","strokeWidth":3},"shouldStroke":true}},{"text":{"positionOnCanvas":{"pxFromCanvasLeft":20,"pxFromCanvasTop":45},"hitboxSize":{"widthInPx":600,"lengthInPx":30},"layerLevel":20,"text":"Move diagonally: LEFT shows ~100% (compensated), RIGHT shows ~70% (raw circular)","textStyle":{"textAlign":"left","fillStyle":"black","font":"20px Lucida Console","strokeStyle":"white","strokeWidth":3},"shouldStroke":true}},{"planarInputIndicator":{"positionOnCanvas":{"pxFromCanvasLeft":20,"pxFromCanvasTop":80},"hitboxSize":{"widthInPx":200,"lengthInPx":200},"layerLevel":10,"input":{"xAxes":{"0":true},"yAxes":{"1":true},"invertX":false,"invertY":false},"processing":{"deadzone":0.01,"antiDeadzone":0},"display":{"radius":100,"stickRadius":40,"fillStyle":"#00ff00","fillStyleStick":"#ffffff","fillStyleBackground":"rgba(0, 0, 0, 0.5)","backgroundStyle":{"strokeStyle":"#B4B4B4","lineWidth":2,"fillStyle":"rgba(0, 0, 0, 0)"},"xLineStyle":{"strokeStyle":"#FF0000","lineWidth":2},"yLineStyle":{"strokeStyle":"#00FF00","lineWidth":2},"deadzoneStyle":{"fillStyle":"#524d4d"},"inputVectorStyle":{"strokeStyle":"#FFFF00","lineWidth":2},"unitVectorStyle":{"strokeStyle":"#0000FF","lineWidth":2}}}}]};

const result = validateOmniConfig(testData);

if (!result.success) {
	console.log('VALIDATION FAILED:');
	console.log(JSON.stringify(result.error.issues, null, 2));
	process.exit(1);
} else {
	console.log('✅ Validation passed');
	process.exit(0);
}
