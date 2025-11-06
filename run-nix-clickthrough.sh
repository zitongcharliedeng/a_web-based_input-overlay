#!/usr/bin/env bash
# NixOS runner with click-through enabled (native Wayland)
nix-shell -p nodejs electron --run "electron . --click-through"
