{ pkgs ? import <nixpkgs> {} }:

let
  runtimeLibs = with pkgs; [
    stdenv.cc.cc.lib
    glib
    xorg.libX11
    xorg.libXtst
    xorg.libXrandr
  ];

  rpath = pkgs.lib.makeLibraryPath runtimeLibs;

in pkgs.mkShell {
  buildInputs = with pkgs; [
    nodejs
    patchelf
    python3
  ] ++ runtimeLibs;

  NIX_LD_LIBRARY_PATH = rpath;
  NIX_LD = pkgs.lib.fileContents "${pkgs.stdenv.cc}/nix-support/dynamic-linker";

  shellHook = ''
    echo "=== Analog Keyboard Overlay (Neutralino + evdev) ==="
    echo ""
    echo "Quick Start:"
    echo "  npm install          - Install dependencies"
    echo "  npm start            - Run overlay server"
    echo "  npm start:dev        - Run in development mode"
    echo ""
    echo "Then open http://localhost:9000 in your browser"
    echo ""

    # Auto-patch native modules
    patch_node_binaries() {
      local count=0
      if [ -d "node_modules" ]; then
        while IFS= read -r -d "" nodefile; do
          if patchelf --set-rpath "${rpath}" "$nodefile" 2>/dev/null; then
            ((count++))
          fi
        done < <(find node_modules -name "*.node" -type f -print0 2>/dev/null)
        if [ $count -gt 0 ]; then
          echo "Patched $count .node binaries"
        fi
      fi
    }

    npm() {
      command npm "$@"
      local exit_code=$?
      if [[ "$1" == "install" || "$1" == "i" || "$1" == "rebuild" ]] && [ $exit_code -eq 0 ]; then
        patch_node_binaries
      fi
      return $exit_code
    }

    export -f patch_node_binaries

    if [ -d "node_modules" ]; then
      patch_node_binaries
    fi
  '';
}
