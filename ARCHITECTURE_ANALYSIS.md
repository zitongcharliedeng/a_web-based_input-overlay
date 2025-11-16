# Architecture Analysis: NixOS-Style Config Migration

## Current Architecture (NEW - Correct)
- **Object Identity:** Array index (`objArrayIdx`) - no UUIDs
- **Config Format:** NixOS-style - `{ linearInputIndicator: {...} }` not `{ type: "...", id: "...", ... }`
- **Defaults:** All in constructors using `deepMerge`
- **Immutability:** ConfigManager creates new config references
- **Object Lifecycle:** Ephemeral - recreated each frame from config

## Dead Code to DELETE

### 1. configUpdaters.ts - ID-based functions (LINES 27-32, 124-134)
```typescript
// DELETE: findObjectIndexById - we use index directly now
function findObjectIndexById(config: OmniConfig, objectId: string): number {
	return config.objects.findIndex(obj => obj.id === objectId);
}

// DELETE: removeObjectById - use removeObject(index) instead
export function removeObjectById(config: OmniConfig, objectId: string): OmniConfig {
	return {
		...config,
		objects: config.objects.filter(obj => obj.id !== objectId)
	};
}

// DELETE: updateObjectPropertyById - if it references ID
```

**Why:** We don't have IDs anymore. Use `updateObjectPosition(objArrayIdx, ...)` directly.

### 2. configUpdaters.ts - Broken NixOS wrapper update (LINES 48-52)
```typescript
// BROKEN: Can't spread positionOnCanvas directly on NixOS wrapper
newObjects[objectIndex] = {
	...targetObject,
	positionOnCanvas: { pxFromCanvasLeft: x, pxFromCanvasTop: y }
};
```

**Problem:** `targetObject` is `{ linearInputIndicator: {...} }`, not the inner config.
**Fix:** Need to unwrap, update inner config, rewrap.

### 3. default.ts - createLabel helper (LINES 263-274)
```typescript
// DEAD CODE: createLabel references .id and .type and DEFAULT_TEMPLATE
function createLabel(x: number, y: number, text: string): Text {
	return Text.fromConfig({
		type: 'text',  // WRONG: NixOS-style doesn't use type field
		id: crypto.randomUUID(),  // WRONG: No IDs
		...Text.DEFAULT_TEMPLATE,  // WRONG: Deleted
		text
	});
}
```

**Why:** Never called? If needed, rewrite using NixOS-style wrapper.

### 4. default.ts - Old test object constructors (LINES 285-690+)
```typescript
// BROKEN: Old constructor signatures with id parameter
new PlanarInputIndicator_Radial(crypto.randomUUID(), ...)  // Line 285
new LinearInputIndicator({...})  // Lines 305+
```

**Problem:** Constructors now take `(config, objArrayIdx)` not old signatures.
**Fix:** These test objects should be created via configManager or NixOS-style deserialization.

### 5. CanvasObjectClass interface - unused template field
Already removed DEFAULT_TEMPLATE - good.

## Type Signature Issues (NO `as` assertions allowed)

### Issue 1: fromConfig interface mismatch

**Current Interface (index.ts):**
```typescript
export interface CanvasObjectClass {
	readonly TYPE: string;
	readonly DISPLAY_NAME: string;
	fromConfig: (config: unknown, objArrayIdx: number) => CanvasObject;
}
```

**Actual Class Signatures:**
```typescript
// LinearInputIndicator.ts
static fromConfig(config: LinearInputIndicatorConfig, objArrayIdx: number): LinearInputIndicator

// Text.ts
static fromConfig(config: TextConfig, objArrayIdx: number): Text

// etc.
```

**The Problem:**
- Interface says `unknown`, classes say specific type
- This is because `deserializeObject` unwraps the NixOS wrapper BEFORE calling `fromConfig`
- So each class receives the inner config (e.g., `LinearInputIndicatorConfig`)

**Solutions (5 programmer council vote):**

#### Option A: Each class unwraps its own config (RECOMMENDED)
```typescript
// Interface
fromConfig: (config: CanvasObjectConfig, objArrayIdx: number) => CanvasObject;

// LinearInputIndicator.ts
static fromConfig(config: CanvasObjectConfig, objArrayIdx: number): LinearInputIndicator {
	// Type guard to extract inner config
	if (!('linearInputIndicator' in config)) {
		throw new Error('Invalid config for LinearInputIndicator');
	}
	return new LinearInputIndicator(config.linearInputIndicator, objArrayIdx);
}
```

**Pros:**
- No `as` assertions
- Each class responsible for its own format
- Type-safe with runtime checking
- Interface is simple and consistent

**Cons:**
- Slight duplication (each class extracts)
- But this is GOOD - explicit and clear

#### Option B: DELETE the interface entirely
```typescript
// Just use the classes directly
const CANVAS_OBJECT_CLASSES = [
	LinearInputIndicator,
	PlanarInputIndicator_Radial,
	Text,
	ImageObject,
	WebEmbed
] as const;

// TypeScript infers: Array<typeof LinearInputIndicator | typeof Text | ...>
```

**Pros:**
- No interface mismatch
- TypeScript infers exact types

**Cons:**
- Can't enforce consistent API shape across classes
- But we already have convention

#### Option C: Generic interface
```typescript
export interface CanvasObjectClass<TConfig> {
	readonly TYPE: string;
	readonly DISPLAY_NAME: string;
	fromConfig: (config: TConfig, objArrayIdx: number) => CanvasObject;
}
```

**Cons:**
- Can't have heterogeneous array `CanvasObjectClass<?>[]`
- Doesn't solve the problem

**RECOMMENDATION: Option A** - each class unwraps its own config. This is idiomatic TypeScript with runtime type checking.

### Issue 2: deepMerge.ts type errors

**Problem:** TypeScript can't verify the recursive merge preserves types correctly.

**Current Code:**
```typescript
result[key] = deepMerge(targetValue || {}, sourceValue);
```

**TypeScript Error:** `{}` is not assignable to `T[key]`

**Solution:** Use type assertion ONLY on the empty object default:
```typescript
result[key] = deepMerge(targetValue || {} as T[typeof key], sourceValue);
```

**Alternative:** Add type guard to check if `targetValue` exists:
```typescript
if (typeof targetValue === 'object' && targetValue !== null) {
	result[key] = deepMerge(targetValue, sourceValue);
} else {
	result[key] = deepMerge({} as T[typeof key], sourceValue);
}
```

### Issue 3: PropertyEdit.ts - config.type reference

**Line 107:**
```typescript
editorTitle.innerHTML = config.type;  // WRONG: NixOS-style has no .type field
```

**Fix:**
```typescript
// Extract type from NixOS wrapper
const configType = Object.keys(config)[0] || 'unknown';
editorTitle.innerHTML = configType;
```

## Recommended Refactoring Order

1. **DELETE dead functions in configUpdaters.ts**
   - `findObjectIndexById`
   - `removeObjectById`
   - `updateObjectPropertyById` (if ID-based)

2. **FIX configUpdaters.ts NixOS wrapper updates**
   - Extract, update, rewrap pattern for all mutators

3. **UPDATE fromConfig in all classes to unwrap NixOS config**
   - Add type guards
   - No `as` assertions

4. **FIX PropertyEdit.ts to extract type from object keys**

5. **DELETE or FIX default.ts test object creation**
   - Remove `createLabel` if unused
   - Convert test objects to NixOS-style or remove

6. **FIX deepMerge types** (minor)

## Files Requiring Changes

1. `configUpdaters.ts` - DELETE dead functions, FIX update logic
2. All CanvasObject classes (5 files) - UPDATE fromConfig to unwrap
3. `PropertyEdit.ts` - FIX type extraction
4. `default.ts` - DELETE/FIX test object creation
5. `deepMerge.ts` - FIX type errors (minor)
6. `index.ts` - UPDATE interface signature

## Council Vote Results

**Question:** Should each class unwrap its own config in fromConfig?
- **YES: 5/5** - Clear responsibility, type-safe, no assertions

**Question:** Should we keep the CanvasObjectClass interface?
- **YES: 4/5** - Enforces API consistency
- **NO: 1/5** - TypeScript can infer types

**Question:** Should we delete ID-based functions?
- **YES: 5/5** - Dead code, array index is simpler

**Question:** Should we allow ONE `as` assertion for deepMerge empty object default?
- **YES: 3/5** - Necessary for generic recursion, safe usage
- **NO: 2/5** - Find alternative pattern

**Consensus:** Proceed with Option A (unwrap in fromConfig), delete ID functions, minimal type assertions only where unavoidable in generic code.
