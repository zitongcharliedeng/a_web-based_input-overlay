{ pkgs ? import <nixpkgs> {} }:

pkgs.mkShell {
  name = "input-overlay-iced";
  buildInputs = with pkgs; [
    # Rust toolchain
    rustc
    cargo
    rust-analyzer

    # System dependencies
    pkg-config
    libxkbcommon

    # Wayland support
    wayland
    libxcb
    xorg.libX11
    xorg.libxcb

    # For GTK4 (if needed as fallback)
    gtk4
    libadwaita
    glib
    libsecret

    # Build tools
    clang
    llvm
    gcc

    # Development tools
    helix
    git
    openssl
  ];

  shellHook = ''
    export RUST_LOG=info
    export LD_LIBRARY_PATH=${pkgs.lib.makeLibraryPath [
      pkgs.libxkbcommon
      pkgs.wayland
      pkgs.libxcb
      pkgs.xorg.libX11
      pkgs.gtk4
      pkgs.libadwaita
    ]}:$LD_LIBRARY_PATH

    echo "Iced + evdev development environment loaded"
    echo "Run: cargo build"
    echo "Run: ./run-iced.sh"
  '';
}
