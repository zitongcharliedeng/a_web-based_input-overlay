{ pkgs ? import <nixpkgs> {} }:

pkgs.mkShell {
  buildInputs = with pkgs; [
    cargo
    rustc
    rust-analyzer
    pkg-config

    # Required for Slint
    libxkbcommon
    libxcb
    libxrandr
    libXinerama
    libXxf86vm
    libXcursor
    libXi
    libXext
    libX11
    xorg.libxcb

    # Required for Wayland
    wayland
    libxkbcommon
    wayland-protocols

    # For evdev polling
    libc

    # Development tools
    just
    lldb
  ];

  shellHook = ''
    echo "=== Slint + evdev Input Overlay Development ==="
    echo ""
    echo "Available commands:"
    echo "  cargo build              - Build debug version"
    echo "  cargo run                - Run overlay"
    echo "  cargo build --release    - Build optimized release"
    echo "  cargo check              - Quick syntax check"
    echo ""
    echo "Requirements:"
    echo "  - User must be in 'input' group: sudo usermod -aG input \$USER"
    echo "  - Running on Wayland (niri, GNOME, KDE, Hyprland, etc.)"
    echo ""
  '';
}
