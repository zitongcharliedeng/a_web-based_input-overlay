# Testing - Unfocused Input Capture

## Question

Does Electron capture DOM events when unfocused on Windows? This determines if we need `uiohook-napi`.

## Setup

See [README.md](README.md) for initial setup (clone repo, install dependencies).

## Run Test

```powershell
.\run-windows.ps1
```

Or: `run-windows.bat` for Command Prompt.

## Test Procedure

1. **Focused test:** Click on web version, press WASD. Click on Electron, press WASD.
   - Expected: Both work.

2. **Unfocused test:** Alt+Tab to Notepad. Press WASD while Notepad is focused.
   - Web version: Expected to fail (browsers can't capture unfocused input).
   - Electron: Does it work?

## Results

**If Electron captures unfocused input:**
- Remove `uiohook-napi` dependency
- Ship with DOM events only (simplest solution)

**If Electron doesn't capture unfocused input:**
- Implement deduplication (global hooks + DOM events both active)
- Dedupe by timestamp (ignore DOM if global fired <50ms ago)

## Report

Create GitHub issue with:
- OS: Windows 10/11
- Test 1 (Focused): PASS/FAIL
- Test 2 (Unfocused - Web): Expected FAIL
- Test 2 (Unfocused - Electron): PASS/FAIL
- Console logs from Electron terminal
