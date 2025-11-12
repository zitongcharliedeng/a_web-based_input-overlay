# Input Overlay Test Protocol
**Version:** 2.0
**Last Updated:** 2025-01-12
**Purpose:** Structured testing workflow for SDL gamepad polling implementation

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

## Test 2: Electron SDL State Polling (sdl2-gamecontroller)

**Objective:** Verify SDL gamepad polling works via separate thread (60fps)

**Prerequisites:**
- CMake installed (run `.\install-cmake-windows.ps1` if needed)
- Dependencies installed (run `npm install`)

**Steps:**
1. Run: `.\build-and-run-windows.ps1`
2. Check PowerShell for startup logs
3. DevTools will open automatically

**Human Action #1: STARTUP CHECK**
Look for these lines in PowerShell:
```
[Main] ✓ sdl2-gamecontroller loaded (60fps polling, unfocused support)
[Main] Starting SDL gamepad polling...
[Main] ✓ SDL gamepad polling started (60fps internal thread)
```

**Question 1:** Do you see all three SDL startup messages?
**Answer:** (YES / NO)

**Question 2:** If NO, what error message appears?
**Answer:**
```
(paste error here)


```

---

**Human Action #2: MOVE LEFT STICK**
- Move left analog stick slowly in a circle
- Watch PowerShell terminal for logs

**Expected:** See axis value logs like:
```
[Main] SDL axis leftx: 0.512
[Main] SDL axis lefty: -0.342
[Main] SDL axis leftx: 0.623
```

**Question 3:** Do you see axis values changing in terminal?
**Answer:** (YES / NO)

**Question 4:** If YES, copy 5-10 lines of output:
```
(paste here)


```

---

**Human Action #3: PRESS A BUTTON**
- Press the A button (release after 1 second)
- Watch PowerShell terminal

**Expected:** See button logs:
```
[Main] SDL button down: a (index 0)
[Main] SDL button up: a (index 0)
```

**Question 5:** Do you see BOTH button down AND button up messages?
**Answer:** (YES / NO)

**Question 6:** If NO, what do you see instead?
**Answer:**
```
(paste here)


```

---

**Human Action #4: CHECK RENDERER (DevTools)**
- Look at DevTools console (already open)
- Move analog stick

**Expected:** See renderer logs like:
```
[Renderer] SDL gamepad state update - axes: 0.51,-0.34,0.00,0.00 - buttons: 1 pressed
```

**Question 7:** Do you see SDL state updates in DevTools console?
**Answer:** (YES / NO)

**Question 8:** Do analog indicators move on screen when you move stick?
**Answer:** (YES / NO)

---

## Test 3: Unfocused Input (Final Validation)

**Objective:** Verify gamepad works when Electron window doesn't have focus

**Prerequisites:** Tests 1-2 must PASS

**Steps:**
1. Electron overlay running
2. Click on another window (e.g., browser, VS Code, PowerShell)
3. Move gamepad analog stick while overlay is unfocused
4. Watch the overlay window (not focused)

**Question 9:** Do analog indicators still move in overlay while unfocused?
**Answer:** (YES / NO)

**Question 10:** Do you still see SDL logs in PowerShell terminal while unfocused?
**Answer:** (YES / NO)

**Question 11:** Does keyboard input (from uiohook) still work unfocused?
**Answer:** (YES / NO - should be YES from previous sessions)

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
| Test 2: SDL library loads | ☐ | YES (proves SDL installed) |
| Test 2: Axis values in terminal | ☐ | YES (proves events fire) |
| Test 2: Button events in terminal | ☐ | YES (proves button polling works) |
| Test 2: Renderer receives data | ☐ | YES (proves IPC works) |
| Test 2: Indicators move on screen | ☐ | YES (proves game loop works) |
| Test 3: Unfocused gamepad input | ☐ | YES (final goal) |

**Overall Status:** PENDING

---

## Technical Notes

**How SDL Polling Works:**
- `sdl2-gamecontroller` runs `SDL_PumpEvents()` in a separate thread (60fps)
- This thread is independent of Electron's event loop
- Events fire even when Electron window is unfocused
- Matches OBS input-overlay plugin architecture

**Known Limitations:**
- Requires CMake to build native SDL bindings
- Windows: Use `install-cmake-windows.ps1` script
- Linux: CMake usually pre-installed
- macOS: Install via Homebrew (`brew install cmake`)

**Troubleshooting:**
- If SDL fails to load: Check CMake installation
- If axis values don't change: Controller may not be recognized
- If unfocused doesn't work: Check OS security settings

---

## Next Steps After Tests

1. **If Test 2 passes:** Proceed to Test 3 (unfocused validation)
2. **If Test 2 fails:** Check debug logs, verify CMake and npm install
3. **If Test 3 passes:** SDL unfocused gamepad WORKING! 🎉
4. **If Test 3 fails:** Investigate OS-specific window focus behavior
