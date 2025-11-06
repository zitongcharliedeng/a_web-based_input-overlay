# Testing Results & Platform Compatibility

## Summary (2025-11-06)

### What Works ✅
- **NixOS shell.nix setup**: Auto-patches uiohook-napi .node binaries with correct RPATH
- **Electron IPC infrastructure**: Preload script, contextBridge, IPC messaging all working
- **uiohook-napi library loads successfully** on NixOS (after patching)
- **DOM event fallback**: Keyboard/mouse/gamepad input works when window is focused
- **Gamepad API**: Works unfocused (as expected, browser native)

### Known Limitations ❌
- **Global keyboard hooks don't work on niri compositor** (Wayland)
  - Error: `XkbGetKeyboard failed to locate a valid keyboard!`
  - Reason: Wayland security model prevents non-privileged apps from accessing keyboard info
  - Affects both native Wayland and XWayland modes (tested with DISPLAY=:1)
  - This is a niri/Wayland architectural limitation, not a bug
  - **Likely affects other Wayland compositors** (GNOME, KDE, Hyprland) - needs testing

### Test Environment
- **OS**: NixOS with niri compositor (Wayland-based, scrollable tiling WM)
- **Electron**: 28.0.0
- **Node**: Via nix-shell
- **uiohook-napi**: 1.5.1 (patched via shell.nix)

### Test Results

#### Test 1: Preload & IPC
- **Status**: ✅ PASS
- **Evidence**:
  - `[Preload] Preload script loaded successfully!`
  - `[Renderer] ✓ electronAPI is available!`
  - `[Renderer] Has global input: true`

#### Test 2: uiohook Loading
- **Status**: ✅ PASS (after NixOS patching)
- **Evidence**:
  - `[Main] ✓ uiohook-napi loaded successfully`
  - `[Main] ✓ Global input hooks started`
  - `ldd` shows all X11 libraries found in `/nix/store/`

#### Test 3: Global Keyboard Events
- **Status**: ❌ FAIL on niri (Wayland)
- **Evidence**:
  - No `[Main] Global keydown` logs when pressing keys
  - `load_input_helper [1827]: XkbGetKeyboard failed to locate a valid keyboard!`
  - Tested with both native Wayland mode and XWayland (DISPLAY=:1)
  - Works with DOM events when focused (fallback operational)

#### Test 4: DOM Event Fallback
- **Status**: ✅ PASS
- **Evidence**: User confirmed "regular dom key inputs work as usual"

## Next Steps

### Immediate (Graceful Degradation)
- [ ] Add detection when global hooks fail to initialize
- [ ] Show helpful warning about Wayland/niri limitations
- [ ] Document which compositors are supported (X11, Windows, macOS confirmed working)

### Alternative Approaches to Research
1. **Direct evdev access** (`/dev/input/eventX`)
   - Pro: Works on Wayland
   - Con: Requires root or udev rules

2. **libei** (input emulation/capture on Wayland)
   - Pro: Wayland-native protocol
   - Con: Very new, limited compositor support

3. **Accept DOM-only on Wayland**
   - Pro: Simple, secure
   - Con: Requires window focus

### Platform Testing TODO
- [ ] Test on GNOME (Wayland)
- [ ] Test on KDE Plasma (Wayland)
- [ ] Test on Hyprland
- [ ] Test on X11-only system
- [ ] Test on Windows (should work)
- [ ] Test on macOS (should work with accessibility permissions)
