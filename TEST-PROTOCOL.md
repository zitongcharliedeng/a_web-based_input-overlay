# Input Overlay Test Protocol
**Version:** 1.0
**Last Updated:** 2025-01-12
**Purpose:** Structured testing workflow with clear human action → expected result → actual result

---

## Test 1: Web Version Baseline (Regression Check)

**Objective:** Verify core game loop and rendering still works

**Steps:**
1. Run: `npm run start:web`
2. Wait for browser to open at `http://localhost:8080`

**Human Actions:**
- [ ] Move LEFT analog stick in a circle
- [ ] Move RIGHT analog stick in a circle
- [ ] Press A, B, X, Y buttons
- [ ] Press D-pad directions

**Expected Results:**
- [ ] Left analog indicator moves smoothly with stick
- [ ] Right analog indicator moves smoothly with stick
- [ ] Button indicators light up when pressed
- [ ] D-pad indicators light up when pressed

**Actual Result (User Reports):**
```
WEB VERSION: (✓ PASS / ✗ FAIL)
Notes:


```

---

## Test 2: Electron SDL Controller State Polling

**Objective:** Read gamepad state directly from SDL controller object (no events)

**Steps:**
1. Run: `.\build-and-run-windows.ps1`
2. Check PowerShell for startup logs

**Human Action #1: STARTUP CHECK**
Look for these lines:
```
[Main] DEBUG: Controller.axes: { ... }
[Main] DEBUG: Controller.buttons: { ... }
```

**Question 1:** Do you see controller.axes with properties like `leftStickX`, `rightStickX`?
**Answer:** (YES / NO)

**Question 2:** Are the axis values near 0.0 (neutral position)?
**Answer:** (YES / NO)

**Human Action #2: MOVE LEFT STICK**
- Move left analog stick slowly in a circle
- Watch PowerShell terminal

**Expected:** See repeated logs:
```
[Main] Gamepad state poll: leftStickX=0.XX, leftStickY=0.XX
```

**Question 3:** Do you see axis values changing in terminal?
**Answer:** (YES / NO)

**Question 4:** If YES, copy 3-5 lines of output:
```
(paste here)


```

**Human Action #3: PRESS A BUTTON**
- Press and hold the A button
- Watch PowerShell terminal

**Expected:** See logs:
```
[Main] Gamepad state poll: button 'a' changed to true
```

**Question 5:** Do you see button state changes in terminal?
**Answer:** (YES / NO)

**Human Action #4: CHECK RENDERER**
- Look at DevTools console

**Question 6:** Do you see "First SDL state received from main process"?
**Answer:** (YES / NO)

**Question 7:** Do analog indicators move on screen?
**Answer:** (YES / NO)

---

## Test 3: Joystick API Fallback

**Objective:** If Controller API fails, verify Joystick API works

**Steps:**
1. Same as Test 2, but look for "Joystick API" logs

**Human Action:** Move left analog stick

**Question 8:** Do you see logs starting with `[Main] Joystick API:`?
**Answer:** (YES / NO)

**Question 9:** If YES, does joystick state change when you move stick?
**Answer:** (YES / NO)

---

## Test 4: Unfocused Input (Final Validation)

**Objective:** Verify gamepad works when Electron window doesn't have focus

**Prerequisites:** Tests 1-3 must PASS

**Steps:**
1. Electron overlay running
2. Click on another window (e.g., browser, VS Code)
3. Move gamepad analog stick

**Question 10:** Do analog indicators still move in overlay?
**Answer:** (YES / NO)

**Question 11:** Does keyboard input (from uiohook) still work unfocused?
**Answer:** (YES / NO - we know this is YES already)

---

## Debug Data Collection Template

**If any test fails, provide:**

1. **PowerShell startup logs** (first 30 lines after Electron starts)
```
(paste here)


```

2. **PowerShell logs during stick movement** (10 lines)
```
(paste here)


```

3. **DevTools console** (warnings/errors only)
```
(paste here)


```

4. **Screenshot of overlay** (if visual issue)
- Save to `/screenshots/test-result.png`

---

## Success Criteria

| Test | Status | Required to Proceed |
|------|--------|---------------------|
| Test 1: Web version works | ☐ | YES (regression check) |
| Test 2: SDL state readable | ☐ | YES (proves SDL loaded) |
| Test 2: State changes with input | ☐ | YES (proves polling works) |
| Test 2: Renderer receives data | ☐ | YES (proves IPC works) |
| Test 2: Indicators move on screen | ☐ | YES (proves game loop works) |
| Test 4: Unfocused gamepad input | ☐ | YES (final goal) |

**Overall Status:** PENDING

---

## Notes Section

**Current Known Issues:**
- SDL events (`axisMotion`, `buttonDown`) do NOT fire
- Need to poll `controller.axes` and `controller.buttons` objects directly
- OBS plugin uses polling, not events (SDL_GetGamepadButton/Axis)

**Next Steps After Tests:**
1. If Test 2 passes: Implement unfocused polling
2. If Test 2 fails: Investigate why @kmamal/sdl state isn't updating
3. If Test 3 needed: Switch to Joystick API instead of Controller API
