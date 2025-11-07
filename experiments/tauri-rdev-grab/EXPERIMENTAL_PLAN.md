# EXPERIMENTAL: rdev::grab() Wayland Test - Execution Plan

## Project Overview

**Goal:** Definitively test whether rdev's `unstable_grab` feature works for global input capture on Wayland.

**Current Status:** READY FOR EXECUTION

**Repository:** `/home/user/a_web-based_input-overlay/experiments/tauri-rdev-grab/`

---

## What This Test Does

### The Question
> "Does rdev::grab() actually capture input globally (unfocused) on Wayland, as claimed?"

### The Test
1. Calls `rdev::grab()` with `unstable_grab` feature enabled
2. Prints all captured keyboard/mouse/wheel events
3. User tests by:
   - Typing while window is focused (should see events) ✓ Expected
   - Clicking outside to unfocus window
   - Typing while window is unfocused
   - Check if events still appear

### The Result
- **✓ WORKS** - Events continue while unfocused → rdev claims are TRUE
- **✗ BROKEN** - Events stop when unfocused → rdev claims are FALSE

---

## Execution Roadmap

### Phase 1: Prerequisites (5 min)
```bash
# 1. Verify Wayland
echo $XDG_SESSION_TYPE          # Should output: wayland

# 2. Check input group membership
groups | grep input             # Should show: input

# 3. If not in input group:
sudo usermod -aG input $USER
# Log out completely and log back in

# 4. Verify
groups | grep input             # Should now work
```

### Phase 2: Build (5 min)
```bash
cd /home/user/a_web-based_input-overlay/experiments/tauri-rdev-grab/

# On NixOS:
nix-shell shell.nix --run "cargo build"

# On other systems:
cargo build
```

### Phase 3: Execute Test (2-5 min)
```bash
# Run the test
RUST_LOG=info ./target/debug/tauri-rdev-test

# Or use convenience script:
./run.sh
```

### Phase 4: Test Critical Phase (1-2 min)
While test is running:
1. See events printed (window focused)
2. **CLICK OUTSIDE WINDOW** to unfocus
3. Press keys: W, A, S, D, Space, etc.
4. Move mouse around
5. Click mouse buttons
6. **OBSERVE:** Do you still see events?

### Phase 5: Document Results (5 min)
```bash
# Edit TEST_RESULTS.md
# Fill in:
# - Date tested
# - System info
# - WORKS or BROKEN result
# - Observations

# Commit findings
git add TEST_RESULTS.md
git commit -m "test: rdev::grab() Wayland test - [WORKS|BROKEN]"
```

---

## Expected Scenarios

### Scenario A: Test Succeeds - Events Continue (30% probability)

```
Terminal output:
  [Event 1] KEY PRESS: KeyW
  [Event 2] KEY RELEASE: KeyW
  [Event 3] MOUSE MOVE: (1280, 720)
  [Event 4] KEY PRESS: KeyS          ← While window UNFOCUSED
  [Event 5] KEY RELEASE: KeyS
  [Event 6] MOUSE MOVE: (1280, 800)
  ... (continues)

Result: ✓ rdev WORKS

Implication:
  - rdev's Wayland support is real
  - Could use for cross-platform overlay
  - Consider refactoring project to use rdev
  - Would simplify architecture significantly
```

### Scenario B: Test Fails - Events Stop (65% probability)

```
Terminal output:
  [Event 1] KEY PRESS: KeyW
  [Event 2] KEY RELEASE: KeyW
  [Event 3] MOUSE MOVE: (1280, 720)
  ⏱️  [3] Still grabbing...
  ⏱️  [3] Still grabbing...
  ... (no new events even though you're typing)

Result: ✗ rdev BROKEN

Implication:
  - rdev's Wayland claims are unsupported
  - Must continue with evdev (proven working)
  - Validates our architecture decision
  - Document findings for rdev maintainers
```

### Scenario C: Test Fails - Can't Start (5% probability)

```
Terminal output:
  ERROR: rdev::grab() FAILED with error: Permission denied

  Reason: User not in 'input' group

Result: ✗ Setup Issue

Solution:
  sudo usermod -aG input $USER
  Log out and back in completely
  Try again
```

---

## File Manifest

Complete list of test files created:

```
experiments/tauri-rdev-grab/
├── .gitignore                 # Git ignores (target/, Cargo.lock, etc.)
├── Cargo.toml                 # Rust dependencies (rdev + unstable_grab)
├── shell.nix                  # NixOS dev environment
├── run.sh                     # Build and run script (executable)
│
├── src/
│   └── main.rs               # Complete test implementation (450+ lines)
│
├── Documentation/
│   ├── INDEX.md              # File organization and reading guide
│   ├── QUICK_START.md        # 30-second version (start here!)
│   ├── SETUP.md              # Detailed setup guide
│   ├── README.md             # Full documentation
│   ├── COMPARISON.md         # rdev vs evdev analysis
│   ├── RDEV_INVESTIGATION.md # Technical deep dive
│   ├── TEST_RESULTS.md       # Results template (to fill after test)
│   └── EXPERIMENTAL_PLAN.md  # This file
│
└── [After testing]
    └── TEST_RESULTS.md       # Filled with your findings
```

**Total:** ~60 KB of code and documentation

---

## Documentation Map

### For Different Readers

**Just want to run it?**
- Read: `QUICK_START.md` (2 min)
- Then: `./run.sh`

**Need detailed setup?**
- Read: `SETUP.md` (15 min)
- Follow: Step-by-step instructions
- Then: `./run.sh`

**Want to understand what this is?**
- Read: `README.md` (overview)
- Read: `COMPARISON.md` (why it matters)
- Read: `RDEV_INVESTIGATION.md` (technical details)

**Need to record results?**
- After test: Edit `TEST_RESULTS.md`
- Use: Template provided
- Commit: To git

**File reference?**
- See: `INDEX.md` (complete file guide)

---

## Success Criteria

### Test Succeeds If
- [ ] Compiles without errors
- [ ] Runs without crashing
- [ ] Prints help message explaining test
- [ ] Detects Wayland display server
- [ ] Calls rdev::grab() successfully
- [ ] Prints captured events when you type
- [ ] Clear WORKS or BROKEN result visible
- [ ] Results documented in TEST_RESULTS.md

### Test Fails If
- [ ] Build error (fix dependencies)
- [ ] Permission error (fix input group)
- [ ] Runtime crash (investigate logs)
- [ ] Display server not Wayland (switch to Wayland)
- [ ] Results unclear or ambiguous (run again, document better)

---

## Next Actions (After Test Completes)

### If rdev::grab() WORKS (✓)

**Short term:**
1. Document findings in `TEST_RESULTS.md`
2. Create GitHub issue: "rdev::grab() Wayland support verified"
3. Share findings with rdev maintainers
4. Test on other Wayland compositors
5. Test on Windows/macOS (if available)

**Medium term:**
1. Create integration layer for main project
2. Evaluate switching from evdev to rdev
3. Plan refactoring (effort: 2-3 weeks)
4. Update project architecture docs

**Outcome:**
- Simpler codebase (single library)
- Cross-platform support (no fallbacks needed)
- Better community support (library maintained)

### If rdev::grab() BROKEN (✗)

**Short term:**
1. Document findings in `TEST_RESULTS.md`
2. Confirm evdev continues to work
3. Note for rdev maintainers (optional)
4. Validate our architecture choice

**Medium term:**
1. Continue with current evdev implementation
2. Plan Windows/macOS fallback (uiohook-napi)
3. Document cross-platform strategy
4. Update project roadmap

**Outcome:**
- Confirmed: evdev is only Wayland-compatible option
- Confirmed: Our architectural decision was correct
- Understand: rdev claims are marketing vs reality
- Plan: Clear fallback strategy for all platforms

---

## Effort Estimate

| Phase | Task | Time |
|-------|------|------|
| 1 | Prerequisites (input group, Wayland check) | 5 min |
| 2 | Build (cargo build) | 5 min |
| 3 | Execute test | 2-5 min |
| 4 | Critical test phase (unfocused input) | 1-2 min |
| 5 | Document results | 5 min |
| **Total** | **Complete test cycle** | **~20 min** |

**One-time cost:** NixOS setup (~2 min if already in nix-shell)
**Repeat runs:** ~5 min (build already cached)

---

## Resources Provided

### Code
- `src/main.rs` - Complete test implementation
- `Cargo.toml` - Dependency configuration
- `run.sh` - Automated build/run script

### Documentation
- `INDEX.md` - File guide and navigation
- `QUICK_START.md` - 30-second summary
- `SETUP.md` - Detailed setup instructions
- `README.md` - Full project documentation
- `COMPARISON.md` - Architecture analysis
- `RDEV_INVESTIGATION.md` - Technical investigation
- `TEST_RESULTS.md` - Results template

### Configuration
- `shell.nix` - NixOS development environment
- `.gitignore` - Git configuration

### Helpers
- `EXPERIMENTAL_PLAN.md` - This file

**Total documentation:** ~60 KB across 8 documents

---

## Risk Assessment

### Low Risk
- Test won't damage your system
- Just reading input events
- No modifications to system
- Input group permission is intentional

### Medium Risk
- Compilation might fail (fix dependencies)
- Permission errors (fix input group membership)
- Can't be run without Wayland (need to switch)

### High Risk
- None identified (this is a read-only test)

### Mitigation
- Follow `SETUP.md` for prerequisites
- Check all items in prerequisites checklist
- Use NixOS shell for clean environment

---

## Community Impact

If this test is successful:
- **WORKS:** Provides verified Wayland support data for rdev community
- **BROKEN:** Explains why evdev is necessary (helpful for others)

Either result is valuable for:
- Input capture tool developers
- Overlay tool creators
- Linux Wayland ecosystem
- Cross-platform GUI developers

---

## References & Context

### Main Project Files
- `/CLAUDE.md` - Project vision and architecture
- `/browserInputListeners/evdevInput.js` - Current evdev implementation
- `/docs/wayland-input-capture.md` - Wayland capture documentation

### External Resources
- **rdev GitHub:** https://github.com/enigo-rs/rdev
- **rdev unstable_grab:** Feature flag for Wayland support
- **Wayland Protocol:** https://wayland.freedesktop.org/
- **Linux Input Subsystem:** https://www.kernel.org/doc/html/latest/input/input.html

---

## Summary

**What:** Experimental test of rdev::grab() on Wayland
**Why:** Verify if rdev's Wayland claims are true
**How:** Call rdev::grab() and check for unfocused input capture
**When:** Now - test is ready to run
**Where:** `/home/user/a_web-based_input-overlay/experiments/tauri-rdev-grab/`

**Expected outcome:**
- ✓ WORKS - rdev can replace evdev (simplifies architecture)
- ✗ BROKEN - confirms evdev is necessary (validates decision)

**Either way:** Important data for project and community

---

## Getting Started Now

**Fastest path:**

```bash
# 1. Check prerequisites (1 min)
echo $XDG_SESSION_TYPE    # Should be: wayland
groups | grep input       # Should include: input

# 2. Run test (5 min)
cd /home/user/a_web-based_input-overlay/experiments/tauri-rdev-grab/
./run.sh

# 3. Do the critical test:
# - Window focused: Type keys (should see events)
# - Click outside to unfocus
# - Type keys while unfocused (should/shouldn't see events)

# 4. Document results (5 min)
# Edit TEST_RESULTS.md with findings
git add TEST_RESULTS.md
git commit -m "test: rdev::grab() Wayland - [WORKS|BROKEN]"
```

**Time required:** ~20 minutes total

**Questions?** See `INDEX.md` for file guide

---

**Created:** 2025-11-07
**Status:** READY FOR EXECUTION
**Branch:** claude/tauri-rdev-grab-EXPERIMENTAL-011CUsuWKL59fUhcRTTAqAiE

Let's verify rdev's Wayland claims!
