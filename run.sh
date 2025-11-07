#!/usr/bin/env bash
# Launch wgpu input overlay with proper environment setup

set -e

echo "=== wgpu Input Overlay Launcher ==="
echo ""

# Check if user is in input group
if ! groups | grep -q input; then
    echo "WARNING: User is not in 'input' group"
    echo "evdev will not have permission to read input devices"
    echo ""
    echo "To fix, run:"
    echo "  sudo usermod -aG input $USER"
    echo "Then log out and back in"
    echo ""
fi

# Detect if running in NixOS
if [ -f /etc/os-release ]; then
    if grep -q "nixos" /etc/os-release; then
        echo "NixOS detected - using nix-shell"
        exec nix-shell --pure --run "RUST_LOG=info cargo run --release"
    fi
fi

# Standard build and run
echo "Building release binary..."
RUST_LOG=info cargo build --release

echo ""
echo "Launching wgpu input overlay..."
echo "Display: auto-detect (Wayland/X11)"
echo "Transparency: enabled"
echo "Input capture: evdev (guaranteed Wayland support)"
echo ""
echo "Press Ctrl+C to exit"
echo ""

RUST_LOG=info ./target/release/wgpu-overlay
