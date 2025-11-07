# wgpu Input Overlay: Complete Build Guide

## Quick Start

### 1. Install Rust
```bash
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
```

### 2. Set input permissions
```bash
sudo usermod -aG input $USER
# Log out and back in
```

### 3. Build
```bash
cargo build --release
```

### 4. Run
```bash
RUST_LOG=info ./target/release/wgpu-overlay
```

---

## Platform-Specific Instructions

### NixOS (Recommended)

**Shell environment:**
```bash
nix-shell
```

**Build inside nix-shell:**
```bash
cargo build --release
```

**Or use launcher:**
```bash
./run.sh  # Automatically detects and uses nix-shell
```

### Ubuntu/Debian

**Install dependencies:**
```bash
sudo apt-get install -y \
  rustc cargo \
  libssl-dev pkg-config \
  libwayland-dev libxkbcommon-dev \
  libxcb-render0-dev libxcb-shape0-dev libxcb-xfixes0-dev \
  libevdev-dev libudev-dev
```

**Build:**
```bash
cargo build --release
```

### Fedora/RHEL

**Install dependencies:**
```bash
sudo dnf install -y \
  rust cargo \
  wayland-devel libxkbcommon-devel \
  libxcb-devel libxkb-devel \
  libevdev-devel systemd-devel
```

**Build:**
```bash
cargo build --release
```

### macOS

**Install dependencies:**
```bash
brew install rust
# Metal support is built-in
```

**Build:**
```bash
cargo build --release
```

### Windows

**Install Rust:**
```bash
rustup-init.exe
# Choose MSVC toolchain
```

**Build:**
```bash
cargo build --release
```

Note: evdev unavailable on Windows (would need uiohook-napi fallback)

---

## Development Workflow

### Watch mode (auto-rebuild)
```bash
cargo watch -x run
```

### With logging
```bash
RUST_LOG=debug cargo watch -x run
```

### Debug build (faster compile, slower runtime)
```bash
cargo build
./target/debug/wgpu-overlay
```

### With debugger (lldb)
```bash
rust-lldb target/release/wgpu-overlay
(lldb) run
(lldb) bt  # Backtrace on crash
```

### With profiler (Linux perf)
```bash
perf record -F 99 ./target/release/wgpu-overlay
perf report
```

---

## Release Building

### Optimized binary
```bash
cargo build --release
# ~80MB with debug symbols
```

### Strip symbols for size
```bash
strip target/release/wgpu-overlay
# ~40MB after stripping
```

### Maximum optimization
Edit Cargo.toml [profile.release]:
```toml
[profile.release]
opt-level = 3
lto = true
codegen-units = 1
strip = true
```

Then rebuild:
```bash
cargo build --release
```

---

## Troubleshooting

### "Cannot open /dev/input/event*"
**Cause:** Not in input group

**Fix:**
```bash
sudo usermod -aG input $USER
# Log out and back in
groups  # Should include 'input'
```

### "wgpu::Error: GetCurrentTexture"
**Cause:** Display server issue

**Fix:**
- Check: `echo $DISPLAY` or `echo $WAYLAND_DISPLAY`
- Ensure Wayland/X11 running properly
- Update GPU drivers

### "No adapters found"
**Cause:** GPU drivers not installed

**Fix:**
- Verify: `vulkaninfo` (Linux) or `dxdiag` (Windows)
- Update GPU drivers

### "Library not found: libwayland"
**Cause:** Missing development libraries

**Fix - NixOS:**
```bash
nix-shell
```

**Fix - Ubuntu/Debian:**
```bash
sudo apt-get install libwayland-dev libxkbcommon-dev
```

### Slow first build
**Normal:** 2-5 minutes (shader compilation)
**Subsequent:** 10-30 seconds

**Speed up:**
```bash
# Use mold linker
RUSTFLAGS="-C link-arg=-fuse-ld=mold" cargo build --release
```

---

## Deployment

### Single binary distribution
```bash
scp target/release/wgpu-overlay user@remote:/usr/local/bin/
ssh user@remote 'wgpu-overlay &'
```

### With script
```bash
mkdir wgpu-overlay-release/{bin,docs}
cp target/release/wgpu-overlay wgpu-overlay-release/bin/
cp run.sh WGPU_ARCHITECTURE.md wgpu-overlay-release/
tar czf wgpu-overlay-release.tar.gz wgpu-overlay-release/
```

---

## Testing

### Visual test
```bash
./target/release/wgpu-overlay
# Look for:
# - Transparent background
# - Green quad when pressing W
# - No crash on other keys
```

### Performance validation
```bash
RUST_LOG=info ./target/release/wgpu-overlay 2>&1 | grep Frame
# Should show <5ms per frame
```

---

*For detailed architecture, see WGPU_ARCHITECTURE.md*
