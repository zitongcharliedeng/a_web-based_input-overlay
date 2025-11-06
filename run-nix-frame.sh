#!/usr/bin/env bash
# NixOS runner with frame enabled (for debugging)
# Temporarily modifies main.js to enable frame
sed -i 's/frame: false/frame: true/' main.js
nix-shell -p nodejs electron --run "electron ."
sed -i 's/frame: true/frame: false/' main.js
