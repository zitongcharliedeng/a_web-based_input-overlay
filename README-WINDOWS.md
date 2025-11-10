# Quick Setup - Windows

## Step 1: Install Prerequisites

1. **Node.js**: Download from [nodejs.org](https://nodejs.org/) (includes npm)
2. **Git**: Download from [git-scm.com](https://git-scm.com/download/win)

## Step 2: Clone Repository

Open **PowerShell** and run:

```powershell
git clone https://github.com/zitongcharliedeng/a_web-based_input-overlay.git
cd a_web-based_input-overlay
git checkout uiohook-attempt
```

## Step 3: Run Test Script

```powershell
.\run-windows.ps1
```

That's it! The script will:
- Pull latest code
- Install dependencies
- Launch both web and Electron versions

## What You'll See

Two windows will open:
1. **Browser tab** - Web version (for comparison)
2. **Electron window** - Overlay app

## The Test

Press **W, A, S, D** keys:
- **While focused** (click on window first) → Should work
- **While unfocused** (Alt+Tab to Notepad, then press keys) → Does it still work?

**Report**: Which version (browser/Electron) captures keys when unfocused?

## Troubleshooting

### "cannot be loaded because running scripts is disabled"

PowerShell execution policy issue. Run:

```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

Then try `.\run-windows.ps1` again.

### Use Command Prompt instead

If PowerShell doesn't work, use **Command Prompt**:

```cmd
run-windows.bat
```

### Manual Installation

```powershell
npm install
npm run start:win
```

## What's Being Tested?

We need to know if Electron's DOM events work when the window is unfocused on Windows. If they do, we can remove the `uiohook-napi` dependency and simplify the codebase.

See [TESTING.md](TESTING.md) for detailed test procedures and result reporting.
