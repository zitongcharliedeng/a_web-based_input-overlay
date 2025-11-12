# Gamepad Input Test Plan

## Test 1: Web Version (Baseline)

**Purpose:** Verify web version still works (no regression in core code)

**Steps:**
1. Open PowerShell in project directory
2. Run: `npm run start:web`
3. Browser should open to `http://localhost:8080`
4. **ACTION:** Move gamepad analog sticks
5. **ACTION:** Press gamepad buttons

**Expected Results:**
- Analog indicators should move on screen
- Keys should light up when pressed

**If this fails:** Core code is broken (regression in game loop or rendering)
**If this works:** Problem is Electron-specific

---

## Test 2: SDL Controller API (Current Approach)

**Purpose:** Check if SDL controller API detects your Azeron XInput device

**Steps:**
1. Run: `.\build-and-run-windows.ps1`
2. Check PowerShell terminal logs

**ACTION 1:** Look for these lines at startup:
```
[Main] DEBUG: Controller object keys: [...]
[Main] DEBUG: Controller.axes: [...]
[Main] DEBUG: Controller.buttons: [...]
```

**Report back:**
- What keys does the controller object have?
- Are axes/buttons arrays present?

**ACTION 2:** Move left analog stick slowly
**Expected:** Terminal shows `[Main] DEBUG: axisMotion event: { axis: 0, value: ... }`

**Report back:**
- Do you see ANY axisMotion logs?
- YES or NO

**ACTION 3:** Press A button
**Expected:** Terminal shows `[Main] DEBUG: buttonDown event: { button: 0 }`

**Report back:**
- Do you see ANY buttonDown/buttonUp logs?
- YES or NO

---

## Test 3: SDL Joystick API (Alternative)

**Purpose:** Try SDL's low-level joystick API instead of controller API

**Note:** I will implement this based on Test 2 results

---

## Test 4: Chromium Gamepad API (Electron Native)

**Purpose:** Check if Electron's Chromium can see gamepads at all

**Current Status:** FAILING - DevTools shows `[null, null, null, null]`

**This means:**
- Either Electron's Chromium build doesn't support Gamepad API properly
- Or your Azeron device needs special handling

---

## Recommended Log Collection

**For each test, provide:**

1. **PowerShell startup logs** (first 20 lines after Electron starts)
2. **DevTools console** (right-click output, "Save as..." to file)
3. **Answer specific YES/NO questions** from each test

---

## Quick Reference: What to Run

```powershell
# Test 1: Web version
npm run start:web
# (Opens browser, test analog sticks and buttons)

# Test 2: Electron with debug logs
.\build-and-run-windows.ps1
# (Move sticks, press buttons, check terminal for DEBUG logs)
```
