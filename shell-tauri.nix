{ pkgs ? import <nixpkgs> {} }:

pkgs.mkShell {
  buildInputs = with pkgs; [
    rustc cargo rustfmt clippy nodejs pkg-config openssl
    webkitgtk_4_1 gtk3 libsoup_3 glib glib-networking
    cairo pango gdk-pixbuf atk
    xorg.libX11 xorg.libxcb xorg.libXcursor xorg.libXrandr xorg.libXi
    wayland libevdev
  ];

  shellHook = ''
    echo "Tauri + rdev development environment"
    echo "====================================="
    echo "Rust: $(rustc --version)"
    echo "Cargo: $(cargo --version)"
  '';

  LD_LIBRARY_PATH = "${pkgs.lib.makeLibraryPath [
    pkgs.webkitgtk_4_1 pkgs.gtk3 pkgs.cairo pkgs.gdk-pixbuf
    pkgs.glib pkgs.pango pkgs.libsoup_3 pkgs.openssl
  ]}";

  WEBKIT_DISABLE_COMPOSITING_MODE = "1";
}
