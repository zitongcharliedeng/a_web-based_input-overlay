#!/bin/bash

set -e

echo "╔═════════════════════════════════════════════════════════════╗"
echo "║  rdev::grab() Wayland Test - Build & Run                   ║"
echo "╚═════════════════════════════════════════════════════════════╝"
echo ""

# Check if we're in nix-shell
if [ -z "$IN_NIX_SHELL" ]; then
    echo "Entering nix-shell environment..."
    nix-shell shell.nix --run "bash $0"
    exit $?
fi

# Build the test
echo "Building Rust test..."
cargo build 2>&1 | head -20

echo ""
echo "╔─────────────────────────────────────────────────────────────╗"
echo "║  Starting rdev::grab() Test                                 ║"
echo "╚─────────────────────────────────────────────────────────────╝"
echo ""

# Run with info-level logging by default
RUST_LOG="${RUST_LOG:-info}" cargo run
