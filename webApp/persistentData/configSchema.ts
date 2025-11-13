import { z } from 'zod';

const CanvasObjectPositionSchema = z.object({
	pxFromCanvasLeft: z.number(),
	pxFromCanvasTop: z.number()
});

const CanvasObjectHitboxSchema = z.object({
	widthInPx: z.number(),
	lengthInPx: z.number()
});

const CanvasConfigSchema = z.object({
	width: z.number(),
	height: z.number(),
	backgroundColor: z.string()
});

const BaseCanvasObjectConfigSchema = z.object({
	positionOnCanvas: CanvasObjectPositionSchema,
	hitboxSize: CanvasObjectHitboxSchema,
	layerLevel: z.number()
});

const LinearInputIndicatorConfigSchema = BaseCanvasObjectConfigSchema.extend({
	input: z.object({
		keyboard: z.object({ keyCode: z.string().nullable() }),
		mouse: z.object({
			button: z.number().nullable(),
			wheel: z.enum(['up', 'down']).nullable()
		}),
		gamepad: z.object({
			stick: z.object({
				type: z.enum(['left', 'right']).nullable(),
				axis: z.enum(['X', 'Y']).nullable(),
				direction: z.enum(['positive', 'negative']).nullable()
			}),
			button: z.object({ index: z.number().nullable() })
		})
	}),
	processing: z.object({
		linkedAxis: z.number(),
		multiplier: z.number(),
		antiDeadzone: z.number(),
		fadeOutDuration: z.number()
	}),
	display: z.object({
		text: z.string(),
		fillStyle: z.string(),
		fillStyleBackground: z.string(),
		fontStyle: z.object({
			textAlign: z.string(),
			fillStyle: z.string(),
			font: z.string(),
			strokeStyle: z.string(),
			strokeWidth: z.number()
		}),
		reverseFillDirection: z.boolean()
	})
});

const PlanarInputIndicatorConfigSchema = BaseCanvasObjectConfigSchema.extend({
	input: z.object({
		xAxes: z.record(z.number(), z.boolean()),
		yAxes: z.record(z.number(), z.boolean()),
		invertX: z.boolean(),
		invertY: z.boolean()
	}),
	processing: z.object({
		deadzone: z.number(),
		antiDeadzone: z.number()
	}),
	display: z.object({
		radius: z.number(),
		stickRadius: z.number(),
		fillStyle: z.string(),
		fillStyleStick: z.string(),
		fillStyleBackground: z.string()
	})
});

const TextConfigSchema = BaseCanvasObjectConfigSchema.extend({
	text: z.string(),
	textStyle: z.object({
		textAlign: z.string(),
		fillStyle: z.string(),
		font: z.string(),
		strokeStyle: z.string(),
		strokeWidth: z.number()
	}),
	shouldStroke: z.boolean()
});

const ImageConfigSchema = BaseCanvasObjectConfigSchema.extend({
	src: z.string(),
	opacity: z.number().min(0).max(1)
});

const CanvasObjectConfigSchema = z.union([
	z.object({ linearInputIndicator: LinearInputIndicatorConfigSchema }),
	z.object({ planarInputIndicator: PlanarInputIndicatorConfigSchema }),
	z.object({ text: TextConfigSchema }),
	z.object({ image: ImageConfigSchema })
]);

export const OmniConfigSchema = z.object({
	canvas: CanvasConfigSchema,
	objects: z.array(CanvasObjectConfigSchema),
	version: z.string().optional()
});

export function validateOmniConfig(data: unknown): { success: true; data: z.infer<typeof OmniConfigSchema> } | { success: false; error: z.ZodError } {
	const result = OmniConfigSchema.safeParse(data);
	if (result.success) {
		return { success: true, data: result.data };
	} else {
		return { success: false, error: result.error };
	}
}
