#!/usr/bin/env bash
# Run script for Tauri overlay with transparent window
# Usage: nix-shell shell-tauri.nix --run "./run-tauri.sh"

set -e

echo "[Tauri] Building and running input overlay..."

# Change to src-tauri directory
cd src-tauri

# Build and run
cargo run

echo "[Tauri] Application exited"
