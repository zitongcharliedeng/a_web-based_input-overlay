{ pkgs ? import <nixpkgs> {} }:

pkgs.mkShell {
  name = "wgpu-input-overlay";
  
  buildInputs = with pkgs; [
    # Rust toolchain
    rustup
    cargo
    rustc

    # Graphics libraries
    libxkbcommon
    libxcb
    libxkb
    xorg.libX11
    xorg.libXrandr
    xorg.libXinerama
    xorg.libXcursor
    xorg.libXi
    xorg.libXxf86vm
    pkg-config
    
    # Wayland support
    wayland
    libwayland
    wayland-protocols
    
    # Development tools
    cargo-watch
    rust-analyzer
    
    # Input devices (required for evdev)
    libevdev
    systemd  # For libudev headers
  ];

  # Set environment variables
  shellHook = ''
    export LD_LIBRARY_PATH=${pkgs.lib.makeLibraryPath [
      pkgs.libxkbcommon
      pkgs.libxcb
      pkgs.libxkb
      pkgs.xorg.libX11
      pkgs.wayland
      pkgs.libwayland
      pkgs.libevdev
      pkgs.systemd
    ]}:$LD_LIBRARY_PATH
    
    export PKG_CONFIG_PATH=${pkgs.lib.makeSearchPathOutput "lib" "pkgconfig" [
      pkgs.wayland
      pkgs.libwayland
      pkgs.libevdev
    ]}:$PKG_CONFIG_PATH
    
    echo "wgpu-input-overlay dev environment loaded"
    echo "To build: cargo build --release"
    echo "To run:   cargo run --release"
    echo ""
    echo "Note: evdev requires user to be in 'input' group:"
    echo "  sudo usermod -aG input \$USER"
  '';
}
