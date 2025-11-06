#!/usr/bin/env bash
# NixOS runner with click-through enabled (XWayland mode)
nix-shell -p nodejs electron --run "ELECTRON_OZONE_PLATFORM_HINT=x11 electron . --click-through"
