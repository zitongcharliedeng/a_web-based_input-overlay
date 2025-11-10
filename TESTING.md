# Testing Guide - Unfocused Input Capture

## Critical Question: Does Electron capture DOM events when unfocused on Windows?

This test determines if we need uiohook-napi at all, or if Electron's built-in event system is sufficient.

## Windows Quick Start

### Prerequisites

1. Install [Node.js](https://nodejs.org/) (includes npm)
2. Install [Git for Windows](https://git-scm.com/download/win)
3. Clone the repository:
   ```powershell
   git clone https://github.com/zitongcharliedeng/a_web-based_input-overlay.git
   cd a_web-based_input-overlay
   git checkout uiohook-attempt
   ```

### One-Click Test (Recommended)

**PowerShell** (Recommended):
```powershell
.\run-windows.ps1
```

**Command Prompt**:
```cmd
run-windows.bat
```

This script will:
1. Pull latest experimental code
2. Install dependencies (including uiohook-napi)
3. Compile TypeScript
4. Launch **both** web version (browser) and Electron app

### Manual Test

If you prefer to run steps individually:

```powershell
git pull origin uiohook-attempt
npm install
npm run start:web    # Opens in browser
npm run start:win    # Opens Electron window
```

## Test Procedure

### Test 1: Focused Input (Baseline)

**Expected**: Both versions should work

1. Click on the web version (browser tab)
2. Press **W, A, S, D** keys
3. **Verify**: Keys light up in overlay
4. Click on the Electron window
5. Press **W, A, S, D** keys
6. **Verify**: Keys light up in overlay

**Result**: PASS / FAIL

---

### Test 2: Unfocused Input (Critical!)

**Question**: Does input register when window is unfocused?

#### Web Version (Browser)
1. Open the browser tab with overlay
2. Press **Alt+Tab** to focus Notepad/any other app
3. Press **W, A, S, D** keys while Notepad is focused
4. **Verify**: Do keys light up in the background browser tab?

**Result**: PASS / FAIL

#### Electron Version
1. Open the Electron window
2. Press **Alt+Tab** to focus Notepad/any other app
3. Press **W, A, S, D** keys while Notepad is focused
4. **Verify**: Do keys light up in the Electron overlay?

**Result**: PASS / FAIL

---

### Test 3: uiohook-napi Global Hooks

**Only if Test 2 Electron FAILED**

1. Check Electron terminal output for:
   ```
   [Main] ✓ uiohook-napi loaded successfully
   [Main] Starting global input hooks...
   [Main] Global keydown: [keycode]
   ```

2. If you see errors like:
   ```
   [Main] ✗ uiohook-napi not available
   ```
   Then uiohook-napi failed to install (likely needs Visual Studio build tools)

3. Press **W, A, S, D** while Notepad is focused
4. **Verify**: Do you see `[Main] Global keydown:` messages in terminal?

**Result**: PASS / FAIL

---

## Expected Outcomes

### Scenario A: Electron DOM events work unfocused (BEST CASE)
- Test 1: PASS (both)
- Test 2 Browser: FAIL (expected - browsers can't capture unfocused)
- Test 2 Electron: **PASS** (DOM events work!)
- **Action**: Ship without uiohook-napi, simplest solution

### Scenario B: Need uiohook-napi (EXPECTED)
- Test 1: PASS (both)
- Test 2 Browser: FAIL (expected)
- Test 2 Electron: FAIL (DOM doesn't capture unfocused)
- Test 3: PASS (uiohook captures unfocused)
- **Action**: Implement deduplication (global + DOM events)

### Scenario C: uiohook-napi broken on Windows (PROBLEM)
- Test 1: PASS (both)
- Test 2: FAIL (both)
- Test 3: FAIL (uiohook not working)
- **Action**: Debug uiohook installation, may need Visual Studio build tools

---

## Reporting Results

Please create a GitHub issue with this template:

```
## Test Environment
- OS: Windows 10/11
- Node.js version: [run `node --version`]
- npm version: [run `npm --version`]
- Electron version: 28.0.0

## Test Results
- Test 1 (Focused - Web): PASS / FAIL
- Test 1 (Focused - Electron): PASS / FAIL
- Test 2 (Unfocused - Web): PASS / FAIL
- Test 2 (Unfocused - Electron): PASS / FAIL
- Test 3 (uiohook logs): PASS / FAIL / N/A

## Console Output
[Paste relevant logs here]

## Conclusion
Which scenario (A/B/C) matches your results?
```

---

## Other Platforms

### Linux (Already Tested)
- DOM events: FAIL when unfocused (confirmed on niri compositor)
- uiohook-napi: Status unknown (needs testing)
- Alternative: evdev direct access (confirmed working)

### macOS
- DOM events: Unknown (needs testing)
- uiohook-napi: Unknown (needs testing)

---

## Troubleshooting

### uiohook-napi fails to install

**Error**: `node-gyp` build failures

**Fix**: Install Visual Studio Build Tools
```cmd
npm install --global windows-build-tools
```

Or install Visual Studio 2022 with "Desktop development with C++" workload.

### Electron window doesn't appear

**Check**: Antivirus might be blocking. Try:
```cmd
npm run dev:win
```
This enables logging to see what's happening.

### TypeScript errors

**Fix**: Compile manually
```cmd
npm run check
```

If errors persist, they might be non-blocking. The app should still run.

---

## Next Steps After Testing

Based on test results, we'll implement:

**If Scenario A (DOM works unfocused):**
- Remove uiohook-napi dependency
- Ship clean Electron app with DOM events only
- Much simpler architecture

**If Scenario B (Need uiohook):**
- Implement event deduplication (global + DOM)
- Both inputs active simultaneously
- Dedupe by timestamp (ignore DOM if global fired <50ms ago)
- Fallback gracefully if global hooks fail

**If Scenario C (uiohook broken):**
- Debug native module compilation
- Consider alternatives (node-global-key-listener, nut.js)
- Document Windows build requirements
