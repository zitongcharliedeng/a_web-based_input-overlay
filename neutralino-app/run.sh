#!/bin/bash
set -e

# Neutralino + evdev Overlay Launcher Script
# Automatically sets up environment and launches the server

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_NAME="analog-keyboard-overlay"
DEFAULT_PORT=9000
BROWSER_CMD=""

# Color output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}$PROJECT_NAME (Neutralino + evdev)${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Check Node.js
if ! command -v node &> /dev/null; then
  if command -v nix-shell &> /dev/null; then
    echo -e "${YELLOW}Node.js not found, entering nix-shell...${NC}"
    cd "$SCRIPT_DIR"
    nix-shell --run "bash $0"
    exit $?
  else
    echo -e "${RED}✗ Node.js is required!${NC}"
    echo "Install from: https://nodejs.org"
    exit 1
  fi
fi

echo -e "${GREEN}✓ Node.js $(node --version)${NC}"

# Check dependencies
if [ ! -d "$SCRIPT_DIR/node_modules" ]; then
  echo -e "${YELLOW}Installing dependencies...${NC}"
  cd "$SCRIPT_DIR"
  npm install
  echo ""
fi

# Check evdev specifically
if ! npm list evdev &>/dev/null; then
  echo -e "${RED}✗ evdev npm package not installed${NC}"
  echo "Install with: npm install evdev"
  exit 1
fi

echo -e "${GREEN}✓ evdev npm package installed${NC}"

# Check permissions for evdev
if [[ "$OSTYPE" == "linux-gnu" ]]; then
  if ! groups | grep -q input; then
    echo -e "${YELLOW}⚠️  Not in 'input' group (required for evdev)${NC}"
    echo "Fix with: sudo usermod -aG input $USER"
    echo "(You may need to log out and back in)"
    echo ""
  else
    echo -e "${GREEN}✓ User in 'input' group (evdev access OK)${NC}"
  fi
fi

echo ""

# Determine port
PORT=${1:-$DEFAULT_PORT}
if [[ ! "$PORT" =~ ^[0-9]+$ ]] || [ "$PORT" -lt 1024 ] || [ "$PORT" -gt 65535 ]; then
  PORT=$DEFAULT_PORT
fi

echo -e "${BLUE}Starting server on port $PORT...${NC}"
echo "Open in browser: ${BLUE}http://localhost:$PORT${NC}"
echo ""
echo "Press Ctrl+C to stop"
echo ""

# Start server
cd "$SCRIPT_DIR"
NODE_ENV=production node server.js --port "$PORT"
