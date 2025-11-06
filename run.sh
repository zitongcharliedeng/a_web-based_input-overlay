#!/usr/bin/env bash
# Main run script for analog keyboard overlay
# Usage:
#   ./run.sh               - Interactive mode (can edit/drag objects)
#   ./run.sh --readonly    - Readonly overlay mode (click-through, no UI editing)
#   ./run.sh --dev         - Enable DevTools (breaks transparency)
#   ./run.sh --frame       - Show window frame (for debugging)
#
# Flags can be combined: ./run.sh --readonly --frame

set -e

# Pass all arguments to electron
nix-shell -p nodejs electron --run "electron . $*"
