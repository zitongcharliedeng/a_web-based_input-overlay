{ pkgs ? import <nixpkgs> {} }:

pkgs.mkShell {
  buildInputs = with pkgs; [
    # Rust toolchain
    rustc
    cargo
    rustfmt
    clippy

    # Raylib and graphics libraries
    raylib
    libGL
    libGLU

    # X11 libraries (for X11/XWayland support)
    xorg.libX11
    xorg.libXi
    xorg.libXcursor
    xorg.libXrandr
    xorg.libXinerama

    # Wayland libraries
    wayland
    wayland-protocols
    libxkbcommon

    # Build tools
    pkg-config
    cmake
  ];

  shellHook = ''
    echo "Raylib + rdev development environment loaded"
    echo "Rust version: $(rustc --version)"
    echo "Cargo version: $(cargo --version)"
    echo ""
    echo "To build: cargo build --release"
    echo "To run: ./run-raylib.sh"
    echo ""
    echo "Note: You must be in the 'input' group for rdev to work:"
    echo "  sudo usermod -aG input $USER"
    echo "  (logout and login required after adding to group)"
  '';

  # Environment variables for compilation
  LD_LIBRARY_PATH = pkgs.lib.makeLibraryPath [
    pkgs.raylib
    pkgs.libGL
    pkgs.libGLU
    pkgs.xorg.libX11
    pkgs.xorg.libXi
    pkgs.xorg.libXcursor
    pkgs.xorg.libXrandr
    pkgs.xorg.libXinerama
    pkgs.wayland
    pkgs.libxkbcommon
  ];

  # For Raylib compilation
  RAYLIB_INCLUDE_DIR = "${pkgs.raylib}/include";
  RAYLIB_LIB_DIR = "${pkgs.raylib}/lib";
}
