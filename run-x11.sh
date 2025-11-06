#!/usr/bin/env bash
# X11/XWayland mode run script
# Use this if Wayland causes issues (e.g., global input hooks don't work)
# Usage:
#   ./run-x11.sh               - Interactive mode via X11/XWayland
#   ./run-x11.sh --readonly    - Readonly overlay mode via X11/XWayland
#   ./run-x11.sh --dev         - Enable DevTools (breaks transparency)
#   ./run-x11.sh --frame       - Show window frame (for debugging)
#
# Flags can be combined: ./run-x11.sh --readonly --frame

set -e

# Force X11 mode and pass all arguments to electron
nix-shell -p nodejs electron --run "ELECTRON_OZONE_PLATFORM_HINT=x11 electron . $*"
