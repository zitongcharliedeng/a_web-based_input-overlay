#!/usr/bin/env bash
# Setup script for creating all 8 parallel approach branches
# Each branch will have its own minimal working demo

set -e  # Exit on error

# Get session ID from current branch name
SESSION_ID=$(git branch --show-current | grep -oP '011C[A-Za-z0-9]+$' || echo "UNKNOWN")
echo "Detected session ID: $SESSION_ID"

# Define branch names with session ID suffix
BRANCHES=(
    "claude/raylib-rdev-$SESSION_ID"
    "claude/tauri-rdev-$SESSION_ID"
    "claude/bevy-rdev-$SESSION_ID"
    "claude/gtk4-layer-shell-$SESSION_ID"
    "claude/wgpu-winit-rdev-$SESSION_ID"
    "claude/slint-rdev-$SESSION_ID"
    "claude/neutralino-evdev-$SESSION_ID"
    "claude/dioxus-rdev-$SESSION_ID"
)

# Branch descriptions
DESCRIPTIONS=(
    "Raylib (C/OpenGL) + rdev - Maximum performance, native rendering"
    "Tauri (Rust + Web) + rdev - Migrate from Electron, reuse 90% code"
    "Bevy (Game Engine) + rdev - ECS architecture, modern Rust patterns"
    "GTK4 + layer-shell - Native Wayland protocol overlay"
    "wgpu + winit + rdev - Low-level WebGPU graphics"
    "Slint + rdev - Declarative native UI framework"
    "Neutralino.js + evdev - Lightweight Electron alternative (keep current)"
    "Dioxus + rdev - React-like Rust UI framework"
)

echo "=========================================="
echo "Parallel Branch Setup for Input Overlay"
echo "=========================================="
echo ""
echo "This script will create 8 parallel branches:"
echo ""

for i in "${!BRANCHES[@]}"; do
    echo "$((i+1)). ${BRANCHES[$i]}"
    echo "   ${DESCRIPTIONS[$i]}"
    echo ""
done

echo "Current branch: $(git branch --show-current)"
echo ""
read -p "Create all branches? (y/n) " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Aborted."
    exit 0
fi

# Get current commit hash (base for all branches)
BASE_COMMIT=$(git rev-parse HEAD)
echo "Base commit: $BASE_COMMIT"
echo ""

# Create all branches
for i in "${!BRANCHES[@]}"; do
    BRANCH="${BRANCHES[$i]}"
    DESC="${DESCRIPTIONS[$i]}"

    echo "Creating branch: $BRANCH"

    if git show-ref --verify --quiet "refs/heads/$BRANCH"; then
        echo "  ⚠️  Branch already exists, skipping"
    else
        git branch "$BRANCH" "$BASE_COMMIT"
        echo "  ✅ Created"
    fi
    echo ""
done

echo "=========================================="
echo "✅ All branches created!"
echo "=========================================="
echo ""
echo "Next steps:"
echo "1. Check out each branch: git checkout <branch-name>"
echo "2. Implement minimal demo for that approach"
echo "3. Create shell.nix with dependencies"
echo "4. Test on NixOS + niri (Wayland)"
echo "5. Push to remote: git push -u origin <branch-name>"
echo ""
echo "Recommended order (by priority):"
echo "  🔥🔥 HIGH: claude/tauri-rdev-$SESSION_ID (easiest migration)"
echo "  🔥🔥 HIGH: claude/raylib-rdev-$SESSION_ID (maximum performance)"
echo "  🔥   MED:  claude/bevy-rdev-$SESSION_ID (modern game engine)"
echo "  🟡   MED:  claude/gtk4-layer-shell-$SESSION_ID (perfect Wayland)"
echo "  🟡   MED:  claude/slint-rdev-$SESSION_ID (declarative UI)"
echo "  🟡   MED:  claude/dioxus-rdev-$SESSION_ID (React-like)"
echo "  🟢   LOW:  claude/wgpu-winit-rdev-$SESSION_ID (low-level graphics)"
echo "  🟢   LOW:  claude/neutralino-evdev-$SESSION_ID (tiny binary)"
echo ""
