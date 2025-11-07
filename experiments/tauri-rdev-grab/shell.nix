{ pkgs ? import <nixpkgs> {} }:

pkgs.mkShell {
  buildInputs = with pkgs; [
    # Rust toolchain
    rustup
    cargo
    rustc

    # Build essentials
    pkg-config
    gcc
    gnumake

    # Linux development headers
    xorg.libX11
    xorg.libXrandr
    xorg.libXinerama
    xorg.libXcursor
    xorg.libXxf86vm

    # Wayland development
    wayland
    libxkbcommon

    # Input device libraries
    libevdev
    libinput

    # Development tools
    just
    tokio  # Runtime for async
  ];

  shellHook = ''
    echo "╔═════════════════════════════════════════════════════════════╗"
    echo "║  rdev::grab() Wayland Test Environment (NixOS)             ║"
    echo "╚═════════════════════════════════════════════════════════════╝"
    echo ""
    echo "Build commands:"
    echo "  cargo build          - Debug build"
    echo "  cargo build --release - Release build (optimized)"
    echo "  ./run.sh             - Build and run test"
    echo ""
    echo "To run with logging:"
    echo "  RUST_LOG=debug ./run.sh"
    echo ""
  '';
}
