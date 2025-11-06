#!/usr/bin/env bash
# NixOS runner script - uses system Electron from nixpkgs (native Wayland)
nix-shell -p nodejs electron --run "electron ."
