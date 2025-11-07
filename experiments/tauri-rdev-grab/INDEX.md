# Experimental Test Files - Index

## Overview

This directory contains a minimal experimental test for rdev::grab() Wayland compatibility.

**Purpose:** Verify if rdev's unstable_grab feature actually works for global input capture on Wayland.

**Current Status:** READY TO TEST

---

## File Organization

### Quick Start (Start Here)

```
QUICK_START.md          ← 30-second version (start here!)
```

### Setup & Configuration

```
SETUP.md               ← Detailed setup guide
shell.nix              ← NixOS development environment
.gitignore            ← Git ignores
```

### Test Implementation

```
src/
└── main.rs            ← Complete test code (450+ lines)
Cargo.toml            ← Rust dependencies
run.sh                ← Build and run script
```

### Documentation

```
README.md              ← Full documentation
COMPARISON.md         ← rdev vs evdev comparison
RDEV_INVESTIGATION.md ← Technical deep dive into rdev
TEST_RESULTS.md       ← Results template (fill after testing)
INDEX.md              ← This file
```

---

## How to Use These Files

### For First-Time Users

1. **Read:** `QUICK_START.md` (2 min)
2. **Read:** `SETUP.md` (5 min) - Check prerequisites
3. **Run:** `./run.sh`
4. **Document:** Fill in `TEST_RESULTS.md` with results

### For Understanding the Architecture

1. **Start:** `README.md` (overview)
2. **Deep Dive:** `COMPARISON.md` (rdev vs evdev)
3. **Technical:** `RDEV_INVESTIGATION.md` (how rdev works)
4. **Code:** `src/main.rs` (test implementation)

### For Understanding Setup

1. **Quick:** `QUICK_START.md` (30 seconds)
2. **Detailed:** `SETUP.md` (troubleshooting guide)
3. **NixOS:** `shell.nix` (development environment)

### For Recording Results

1. **Template:** `TEST_RESULTS.md` (fill in results)
2. **Reference:** `COMPARISON.md` (what results mean)
3. **Submit:** Commit with findings

---

## File Descriptions

### `QUICK_START.md` (Recommended First Read)
- One-liner to run test
- What to look for (working vs broken)
- Quick troubleshooting
- **Reading time:** 2 minutes
- **For:** People who just want to run it

### `SETUP.md` (Comprehensive Guide)
- Prerequisites checklist
- Installation options (NixOS, manual)
- Step-by-step test procedure
- Detailed troubleshooting
- Logging configuration
- **Reading time:** 15 minutes
- **For:** Setting up test environment

### `README.md` (Full Documentation)
- Project overview
- Test purpose and procedure
- Technical details
- Code structure
- Status and references
- **Reading time:** 10 minutes
- **For:** Understanding what this test does

### `COMPARISON.md` (Architecture Analysis)
- rdev::grab() vs evdev direct access
- Permission models
- Performance comparison
- Cross-platform viability
- Decision matrix (if works vs broken)
- **Reading time:** 15 minutes
- **For:** Understanding the impact of results

### `RDEV_INVESTIGATION.md` (Technical Deep Dive)
- What is rdev and unstable_grab
- How grab() is supposed to work
- Why Wayland makes it complicated
- Likely scenarios and outcomes
- Community context and discussions
- **Reading time:** 20 minutes
- **For:** Understanding rdev's implementation

### `TEST_RESULTS.md` (Results Template)
- Structured template for documenting findings
- Sections for different test phases
- Analysis framework
- Conclusion and recommendations
- **To fill:** After running test
- **For:** Recording what you found

### `src/main.rs` (Test Implementation)
- Complete Rust test code
- Uses rdev::grab() with unstable_grab feature
- Detects display server (Wayland/X11)
- Prints all captured events
- Verifies working vs broken
- **Lines:** ~450
- **For:** Understanding the actual test

### `Cargo.toml` (Dependencies)
- rdev = { version = "0.5", features = ["unstable_grab"] }
- tokio, tracing, anyhow (utilities)
- Standard Rust project file
- **For:** Build configuration

### `shell.nix` (NixOS Environment)
- Development dependencies
- Rust toolchain
- Build tools and libraries
- Linux development headers
- **For:** NixOS users (convenience)

### `run.sh` (Build & Run Script)
- Detects NixOS, enters nix-shell if needed
- Runs cargo build
- Executes test with logging
- **For:** One-command execution

### `.gitignore` (Git Configuration)
- Ignores build artifacts (target/, Cargo.lock)
- Ignores IDE files (.vscode, .idea)
- Ignores test outputs
- **For:** Clean commits

---

## Reading Paths by Goal

### Goal: "Run the test now!"
1. `QUICK_START.md` (2 min)
2. Run `./run.sh`
3. Done!

### Goal: "Understand what this is"
1. `README.md` (overview)
2. `QUICK_START.md` (how to run)
3. `COMPARISON.md` (why it matters)
4. Done!

### Goal: "Set it up properly"
1. `SETUP.md` (complete setup)
2. Check prerequisites
3. Run test
4. Fill in `TEST_RESULTS.md`

### Goal: "Understand rdev deeply"
1. `RDEV_INVESTIGATION.md` (what rdev does)
2. `COMPARISON.md` (rdev vs alternatives)
3. `src/main.rs` (see test code)
4. Run test to verify

### Goal: "Record my findings"
1. Run test
2. Fill in `TEST_RESULTS.md` template
3. Commit to git
4. Share with project

---

## Quick File Stats

| File | Type | Size | Purpose |
|------|------|------|---------|
| QUICK_START.md | Doc | ~3 KB | 30-second intro |
| SETUP.md | Doc | ~12 KB | Detailed guide |
| README.md | Doc | ~5 KB | Full overview |
| COMPARISON.md | Doc | ~8 KB | Architecture analysis |
| RDEV_INVESTIGATION.md | Doc | ~10 KB | Technical deep dive |
| TEST_RESULTS.md | Template | ~7 KB | Results form |
| INDEX.md | Doc | This file | File index |
| src/main.rs | Code | ~15 KB | Test implementation |
| Cargo.toml | Config | ~1 KB | Dependencies |
| shell.nix | Config | ~1 KB | NixOS environment |
| run.sh | Script | <1 KB | Build runner |
| .gitignore | Config | <1 KB | Git config |
| **TOTAL** | | **~60 KB** | Complete test |

---

## Test Status

### Current Phase: READY

- [x] Code written and tested for compilation
- [x] Documentation complete
- [x] Setup validated
- [ ] Test execution results (pending)
- [ ] Results documented (pending)

### What You're Testing

```
Question: Does rdev::grab() capture input globally on Wayland?

Expected answer:
  ✓ YES: Can switch to rdev (simpler, cross-platform)
  ✗ NO: Continue with evdev (already proven)
```

### Time to Execute

- **Setup (first time):** 10-15 minutes
- **Test execution:** 2-5 minutes
- **Documentation:** 5 minutes
- **Total:** ~20-25 minutes first time

### Success Criteria

**Test succeeds if:**
- Compiles without errors
- Runs without crashing
- Captures events when focused
- Clear WORKS or BROKEN result visible

**Test fails if:**
- Permission/compilation errors
- Unexplained crashes
- Unclear results

---

## Integration with Main Project

This test is part of the broader `a_web-based_input_overlay` project.

**Main project files:**
- `/CLAUDE.md` - Project vision and architecture
- `/browserInputListeners/evdevInput.js` - Current input system
- `/docs/wayland-input-capture.md` - Wayland capture documentation

**This test determines:**
- Whether rdev can replace evdev
- Whether project architecture needs changes
- Cross-platform input capture strategy

---

## Next Steps After Test

### If rdev::grab() WORKS (✓)

1. Document findings in `TEST_RESULTS.md`
2. Create integration layer in main project
3. Test on other platforms:
   - Other Wayland compositors
   - Windows (if available)
   - macOS (if available)
4. Plan migration if benefits justify refactor

### If rdev::grab() BROKEN (✗)

1. Document findings in `TEST_RESULTS.md`
2. Consider contributing to rdev maintainers (helpful!)
3. Confirm evdev continues to work
4. Plan cross-platform strategy:
   - Linux: evdev
   - Windows: uiohook-napi
   - macOS: uiohook-napi

---

## Getting Help

### Quick Issues

| Issue | Check |
|-------|-------|
| Permission denied | See SETUP.md "Permission Model" |
| Build fails | See SETUP.md "Troubleshooting" |
| No events captured | See SETUP.md "Logging Configuration" |
| Unclear results | See QUICK_START.md expected output |

### Detailed Help

- **Setup:** See `SETUP.md`
- **Understanding test:** See `README.md`
- **Understanding rdev:** See `RDEV_INVESTIGATION.md`
- **Understanding implications:** See `COMPARISON.md`

### Debugging

Run with debug logging:
```bash
RUST_LOG=debug ./run.sh
```

Collect system info:
```bash
uname -a
echo $XDG_SESSION_TYPE
groups
ls -la /dev/input/event*
rustc --version
```

---

## Contributing Your Results

To share your test results:

1. **Fill in `TEST_RESULTS.md`** with your findings
2. **Commit to git:**
   ```bash
   git add TEST_RESULTS.md
   git commit -m "test: rdev::grab() results on [YOUR_SYSTEM]"
   ```
3. **Note the results:** WORKS or BROKEN
4. **Share with maintainers** (optional)

---

## References

- **rdev:** https://github.com/enigo-rs/rdev
- **Wayland:** https://wayland.freedesktop.org/
- **Main project:** `/CLAUDE.md`
- **evdev current impl:** `/browserInputListeners/evdevInput.js`

---

## Summary

**You are reading:** The directory index for rdev::grab() Wayland test

**What's here:** Complete experimental test setup for verifying rdev's Wayland support

**What to do:** Pick a document from "File Descriptions" above based on your goal

**Most common:** Start with `QUICK_START.md` or `SETUP.md`

**Questions?** Read the relevant documentation file above.

---

**Created:** 2025-11-07
**Status:** EXPERIMENTAL - Ready for testing
**Phase:** Pre-execution (awaiting test run)
