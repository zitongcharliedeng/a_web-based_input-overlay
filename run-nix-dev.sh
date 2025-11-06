#!/usr/bin/env bash
# NixOS runner with DevTools enabled
nix-shell -p nodejs electron --run "electron . --enable-logging"
