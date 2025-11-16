# Council Decision: NixOS Config Updates

## Problem Statement

With NixOS-style discriminated union:
```typescript
type CanvasObjectConfig =
	| { linearInputIndicator: LinearInputIndicatorConfig }
	| { planarInputIndicator: PlanarInputIndicatorConfig }
	| { text: TextConfig }
	| { image: ImageConfig }
	| { webEmbed: WebEmbedConfig };
```

How do we update nested properties (like `positionOnCanvas`) without:
1. Type assertions (`as`)
2. Giant if/else chains
3. Unsafe `any` types

## Current Usage Analysis

### Who needs updates?

**1. InteractionController (drag & drop)**
```typescript
interactionController.setOnMoveObject((objectIndex, x, y) => {
	configManager.moveObject(objectIndex, x, y);
});
```
- Needs to update `positionOnCanvas` when user drags objects
- Has objectIndex (array position)
- Does NOT have object ID

**2. PropertyEdit (property editor UI)**
```typescript
this.configManager.updateObjectProperty(this.targetObjectId, change.path, change.value);
```
- Needs to update arbitrary nested properties
- Currently uses ID (BROKEN - we deleted IDs)
- Needs fixing anyway

## Council Votes

### Programmer 1 (Functional Purist)
**Opinion:** "Delete configUpdaters.ts entirely. ConfigManager should just do `this._config = {...this._config, objects: newObjectsArray}` inline. These helpers are unnecessary abstraction."

**Vote:** Delete configUpdaters, inline the logic

### Programmer 2 (Type Safety Advocate)
**Opinion:** "The NixOS wrapper is wrong for this use case. Shared fields (positionOnCanvas, hitboxSize, layerLevel) should be OUTSIDE the type-specific wrapper."

**Proposed Structure:**
```typescript
type CanvasObjectConfig = {
	// Shared fields outside
	positionOnCanvas: CanvasObjectPosition;
	hitboxSize: CanvasObjectHitbox;
	layerLevel: number;
	// Type-specific inside
	objectType:
		| { linearInputIndicator: LinearInputIndicatorTemplate }
		| { planarInputIndicator: PlanarInputIndicatorTemplate }
		| { text: TextTemplate }
		| { image: ImageTemplate }
		| { webEmbed: WebEmbedTemplate };
};
```

**Benefits:**
- Updating position is trivial: `{ ...config, positionOnCanvas: newPos }`
- No unwrap/rewrap needed
- Type-safe without assertions

**Vote:** Restructure data format

### Programmer 3 (Pragmatist)
**Opinion:** "Just use a switch statement with type narrowing. It's verbose but idiomatic TypeScript."

```typescript
export function updateObjectPosition(
	config: OmniConfig,
	objectIndex: number,
	x: number,
	y: number
): OmniConfig {
	const objects = [...config.objects];
	const target = objects[objectIndex];
	if (!target) return config;

	const newPos = { pxFromCanvasLeft: x, pxFromCanvasTop: y };

	// Extract type key for switch
	const typeKey = Object.keys(target)[0];

	switch (typeKey) {
		case 'linearInputIndicator':
			if ('linearInputIndicator' in target) {
				objects[objectIndex] = {
					linearInputIndicator: {
						...target.linearInputIndicator,
						positionOnCanvas: newPos
					}
				};
			}
			break;
		case 'planarInputIndicator':
			if ('planarInputIndicator' in target) {
				objects[objectIndex] = {
					planarInputIndicator: {
						...target.planarInputIndicator,
						positionOnCanvas: newPos
					}
				};
			}
			break;
		// ... etc for each type
	}

	return { ...config, objects };
}
```

**Vote:** Keep current structure, use switch statements

### Programmer 4 (Minimalist)
**Opinion:** "PropertyEdit is fundamentally broken with the new architecture. It references objectId which doesn't exist. Delete PropertyEdit entirely and rebuild it to use objArrayIdx."

**Analysis:**
- PropertyEdit.ts line 38 calls `updateObjectProperty(this.targetObjectId, ...)`
- But objects don't have IDs anymore
- PropertyEdit needs complete rewrite anyway

**Vote:** Delete PropertyEdit, rebuild from scratch

### Programmer 5 (Pattern Matcher)
**Opinion:** "Use a helper function that accepts a callback. Let the caller provide the update logic."

```typescript
function updateObjectAt(
	config: OmniConfig,
	objectIndex: number,
	updater: (obj: CanvasObjectConfig) => CanvasObjectConfig
): OmniConfig {
	const objects = [...config.objects];
	objects[objectIndex] = updater(objects[objectIndex]!);
	return { ...config, objects };
}

// Usage:
configManager.setConfig(updateObjectAt(config, objectIndex, (obj) => {
	if ('linearInputIndicator' in obj) {
		return {
			linearInputIndicator: {
				...obj.linearInputIndicator,
				positionOnCanvas: newPos
			}
		};
	}
	return obj;
}));
```

**Vote:** Generic updater with callback pattern

## Vote Tally

1. Delete configUpdaters: 1 vote
2. **Restructure data (shared fields outside):** 1 vote ⭐
3. Switch statement pattern: 1 vote
4. Delete PropertyEdit: 1 vote
5. Generic updater callback: 1 vote

**HUNG COUNCIL - TIE**

## Tie-Breaker Question

**Q: Which approach has the least code churn and stays closest to current architecture?**

### Re-vote with constraint: "Minimize breaking changes"

1. Programmer 1: Switch to Programmer 3's approach (switch statement)
2. Programmer 2: Stands by restructure (but acknowledges it's massive refactor)
3. Programmer 3: Switch statement ✓
4. Programmer 4: Switch to Programmer 3's approach (fix what exists)
5. Programmer 5: Generic updater callback

**NEW TALLY:**
- **Switch statement pattern: 3 votes** ✓✓✓
- Generic updater callback: 1 vote
- Restructure data: 1 vote

## Final Decision

**APPROACH: Use switch statements with type narrowing**

### Why?
1. Idiomatic TypeScript (exhaustive checking)
2. No `as` assertions needed
3. No `any` types
4. Minimal architecture changes
5. Compiler catches missing cases

### Implementation Plan

1. Keep `updateObjectPosition()` in configUpdaters.ts
2. Use switch statement with type narrowing
3. Fix ConfigManager imports (remove deleted ID-based functions)
4. Delete or rewrite PropertyEdit (it's broken anyway with ID references)

### Pattern to Use
```typescript
const typeKey = Object.keys(target)[0] as keyof typeof target;

switch (typeKey) {
	case 'linearInputIndicator': {
		const inner = target[typeKey];
		objects[objectIndex] = {
			[typeKey]: { ...inner, positionOnCanvas: newPos }
		};
		break;
	}
	// ... cases for each type
}
```

Wait - that still uses `as`.

### REVISED: No `as` needed with proper type guard

```typescript
if ('linearInputIndicator' in target) {
	objects[objectIndex] = {
		linearInputIndicator: {
			...target.linearInputIndicator,
			positionOnCanvas: newPos
		}
	};
} else if ('planarInputIndicator' in target) {
	objects[objectIndex] = {
		planarInputIndicator: {
			...target.planarInputIndicator,
			positionOnCanvas: newPos
		}
	};
}
// ... etc
```

TypeScript narrows the type at each branch - no `as` needed.

## FINAL ANSWER

**Use if/else with `in` type guards - verbose but 100% type-safe without assertions**
