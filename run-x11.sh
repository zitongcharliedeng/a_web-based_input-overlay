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

# uiohook-napi requires X11 libraries
# libX11 (core X11), libXtst (XTest), libXrandr (RandR), libXt (Xt toolkit)
# Force X11 mode and pass all arguments to electron
nix-shell -p nodejs electron xorg.libX11 xorg.libXtst xorg.libXrandr xorg.libXt --run "ELECTRON_OZONE_PLATFORM_HINT=x11 electron . $*"
