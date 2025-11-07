{
  inputs = {
    nixpkgs.url = "nixpkgs";
    flake-utils.url = "github:numtide/flake-utils";
    rust-overlay.url = "github:oxalica/rust-overlay";
  };

  outputs = { self, nixpkgs, flake-utils, rust-overlay }:
    flake-utils.lib.eachDefaultSystem (system:
      let
        pkgs = import nixpkgs {
          inherit system;
          overlays = [ rust-overlay.overlays.default ];
        };

        toolchain = pkgs.rust-bin.fromRustupToolchainFile ./rust-toolchain.toml;

        packages = with pkgs; [
          cargo
          cargo-tauri
          toolchain
          rust-analyzer-unwrapped
          nodejs
          typescript
        ];

        nativeBuildPackages = with pkgs; [
          pkg-config
          gobject-introspection
          cargo-tauri
          openssl
          libevdev
          autoconf
          automake
          libtool
          pango
          pango.dev
          webkitgtk_4_1
          gtk3.dev
          gdk-pixbuf.dev
        ] ++ (with pkgs.xorg; [
          libX11
          libXtst
          libXrandr
          libXt
          libXext
          libXinerama
          libXi
        ]);

        libraries = with pkgs; [
          at-spi2-atk      # Accessibility support (Tauri v2)
          atkmm            # ATK C++ bindings
          cairo            # 2D graphics
          gdk-pixbuf       # Image loading
          glib             # Core utilities
          gtk3             # GUI toolkit
          harfbuzz         # Text shaping
          librsvg          # SVG rendering
          libsoup_3        # HTTP client (required for Tauri v2)
          pango            # Text layout
          webkitgtk_4_1    # Web rendering engine
          openssl          # Cryptography
        ];

        rdevLibs = with pkgs.xorg; [
          libX11
          libXtst
          libXrandr
          libXt
          libXext
          libXinerama
        ];

      in {
        devShells.default = pkgs.mkShell {
          buildInputs = packages;
          nativeBuildInputs = nativeBuildPackages ++ rdevLibs;
          shellHook = with pkgs; ''
            export LD_LIBRARY_PATH="${lib.makeLibraryPath (libraries ++ rdevLibs)}:$LD_LIBRARY_PATH"
            export OPENSSL_INCLUDE_DIR="${openssl.dev}/include/openssl"
            export OPENSSL_LIB_DIR="${openssl.out}/lib"
            export OPENSSL_ROOT_DIR="${openssl.out}"
            export RUST_SRC_PATH="${toolchain}/lib/rustlib/src/rust/library"

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
        };
      });
}
