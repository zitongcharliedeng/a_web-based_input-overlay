{ pkgs ? import <nixpkgs> {} }:

let
  # All X11 libraries needed by uiohook-napi
  x11Libs = with pkgs.xorg; [
    libX11
    libXtst
    libXrandr
    libXt
    libXext
    libXinerama
  ];

  runtimeLibs = x11Libs ++ [ pkgs.stdenv.cc.cc.lib ];
  rpath = pkgs.lib.makeLibraryPath runtimeLibs;

in pkgs.mkShell {
  buildInputs = with pkgs; [
    nodejs
    electron
    patchelf
    typescript
  ] ++ runtimeLibs;

  # For nix-ld compatibility (if user has it enabled)
  NIX_LD_LIBRARY_PATH = rpath;
  NIX_LD = pkgs.lib.fileContents "${pkgs.stdenv.cc}/nix-support/dynamic-linker";

  shellHook = ''
    echo "=== Analog Keyboard Overlay Dev Environment ==="

    # Patch existing .node binaries
    patch_node_binaries() {
      local count=0
      if [ -d "node_modules" ]; then
        while IFS= read -r -d "" nodefile; do
          if patchelf \
            --set-interpreter "$(cat ${pkgs.stdenv.cc}/nix-support/dynamic-linker)" \
            --set-rpath "${rpath}" \
            "$nodefile" 2>/dev/null; then
            ((count++))
            echo "  ✓ Patched: $nodefile"
          fi
        done < <(find node_modules -name "*.node" -type f -print0 2>/dev/null)
        echo "Patched $count .node binaries"
      else
        echo "No node_modules found (run npm install first)"
      fi
    }

    # Wrapper for npm that auto-patches after install
    npm() {
      command npm "$@"
      local exit_code=$?
      if [[ "$1" == "install" || "$1" == "i" || "$1" == "rebuild" ]] && [ $exit_code -eq 0 ]; then
        echo ""
        echo "Auto-patching native modules..."
        patch_node_binaries
      fi
      return $exit_code
    }

    export -f patch_node_binaries

    # Patch existing modules if present
    if [ -d "node_modules" ]; then
      echo "Checking for native modules to patch..."
      patch_node_binaries
      echo ""
    fi

    echo "Commands:"
    echo "  npm install          - Install and auto-patch dependencies"
    echo "  npm rebuild          - Rebuild and auto-patch native modules"
    echo "  npx tsc              - Compile TypeScript"
    echo "  electron .           - Run the overlay"
    echo "  ./run.sh             - Run with default flags"
    echo "  ./run-x11.sh         - Run in X11 mode (recommended for uiohook)"
    echo "  patch_node_binaries  - Manually re-patch .node files"
    echo ""
  '';
}
