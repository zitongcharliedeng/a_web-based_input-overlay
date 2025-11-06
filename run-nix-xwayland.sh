#!/usr/bin/env bash
# NixOS runner script - forces XWayland mode
# Use this if Wayland compositor doesn't keep window visible
nix-shell -p nodejs electron --run "ELECTRON_OZONE_PLATFORM_HINT=x11 electron ."
