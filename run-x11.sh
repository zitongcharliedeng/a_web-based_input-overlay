#!/usr/bin/env bash
# X11/XWayland mode run script
# Use this if Wayland causes issues (e.g., global input hooks don't work)
# Usage:
#   ./run-x11.sh                                  - Interactive mode via X11/XWayland
#   ./run-x11.sh --in-clickthrough-readonly-mode  - Readonly overlay mode via X11/XWayland
#   ./run-x11.sh --with-dev-console               - Enable DevTools (breaks transparency)
#   ./run-x11.sh --with-window-frame              - Show window frame (for debugging)
#
# Flags can be combined: ./run-x11.sh --in-clickthrough-readonly-mode --with-window-frame

set -e

# Use shell.nix for proper native module support
# Force X11/XWayland mode (recommended for uiohook-napi on Wayland)
# Set DISPLAY to connect to XWayland (usually :0 or :1 on niri)
nix-shell --run "DISPLAY=:1 ELECTRON_OZONE_PLATFORM_HINT=x11 electron . $*"
