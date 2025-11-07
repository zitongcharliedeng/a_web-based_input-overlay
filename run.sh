#!/usr/bin/env bash
# Launcher for Slint + evdev Input Overlay
# Usage: ./run.sh [--dev] [--release]

set -e

MODE="debug"
CARGO_CMD="run"

while [[ $# -gt 0 ]]; do
    case $1 in
        --dev)
            MODE="dev"
            shift
            ;;
        --release)
            CARGO_CMD="run --release"
            shift
            ;;
        *)
            echo "Unknown option: $1"
            exit 1
            ;;
    esac
done

echo "=== Slint + evdev Input Overlay ==="
echo "Mode: $MODE"
echo ""
echo "REQUIREMENTS:"
echo "  - User must be in 'input' group:"
echo "    sudo usermod -aG input \$USER"
echo "  - You may need to log out/in for group to take effect"
echo ""

if ! groups | grep -q input; then
    echo "ERROR: User is not in 'input' group!"
    echo "Run: sudo usermod -aG input \$USER"
    echo "Then log out and log back in"
    exit 1
fi

echo "Building and running overlay..."
nix-shell --run "cargo $CARGO_CMD"
