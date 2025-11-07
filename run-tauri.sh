#!/usr/bin/env bash
set -e

echo "[Tauri] Building and running input overlay..."
cd src-tauri
cargo run
echo "[Tauri] Application exited"
