#!/usr/bin/env node
/**
 * Neutralino Backend Server with evdev Integration
 *
 * This server:
 * 1. Captures global input via evdev npm package
 * 2. Provides WebSocket API to Neutralino frontend
 * 3. Handles window management and transparency
 *
 * Launch: node server.js [--port 9000] [--dev]
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const { EventEmitter } = require('events');
const WebSocket = require('ws');

// Try to load evdev npm package
let evdevModule = null;
let useCustomEvdev = false;

try {
  evdevModule = require('evdev');
  console.log('[Server] ✓ Using official evdev npm package');
} catch (error) {
  console.warn('[Server] ⚠️  evdev npm package not available:', error.message);
  console.log('[Server] Falling back to custom evdevInput implementation...');
  try {
    const EvdevInputCapture = require('../browserInputListeners/evdevInput.js');
    evdevModule = EvdevInputCapture;
    useCustomEvdev = true;
    console.log('[Server] ✓ Using custom evdevInput');
  } catch (customError) {
    console.error('[Server] ✗ Neither evdev npm nor custom evdevInput available');
    console.log('[Server] Install: npm install evdev');
    process.exit(1);
  }
}

// Parse command line arguments
const args = process.argv.slice(2);
const portIndex = args.indexOf('--port');
const port = portIndex >= 0 ? parseInt(args[portIndex + 1]) || 9000 : 9000;
const isDev = args.includes('--dev');

console.log(`[Server] Starting backend on port ${port}...`);
console.log(`[Server] Dev mode: ${isDev ? 'enabled' : 'disabled'}`);

// Input capture wrapper
class InputCaptureManager extends EventEmitter {
  constructor() {
    super();
    this.capturing = false;
    this.clients = new Set();
  }

  async start() {
    if (this.capturing) return;

    try {
      if (useCustomEvdev) {
        // Custom evdevInput class
        this.capture = new evdevModule();

        this.capture.on('keypress', (data) => {
          this.broadcast({
            type: 'input:keypress',
            key: data.key,
            pressed: data.pressed,
            timestamp: Date.now()
          });
        });

        this.capture.on('mousemove', (data) => {
          this.broadcast({
            type: 'input:mousemove',
            x: data.x,
            y: data.y,
            deltaX: data.deltaX,
            deltaY: data.deltaY,
            timestamp: Date.now()
          });
        });

        this.capture.on('mousebutton', (data) => {
          this.broadcast({
            type: 'input:mousebutton',
            button: data.buttonName,
            pressed: data.pressed,
            timestamp: Date.now()
          });
        });

        this.capture.on('gamepadaxis', (data) => {
          this.broadcast({
            type: 'input:gamepadaxis',
            axis: data.axisName,
            value: data.normalized,
            rawValue: data.value,
            timestamp: Date.now()
          });
        });

        this.capture.on('gamepadbutton', (data) => {
          this.broadcast({
            type: 'input:gamepadbutton',
            button: data.buttonName,
            pressed: data.pressed,
            timestamp: Date.now()
          });
        });

        await this.capture.start();
        console.log('[Server] ✓ Custom evdevInput capture started');
      } else {
        // Official evdev npm package
        const devices = evdevModule.enumerate();
        console.log(`[Server] Found ${devices.length} input devices`);

        devices.forEach((device) => {
          device.on('data', (event) => {
            this.handleEvdevEvent(event, device);
          });
        });

        console.log('[Server] ✓ evdev npm package capture started');
      }

      this.capturing = true;
      this.broadcast({ type: 'server:input-ready' });
    } catch (error) {
      console.error('[Server] Failed to start input capture:', error.message);
      throw error;
    }
  }

  handleEvdevEvent(event, device) {
    // Parse evdev raw events and normalize to our format
    // evdev event types: 0x00 = EV_SYN, 0x01 = EV_KEY, 0x02 = EV_REL, 0x03 = EV_ABS, 0x04 = EV_MSC

    const eventType = event.type;
    const eventCode = event.code;
    const value = event.value;

    if (eventType === 0x01) {
      // EV_KEY - keyboard/button events
      const keyName = this.getKeyName(eventCode);
      this.broadcast({
        type: 'input:keypress',
        key: keyName,
        code: eventCode,
        pressed: value !== 0,
        timestamp: Date.now()
      });
    } else if (eventType === 0x02) {
      // EV_REL - relative motion (mouse)
      if (eventCode === 0x00) { // REL_X
        this.lastMouseX = (this.lastMouseX || 0) + value;
      } else if (eventCode === 0x01) { // REL_Y
        this.lastMouseY = (this.lastMouseY || 0) + value;
      } else if (eventCode === 0x08) { // REL_WHEEL
        this.broadcast({
          type: 'input:mousewheel',
          delta: value,
          direction: value > 0 ? 'up' : 'down',
          timestamp: Date.now()
        });
      }
    } else if (eventType === 0x03) {
      // EV_ABS - absolute position (gamepad axes, touchscreen)
      const axisName = this.getAxisName(eventCode);
      if (axisName) {
        const normalized = this.normalizeAxis(eventCode, value);
        this.broadcast({
          type: 'input:gamepadaxis',
          axis: axisName,
          value: normalized,
          rawValue: value,
          timestamp: Date.now()
        });
      }
    }
  }

  getKeyName(code) {
    const keyMap = {
      0x01: 'ESC',
      0x02: '1', 0x03: '2', 0x04: '3', 0x05: '4', 0x06: '5',
      0x07: '6', 0x08: '7', 0x09: '8', 0x0A: '9', 0x0B: '0',
      0x0C: 'MINUS', 0x0D: 'EQUAL', 0x0E: 'BACKSPACE',
      0x0F: 'TAB',
      0x10: 'Q', 0x11: 'W', 0x12: 'E', 0x13: 'R', 0x14: 'T',
      0x15: 'Y', 0x16: 'U', 0x17: 'I', 0x18: 'O', 0x19: 'P',
      0x1A: 'LBRACKET', 0x1B: 'RBRACKET', 0x1C: 'ENTER',
      0x1D: 'LCTRL',
      0x1E: 'A', 0x1F: 'S', 0x20: 'D', 0x21: 'F', 0x22: 'G',
      0x23: 'H', 0x24: 'J', 0x25: 'K', 0x26: 'L', 0x27: 'SEMICOLON',
      0x28: 'QUOTE', 0x29: 'BACKTICK', 0x2A: 'LSHIFT',
      0x2B: 'BACKSLASH',
      0x2C: 'Z', 0x2D: 'X', 0x2E: 'C', 0x2F: 'V', 0x30: 'B',
      0x31: 'N', 0x32: 'M', 0x33: 'COMMA', 0x34: 'DOT', 0x35: 'SLASH',
      0x36: 'RSHIFT', 0x37: 'KPASTERISK', 0x38: 'LALT', 0x39: 'SPACE',
      0x3A: 'CAPSLOCK', 0x3B: 'F1', 0x3C: 'F2', 0x3D: 'F3', 0x3E: 'F4',
      0x3F: 'F5', 0x40: 'F6', 0x41: 'F7', 0x42: 'F8', 0x43: 'F9',
      0x44: 'F10', 0x45: 'NUMLOCK', 0x46: 'SCROLLLOCK',
      0x47: 'KP7', 0x48: 'KP8', 0x49: 'KP9', 0x4A: 'KPMINUS',
      0x4B: 'KP4', 0x4C: 'KP5', 0x4D: 'KP6', 0x4E: 'KPPLUS',
      0x4F: 'KP1', 0x50: 'KP2', 0x51: 'KP3', 0x52: 'KP0',
      0x53: 'KPDOT', 0x57: 'F11', 0x58: 'F12',
      0x6F: 'RCTRL', 0x71: 'MUTE', 0x72: 'VOLUMEDOWN', 0x73: 'VOLUMEUP',
    };
    return keyMap[code] || `KEY_${code}`;
  }

  getAxisName(code) {
    const axisMap = {
      0x00: 'leftStickX',
      0x01: 'leftStickY',
      0x02: 'leftTrigger',
      0x03: 'rightStickX',
      0x04: 'rightStickY',
      0x05: 'rightTrigger',
      0x10: 'dpadX',
      0x11: 'dpadY',
    };
    return axisMap[code];
  }

  normalizeAxis(code, value) {
    // Normalize different axis ranges to -1.0 to 1.0
    if (code === 0x02 || code === 0x05) {
      // Triggers: 0-255 -> 0-1
      return Math.max(0, Math.min(1, value / 255));
    } else if (code === 0x10 || code === 0x11) {
      // D-pad: -1, 0, 1
      return value;
    } else {
      // Sticks: -32768 to 32767 -> -1 to 1
      return Math.max(-1, Math.min(1, value / 32767));
    }
  }

  broadcast(message) {
    if (this.clients.size > 0) {
      const payload = JSON.stringify(message);
      this.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(payload);
        }
      });
    }
  }

  stop() {
    if (this.capture && this.capture.stop) {
      this.capture.stop();
    }
    this.capturing = false;
    console.log('[Server] Input capture stopped');
  }
}

// Create HTTP server
const server = http.createServer((req, res) => {
  // Serve index.html for root
  if (req.url === '/') {
    req.url = '/index.html';
  }

  // Serve files from resources directory
  const filePath = path.join(__dirname, 'resources', req.url);
  const normalizedPath = path.normalize(filePath);

  // Security: prevent directory traversal
  if (!normalizedPath.startsWith(path.normalize(path.join(__dirname, 'resources')))) {
    res.writeHead(403, { 'Content-Type': 'text/plain' });
    res.end('Access denied');
    return;
  }

  if (fs.existsSync(normalizedPath) && fs.statSync(normalizedPath).isFile()) {
    const ext = path.extname(normalizedPath).toLowerCase();
    const mimeTypes = {
      '.html': 'text/html',
      '.js': 'application/javascript',
      '.css': 'text/css',
      '.json': 'application/json',
      '.png': 'image/png',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.gif': 'image/gif',
      '.svg': 'image/svg+xml',
      '.woff': 'font/woff',
      '.woff2': 'font/woff2',
      '.ttf': 'font/ttf',
    };

    const contentType = mimeTypes[ext] || 'application/octet-stream';
    fs.readFile(normalizedPath, (err, data) => {
      if (err) {
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        res.end('Server error');
      } else {
        res.writeHead(200, { 'Content-Type': contentType });
        res.end(data);
      }
    });
  } else {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not found');
  }
});

// WebSocket server for real-time input events
const wss = new WebSocket.Server({ server });
const inputManager = new InputCaptureManager();

wss.on('connection', (ws) => {
  console.log('[Server] Client connected, total:', wss.clients.size);
  inputManager.clients.add(ws);

  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message);
      console.log('[Server] Received message:', data.type);

      if (data.type === 'client:start-capture') {
        if (!inputManager.capturing) {
          inputManager.start().catch((err) => {
            ws.send(JSON.stringify({
              type: 'server:error',
              error: err.message
            }));
          });
        }
      } else if (data.type === 'client:stop-capture') {
        inputManager.stop();
      }
    } catch (error) {
      console.error('[Server] Message parse error:', error.message);
    }
  });

  ws.on('close', () => {
    inputManager.clients.delete(ws);
    console.log('[Server] Client disconnected, remaining:', wss.clients.size);
  });

  ws.on('error', (error) => {
    console.error('[Server] WebSocket error:', error.message);
    inputManager.clients.delete(ws);
  });
});

// Start server
server.listen(port, () => {
  console.log(`[Server] HTTP/WebSocket server running on http://localhost:${port}`);
  console.log(`[Server] Access at http://localhost:${port}`);
  console.log('[Server] Waiting for client connection...');

  // Auto-start input capture
  inputManager.start().catch((err) => {
    console.error('[Server] Failed to start input capture:', err.message);
  });
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n[Server] Shutting down...');
  inputManager.stop();
  server.close(() => {
    console.log('[Server] Server closed');
    process.exit(0);
  });
});

process.on('SIGTERM', () => {
  inputManager.stop();
  server.close(() => {
    process.exit(0);
  });
});
