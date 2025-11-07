#!/usr/bin/env bash

# run-raylib.sh - Launch Raylib overlay demo
# Usage: ./run-raylib.sh [--build-only]

set -e

echo "=== Raylib + rdev Overlay Demo ==="
echo ""

# Check if we're in nix-shell
if [ -z "$RAYLIB_INCLUDE_DIR" ]; then
    echo "Error: Not in nix-shell environment"
    echo "Please run: nix-shell shell-raylib.nix --run './run-raylib.sh'"
    exit 1
fi

# Check input group membership
if ! groups | grep -q '\binput\b'; then
    echo "Warning: User is not in 'input' group"
    echo "rdev requires input group membership for global input capture"
    echo "To fix: sudo usermod -aG input $USER"
    echo "Then logout and login again"
    echo ""
    read -p "Continue anyway? (y/N) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# Build the project
echo "Building Rust project..."
cargo build --release

if [ "$1" == "--build-only" ]; then
    echo "Build complete. Binary at: target/release/input-overlay-raylib"
    exit 0
fi

echo ""
echo "Starting overlay..."
echo "- Window: 1920x1080 transparent"
echo "- Test: Press W key (works even when unfocused)"
echo "- Exit: Press ESC or Ctrl+C"
echo ""

# Run the overlay
./target/release/input-overlay-raylib
