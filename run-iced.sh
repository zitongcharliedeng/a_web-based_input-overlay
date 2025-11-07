#!/usr/bin/env bash
# Launcher script for Iced + evdev input overlay on NixOS

set -e

echo "Building Iced + evdev input overlay..."

# Use nix-shell to ensure proper environment
nix-shell shell-iced.nix --run "
  set -e

  echo 'Checking permissions for evdev access...'

  # Check if user is in input group
  if ! groups | grep -q input; then
    echo 'ERROR: User is not in the input group!'
    echo 'Run: sudo usermod -aG input \$USER'
    echo 'Then log out and back in to activate the group membership'
    exit 1
  fi

  echo 'Compiling Iced overlay...'
  cargo build --release

  echo 'Launching overlay (global input capture enabled)...'
  export RUST_LOG=info
  ./target/release/input-overlay
"
