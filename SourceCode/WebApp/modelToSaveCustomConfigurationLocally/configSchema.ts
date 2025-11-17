import { z } from 'zod';

// Primitive schemas with defaults
const CanvasObjectPositionSchema = z.object({
	pxFromCanvasLeft: z.number().default(100),
	pxFromCanvasTop: z.number().default(100)
}).default({ pxFromCanvasLeft: 100, pxFromCanvasTop: 100 });

const CanvasObjectHitboxSchema = z.object({
	widthInPx: z.number().default(100),
	lengthInPx: z.number().default(100)
}).default({ widthInPx: 100, lengthInPx: 100 });

const CanvasConfigSchema = z.object({
	width: z.number().default(1920),
	height: z.number().default(1080),
	backgroundColor: z.string().default('rgba(0, 0, 0, 0)')
}).default({ width: 1920, height: 1080, backgroundColor: 'rgba(0, 0, 0, 0)' });

// Base schema for all canvas objects (internal format - no id)
const BaseCanvasObjectSchema = z.object({
	positionOnCanvas: CanvasObjectPositionSchema,
	hitboxSize: CanvasObjectHitboxSchema,
	layerLevel: z.number().default(10)
});

const LinearInputIndicatorSchema = BaseCanvasObjectSchema.extend({
	input: z.object({
		keyboard: z.object({
			keyCode: z.string().nullable().default(null)
		}).default({ keyCode: null }),
		mouse: z.object({
			button: z.number().nullable().default(null),
			wheel: z.enum(['up', 'down']).nullable().default(null)
		}).default({ button: null, wheel: null }),
		gamepad: z.object({
			stick: z.object({
				type: z.enum(['left', 'right']).nullable().default(null),
				axis: z.enum(['X', 'Y']).nullable().default(null),
				direction: z.enum(['positive', 'negative']).nullable().default(null)
			}).default({ type: null, axis: null, direction: null }),
			button: z.object({
				index: z.number().nullable().default(null)
			}).default({ index: null })
		}).default({
			stick: { type: null, axis: null, direction: null },
			button: { index: null }
		})
	}).default({
		keyboard: { keyCode: null },
		mouse: { button: null, wheel: null },
		gamepad: { stick: { type: null, axis: null, direction: null }, button: { index: null } }
	}),
	processing: z.object({
		radialCompensationAxis: z.number().default(-1),
		multiplier: z.number().default(1),
		antiDeadzone: z.number().default(0.01),
		fadeOutDuration: z.number().default(0.2)
	}).default({ radialCompensationAxis: -1, multiplier: 1, antiDeadzone: 0.01, fadeOutDuration: 0.2 }),
	display: z.object({
		text: z.string().default(""),
		fillStyle: z.string().default("#00ff00"),
		fillStyleBackground: z.string().default("#222222"),
		fontStyle: z.object({
			textAlign: z.enum(['left', 'right', 'center', 'start', 'end']).default('center'),
			fillStyle: z.string().default("black"),
			font: z.string().default("30px Lucida Console"),
			strokeStyle: z.string().default("white"),
			strokeWidth: z.number().default(3)
		}).default({ textAlign: 'center', fillStyle: "black", font: "30px Lucida Console", strokeStyle: "white", strokeWidth: 3 }),
		fillDirection: z.enum(['normal', 'reversed']).default('normal')
	}).default({
		text: "",
		fillStyle: "#00ff00",
		fillStyleBackground: "#222222",
		fontStyle: { textAlign: 'center', fillStyle: "black", font: "30px Lucida Console", strokeStyle: "white", strokeWidth: 3 },
		fillDirection: 'normal'
	})
});

const StylePropertiesSchema = z.object({
	strokeStyle: z.string(),
	fillStyle: z.string(),
	lineWidth: z.number(),
	opacity: z.number()
}).partial();

const PlanarInputIndicatorSchema = BaseCanvasObjectSchema.extend({
	hitboxSize: z.object({
		widthInPx: z.number().default(200),
		lengthInPx: z.number().default(200)
	}).default({ widthInPx: 200, lengthInPx: 200 }),
	input: z.object({
		xAxes: z.record(z.string(), z.boolean()).default({ "0": true }),
		yAxes: z.record(z.string(), z.boolean()).default({ "1": true }),
		xKeyCodePositive: z.string().nullable().default("ArrowRight"),
		xKeyCodeNegative: z.string().nullable().default("ArrowLeft"),
		yKeyCodePositive: z.string().nullable().default("ArrowUp"),
		yKeyCodeNegative: z.string().nullable().default("ArrowDown"),
		invertX: z.boolean().default(false),
		invertY: z.boolean().default(false)
	}).default({ xAxes: { "0": true }, yAxes: { "1": true }, xKeyCodePositive: "ArrowRight", xKeyCodeNegative: "ArrowLeft", yKeyCodePositive: "ArrowUp", yKeyCodeNegative: "ArrowDown", invertX: false, invertY: false }),
	processing: z.object({
		deadzone: z.number().default(0.03),
		antiDeadzone: z.number().default(0)
	}).default({ deadzone: 0.03, antiDeadzone: 0 }),
	display: z.object({
		radius: z.number().default(100),
		stickRadius: z.number().optional(),
		fillStyle: z.string().optional(),
		fillStyleStick: z.string().optional(),
		fillStyleBackground: z.string().optional(),
		backgroundStyle: StylePropertiesSchema.default({ strokeStyle: "rgba(180, 180, 180, 0.5)", lineWidth: 2, fillStyle: "rgba(0, 0, 0, 0)" }),
		xLineStyle: StylePropertiesSchema.default({ strokeStyle: "#FF0000", lineWidth: 2, opacity: 0.5 }),
		yLineStyle: StylePropertiesSchema.default({ strokeStyle: "#00FF00", lineWidth: 2, opacity: 0.5 }),
		deadzoneStyle: StylePropertiesSchema.default({ fillStyle: "#524d4d" }),
		inputVectorStyle: StylePropertiesSchema.default({ strokeStyle: "rgba(255, 255, 0, 1.0)", lineWidth: 2, opacity: 0.5 }),
		unitVectorStyle: StylePropertiesSchema.default({ strokeStyle: "rgba(0, 0, 255, 1.0)", lineWidth: 2, opacity: 0.5 }),
		crosshairStyle: StylePropertiesSchema.default({ fillStyle: "#FFFFFF", strokeStyle: "#000000", lineWidth: 2 })
	}).default({
		radius: 100,
		backgroundStyle: { strokeStyle: "rgba(180, 180, 180, 0.5)", lineWidth: 2, fillStyle: "rgba(0, 0, 0, 0)" },
		xLineStyle: { strokeStyle: "#FF0000", lineWidth: 2, opacity: 0.5 },
		yLineStyle: { strokeStyle: "#00FF00", lineWidth: 2, opacity: 0.5 },
		deadzoneStyle: { fillStyle: "#524d4d" },
		inputVectorStyle: { strokeStyle: "rgba(255, 255, 0, 1.0)", lineWidth: 2, opacity: 0.5 },
		unitVectorStyle: { strokeStyle: "rgba(0, 0, 255, 1.0)", lineWidth: 2, opacity: 0.5 },
		crosshairStyle: { fillStyle: "#FFFFFF", strokeStyle: "#000000", lineWidth: 2 }
	})
});

const TextSchema = BaseCanvasObjectSchema.extend({
	hitboxSize: z.object({
		widthInPx: z.number().default(200),
		lengthInPx: z.number().default(50)
	}).default({ widthInPx: 200, lengthInPx: 50 }),
	layerLevel: z.number().default(20),
	text: z.string().default("Sample text"),
	textStyle: z.object({
		textAlign: z.enum(['left', 'right', 'center', 'start', 'end']).default('center'),
		fillStyle: z.string().default("black"),
		font: z.string().default("30px Lucida Console"),
		strokeStyle: z.string().default("white"),
		strokeWidth: z.number().default(3)
	}).default({ textAlign: 'center', fillStyle: "black", font: "30px Lucida Console", strokeStyle: "white", strokeWidth: 3 }),
	shouldStroke: z.boolean().default(true)
});

const ImageSchema = BaseCanvasObjectSchema.extend({
	layerLevel: z.number().default(0),
	src: z.string().default("./viewWhichRendersConfigurationAndUi/_assets/images/KeyDefault.png"),
	opacity: z.number().min(0).max(1).default(1.0)
});

const WebEmbedSchema = BaseCanvasObjectSchema.extend({
	hitboxSize: z.object({
		widthInPx: z.number().default(640),
		lengthInPx: z.number().default(480)
	}).default({ widthInPx: 640, lengthInPx: 480 }),
	url: z.string().default("https://www.youtube.com/embed/dQw4w9WgXcQ"),
	opacity: z.number().min(0).max(1).default(1.0),
	interactionMode: z.enum(['readonly', 'interactableOnFocus']).default('interactableOnFocus')
});

// Union using class names as keys (NixOS style)
const CanvasObjectConfigSchema = z.union([
	z.object({ LinearInputIndicator: LinearInputIndicatorSchema }),
	z.object({ PlanarInputIndicator: PlanarInputIndicatorSchema }),
	z.object({ Text: TextSchema }),
	z.object({ Image: ImageSchema }),
	z.object({ WebEmbed: WebEmbedSchema })
]);

export const CustomisableCanvasConfigSchema = z.object({
	canvas: CanvasConfigSchema,
	objects: z.array(CanvasObjectConfigSchema)
});

// Export base schemas for use in classes (single source of truth!)
export {
	BaseCanvasObjectSchema,
	LinearInputIndicatorSchema,
	PlanarInputIndicatorSchema,
	TextSchema,
	ImageSchema,
	WebEmbedSchema
};

// Export types derived from schemas
export type CanvasConfig = z.infer<typeof CanvasConfigSchema>;
export type CanvasObjectConfig = z.infer<typeof CanvasObjectConfigSchema>;
export type CustomisableCanvasConfig = z.infer<typeof CustomisableCanvasConfigSchema>;
export type StyleProperties = z.infer<typeof StylePropertiesSchema>;
export type BaseCanvasObjectConfig = z.infer<typeof BaseCanvasObjectSchema>;

export type LinearInputIndicatorConfig = z.infer<typeof LinearInputIndicatorSchema>;
export type PlanarInputIndicatorConfig = z.infer<typeof PlanarInputIndicatorSchema>;
export type TextConfig = z.infer<typeof TextSchema>;
export type ImageConfig = z.infer<typeof ImageSchema>;
export type WebEmbedConfig = z.infer<typeof WebEmbedSchema>;

export function validateCustomisableCanvasConfig(data: unknown): { success: true; data: z.infer<typeof CustomisableCanvasConfigSchema> } | { success: false; error: z.ZodError } {
	const result = CustomisableCanvasConfigSchema.safeParse(data);
	if (result.success) {
		return { success: true, data: result.data };
	} else {
		return { success: false, error: result.error };
	}
}
