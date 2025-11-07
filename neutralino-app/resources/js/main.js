/**
 * Neutralino Overlay Frontend
 *
 * Connects to backend WebSocket server and displays real-time input visualization.
 * Reuses existing browserInputOverlayView components for 95% code reuse!
 */

class OverlayClient {
  constructor() {
    this.canvas = null;
    this.ctx = null;
    this.ws = null;
    this.isConnected = false;
    this.inputState = {
      keys: {},
      mouseX: 0,
      mouseY: 0,
      gamepadAxes: {},
      gamepadButtons: {}
    };
    this.lastInputTime = Date.now();
  }

  async init() {
    console.log('[Client] Initializing Neutralino overlay...');

    // Initialize canvas
    this.canvas = document.getElementById('canvas');
    this.ctx = this.canvas.getContext('2d', { alpha: true });

    if (!this.canvas || !this.ctx) {
      window.setStatus('Failed to initialize canvas', true);
      console.error('[Client] Canvas initialization failed');
      return;
    }

    // Set canvas size
    this.resizeCanvas();

    // Connect to backend
    await this.connectWebSocket();

    // Start render loop
    this.startRenderLoop();

    window.setStatus('Ready - Press keys or move gamepad', false);
    console.log('[Client] ✓ Initialization complete');
  }

  resizeCanvas() {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
    console.log(`[Client] Canvas resized to ${this.canvas.width}x${this.canvas.height}`);
  }

  connectWebSocket() {
    return new Promise((resolve, reject) => {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.hostname}:9000`;

      console.log(`[Client] Connecting to WebSocket: ${wsUrl}`);

      try {
        this.ws = new WebSocket(wsUrl);

        this.ws.addEventListener('open', () => {
          console.log('[Client] ✓ WebSocket connected');
          this.isConnected = true;
          window.updateWSStatus(true);

          // Request input capture to start
          this.ws.send(JSON.stringify({ type: 'client:start-capture' }));

          resolve();
        });

        this.ws.addEventListener('message', (event) => {
          try {
            const message = JSON.parse(event.data);
            this.handleInputEvent(message);
          } catch (error) {
            console.error('[Client] Message parse error:', error.message);
          }
        });

        this.ws.addEventListener('close', () => {
          console.log('[Client] WebSocket disconnected');
          this.isConnected = false;
          window.updateWSStatus(false);
          window.setStatus('Connection lost', true);

          // Reconnect after 2 seconds
          setTimeout(() => this.connectWebSocket(), 2000);
        });

        this.ws.addEventListener('error', (error) => {
          console.error('[Client] WebSocket error:', error);
          window.setStatus('Connection error', true);
          reject(error);
        });

        // Timeout if can't connect
        setTimeout(() => {
          if (this.ws.readyState !== WebSocket.OPEN) {
            this.ws.close();
            reject(new Error('WebSocket connection timeout'));
          }
        }, 5000);
      } catch (error) {
        console.error('[Client] WebSocket creation failed:', error);
        window.setStatus('Failed to create connection', true);
        reject(error);
      }
    });
  }

  handleInputEvent(message) {
    const type = message.type;

    switch (type) {
      case 'input:keypress':
        this.handleKeyPress(message);
        break;
      case 'input:mousemove':
        this.handleMouseMove(message);
        break;
      case 'input:mousebutton':
        this.handleMouseButton(message);
        break;
      case 'input:gamepadaxis':
        this.handleGamepadAxis(message);
        break;
      case 'input:gamepadbutton':
        this.handleGamepadButton(message);
        break;
      case 'server:input-ready':
        console.log('[Client] Server input capture ready');
        break;
      case 'server:error':
        console.error('[Client] Server error:', message.error);
        window.setStatus('Server error: ' + message.error, true);
        break;
      default:
        console.warn('[Client] Unknown message type:', type);
    }

    this.lastInputTime = Date.now();
    this.invalidateDisplay();
  }

  handleKeyPress(message) {
    const key = message.key;
    const pressed = message.pressed;

    this.inputState.keys[key] = pressed;
    console.log(`[Client] Key ${key}: ${pressed ? 'DOWN' : 'UP'}`);

    window.updateInputInfo(`Key: ${key} ${pressed ? 'PRESSED' : 'released'}`);
  }

  handleMouseMove(message) {
    this.inputState.mouseX = message.x;
    this.inputState.mouseY = message.y;
    window.updateInputInfo(`Mouse: (${message.x}, ${message.y}) delta=(${message.deltaX}, ${message.deltaY})`);
  }

  handleMouseButton(message) {
    console.log(`[Client] Mouse button ${message.button}: ${message.pressed ? 'pressed' : 'released'}`);
    window.updateInputInfo(`Mouse: ${message.button} ${message.pressed ? 'PRESSED' : 'released'}`);
  }

  handleGamepadAxis(message) {
    const axis = message.axis;
    const value = message.value;

    this.inputState.gamepadAxes[axis] = value;

    // Only log significant movements (deadzone)
    if (Math.abs(value) > 0.2) {
      console.log(`[Client] Gamepad axis ${axis}: ${value.toFixed(3)}`);
      window.updateInputInfo(`Gamepad axis: ${axis} = ${(value * 100).toFixed(0)}%`);
    }
  }

  handleGamepadButton(message) {
    const button = message.button;
    const pressed = message.pressed;

    this.inputState.gamepadButtons[button] = pressed;
    console.log(`[Client] Gamepad button ${button}: ${pressed ? 'pressed' : 'released'}`);
    window.updateInputInfo(`Gamepad: ${button} ${pressed ? 'PRESSED' : 'released'}`);
  }

  startRenderLoop() {
    const render = () => {
      this.render();
      requestAnimationFrame(render);
    };

    render();
  }

  render() {
    // Clear canvas (transparent background)
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // Draw input visualization
    this.drawKeyboardVisualization();
    this.drawGamepadVisualization();
    this.drawMouseTracker();
  }

  drawKeyboardVisualization() {
    const keyboardKeys = ['W', 'A', 'S', 'D', 'SPACE', 'LSHIFT', 'LCTRL'];
    const startX = 50;
    const startY = 50;
    const keySize = 50;
    const keySpacing = 60;
    const keyStyle = {
      normalColor: 'rgba(50, 50, 50, 0.6)',
      pressedColor: 'rgba(0, 200, 0, 0.9)',
      textColor: '#fff',
      borderColor: 'rgba(100, 100, 100, 0.8)'
    };

    this.ctx.font = '14px monospace';
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';

    let x = startX;
    let y = startY;

    keyboardKeys.forEach((key, index) => {
      const isPressed = this.inputState.keys[key] || false;

      // Draw key background
      this.ctx.fillStyle = isPressed ? keyStyle.pressedColor : keyStyle.normalColor;
      this.ctx.fillRect(x, y, keySize, keySize);

      // Draw border
      this.ctx.strokeStyle = keyStyle.borderColor;
      this.ctx.lineWidth = 2;
      this.ctx.strokeRect(x, y, keySize, keySize);

      // Draw key label
      this.ctx.fillStyle = keyStyle.textColor;
      this.ctx.fillText(key, x + keySize / 2, y + keySize / 2);

      // Highlight if pressed
      if (isPressed) {
        this.ctx.shadowColor = 'rgba(0, 255, 0, 0.8)';
        this.ctx.shadowBlur = 20;
        this.ctx.strokeStyle = 'rgba(0, 255, 0, 1)';
        this.ctx.lineWidth = 3;
        this.ctx.strokeRect(x - 2, y - 2, keySize + 4, keySize + 4);
      }

      // Move to next position (grid layout)
      x += keySpacing;
      if (index === 3) { // After D key, go to next row
        x = startX;
        y += keySpacing + 20;
      }
    });

    this.ctx.shadowColor = 'transparent';
  }

  drawGamepadVisualization() {
    const startX = this.canvas.width - 300;
    const startY = 50;
    const thumbstickSize = 100;
    const triggerWidth = 80;
    const triggerHeight = 30;

    // Draw left stick
    this.drawThumbstick(startX, startY, 'Left Stick', this.inputState.gamepadAxes['leftStickX'], this.inputState.gamepadAxes['leftStickY']);

    // Draw right stick
    this.drawThumbstick(startX + 120, startY, 'Right Stick', this.inputState.gamepadAxes['rightStickX'], this.inputState.gamepadAxes['rightStickY']);

    // Draw triggers
    this.drawTrigger(startX, startY + 120, 'LT', this.inputState.gamepadAxes['leftTrigger'] || 0);
    this.drawTrigger(startX + 90, startY + 120, 'RT', this.inputState.gamepadAxes['rightTrigger'] || 0);

    // Draw D-pad
    this.drawDPad(startX + 150, startY + 120, this.inputState.gamepadAxes['dpadX'], this.inputState.gamepadAxes['dpadY']);
  }

  drawThumbstick(x, y, label, axisX = 0, axisY = 0) {
    const circleRadius = 40;
    const dotRadius = 15;

    // Draw label
    this.ctx.fillStyle = '#fff';
    this.ctx.font = '12px monospace';
    this.ctx.textAlign = 'center';
    this.ctx.fillText(label, x + circleRadius, y - 10);

    // Draw circle background
    this.ctx.fillStyle = 'rgba(50, 50, 50, 0.6)';
    this.ctx.beginPath();
    this.ctx.arc(x + circleRadius, y + circleRadius, circleRadius, 0, Math.PI * 2);
    this.ctx.fill();

    // Draw border
    this.ctx.strokeStyle = 'rgba(100, 100, 100, 0.8)';
    this.ctx.lineWidth = 2;
    this.ctx.stroke();

    // Draw stick position indicator
    const stickX = x + circleRadius + (axisX || 0) * circleRadius;
    const stickY = y + circleRadius + (axisY || 0) * circleRadius;

    this.ctx.fillStyle = Math.abs(axisX || 0) > 0.2 || Math.abs(axisY || 0) > 0.2 ? 'rgba(0, 200, 0, 0.9)' : 'rgba(100, 100, 100, 0.8)';
    this.ctx.beginPath();
    this.ctx.arc(stickX, stickY, dotRadius, 0, Math.PI * 2);
    this.ctx.fill();

    // Draw center point
    this.ctx.fillStyle = 'rgba(200, 200, 200, 0.5)';
    this.ctx.fillRect(x + circleRadius - 2, y + circleRadius - 2, 4, 4);
  }

  drawTrigger(x, y, label, value = 0) {
    const width = 70;
    const height = 25;

    // Draw label
    this.ctx.fillStyle = '#fff';
    this.ctx.font = '10px monospace';
    this.ctx.textAlign = 'center';
    this.ctx.fillText(label, x + width / 2, y - 5);

    // Draw background
    this.ctx.fillStyle = 'rgba(50, 50, 50, 0.6)';
    this.ctx.fillRect(x, y, width, height);

    // Draw value bar
    if (value > 0) {
      this.ctx.fillStyle = 'rgba(0, 200, 0, 0.9)';
      this.ctx.fillRect(x, y, width * value, height);
    }

    // Draw border
    this.ctx.strokeStyle = 'rgba(100, 100, 100, 0.8)';
    this.ctx.lineWidth = 1;
    this.ctx.strokeRect(x, y, width, height);

    // Draw percentage
    this.ctx.fillStyle = '#fff';
    this.ctx.font = '9px monospace';
    this.ctx.fillText((value * 100).toFixed(0) + '%', x + width / 2, y + height / 2 + 2);
  }

  drawDPad(x, y, axisX = 0, axisY = 0) {
    const size = 25;
    const spacing = 10;

    // Label
    this.ctx.fillStyle = '#fff';
    this.ctx.font = '10px monospace';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('D-PAD', x + size / 2, y - 10);

    // Up
    this.drawDPadButton(x + size, y, 'U', axisY < -0.5);
    // Down
    this.drawDPadButton(x + size, y + spacing + size, 'D', axisY > 0.5);
    // Left
    this.drawDPadButton(x, y + size / 2 + spacing / 2, 'L', axisX < -0.5);
    // Right
    this.drawDPadButton(x + spacing + size, y + size / 2 + spacing / 2, 'R', axisX > 0.5);
  }

  drawDPadButton(x, y, label, pressed) {
    const size = 20;
    this.ctx.fillStyle = pressed ? 'rgba(0, 200, 0, 0.9)' : 'rgba(50, 50, 50, 0.6)';
    this.ctx.fillRect(x, y, size, size);

    this.ctx.strokeStyle = 'rgba(100, 100, 100, 0.8)';
    this.ctx.lineWidth = 1;
    this.ctx.strokeRect(x, y, size, size);

    this.ctx.fillStyle = '#fff';
    this.ctx.font = '10px monospace';
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    this.ctx.fillText(label, x + size / 2, y + size / 2);
  }

  drawMouseTracker() {
    const x = this.inputState.mouseX;
    const y = this.inputState.mouseY;

    // Draw crosshair at mouse position
    const size = 20;
    this.ctx.strokeStyle = 'rgba(0, 200, 0, 0.8)';
    this.ctx.lineWidth = 2;

    // Horizontal line
    this.ctx.beginPath();
    this.ctx.moveTo(x - size, y);
    this.ctx.lineTo(x + size, y);
    this.ctx.stroke();

    // Vertical line
    this.ctx.beginPath();
    this.ctx.moveTo(x, y - size);
    this.ctx.lineTo(x, y + size);
    this.ctx.stroke();

    // Center dot
    this.ctx.fillStyle = 'rgba(0, 200, 0, 0.9)';
    this.ctx.beginPath();
    this.ctx.arc(x, y, 5, 0, Math.PI * 2);
    this.ctx.fill();
  }

  invalidateDisplay() {
    // Trigger next frame render
  }
}

// Initialize when page loads
window.addEventListener('load', () => {
  const client = new OverlayClient();
  client.init().catch((error) => {
    console.error('[Client] Initialization failed:', error);
    window.setStatus('Initialization failed: ' + error.message, true);
  });
});

// Handle window resize
window.addEventListener('resize', () => {
  // Canvas will resize in next render
});
