{ pkgs ? import <nixpkgs> {} }:

let
  # Required libraries for global input listening (rdev)
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
    # Frontend
    nodejs
    typescript

    # Tauri backend (Rust)
    cargo
    rustc
    rust-analyzer

    # Build tools
    patchelf
    python3
    pkg-config
  ] ++ runtimeLibs;

  # For nix-ld compatibility (if user has it enabled)
  NIX_LD_LIBRARY_PATH = rpath;
  NIX_LD = pkgs.lib.fileContents "${pkgs.stdenv.cc}/nix-support/dynamic-linker";

  shellHook = ''
    echo "=== Analog Keyboard Overlay (Tauri + rdev) Dev Environment ==="
    echo ""
    echo "Frontend Commands:"
    echo "  npm install          - Install web dependencies"
    echo "  npm run tauri dev    - Run Tauri dev server with hot reload"
    echo "  npm run tauri build  - Build Tauri app for distribution"
    echo ""
    echo "Rust/Cargo Commands:"
    echo "  cargo build          - Build Rust backend"
    echo "  cargo check          - Type-check Rust code"
    echo "  cargo fmt            - Format Rust code"
    echo ""
  '';
}
