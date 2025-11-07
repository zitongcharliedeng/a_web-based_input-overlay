# Nix development shell for Tauri + rdev overlay
# Run with: nix-shell shell-tauri.nix

{ pkgs ? import <nixpkgs> {} }:

pkgs.mkShell {
  buildInputs = with pkgs; [
    # Rust toolchain
    rustc
    cargo
    rustfmt
    clippy

    # Node.js for frontend (if needed for build steps)
    nodejs

    # Tauri dependencies (Linux)
    pkg-config
    openssl

    # WebKitGTK for Tauri's webview
    webkitgtk_4_1

    # GTK3 for window management
    gtk3

    # Additional libraries for Wayland/X11
    libsoup_3
    glib
    glib-networking
    cairo
    pango
    gdk-pixbuf
    atk

    # Display server libraries
    xorg.libX11
    xorg.libxcb
    xorg.libXcursor
    xorg.libXrandr
    xorg.libXi
    wayland

    # For rdev (input capture)
    libevdev
  ];

  # Environment variables
  shellHook = ''
    echo "Tauri + rdev development environment"
    echo "====================================="
    echo ""
    echo "Available commands:"
    echo "  cargo build          - Build Rust backend"
    echo "  cargo run            - Run the application"
    echo "  ./run-tauri.sh       - Run with custom flags"
    echo ""
    echo "Rust version: $(rustc --version)"
    echo "Cargo version: $(cargo --version)"
    echo "Node version: $(node --version)"
    echo ""
    echo "Note: You must be in the 'input' group for global input capture:"
    echo "  sudo usermod -aG input $USER"
    echo "  (then log out and back in)"
    echo ""
  '';

  # Required for Tauri
  LD_LIBRARY_PATH = "${pkgs.lib.makeLibraryPath [
    pkgs.webkitgtk_4_1
    pkgs.gtk3
    pkgs.cairo
    pkgs.gdk-pixbuf
    pkgs.glib
    pkgs.pango
    pkgs.libsoup_3
    pkgs.openssl
  ]}";

  # Set GTK version
  WEBKIT_DISABLE_COMPOSITING_MODE = "1";
}
