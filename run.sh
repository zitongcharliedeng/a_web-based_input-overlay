#!/usr/bin/env bash
# Main run script for analog keyboard overlay
# Usage:
#   ./run.sh                                  - Interactive mode (can edit/drag objects)
#   ./run.sh --in-clickthrough-readonly-mode  - Readonly overlay mode (click-through, no UI editing)
#   ./run.sh --with-dev-console               - Enable DevTools (breaks transparency)
#   ./run.sh --with-window-frame              - Show window frame (for debugging)
#
# Flags can be combined: ./run.sh --in-clickthrough-readonly-mode --with-window-frame

set -e

# uiohook-napi requires X11 libraries: libXtst (XTest extension)
# Pass all arguments to electron
nix-shell -p nodejs electron xorg.libXtst --run "electron . $*"
