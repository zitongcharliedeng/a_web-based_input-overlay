const fs = require('fs');
const fsPromises = require('fs').promises;
const { EventEmitter } = require('events');

/**
 * Pure JavaScript evdev input capture
 * Reads directly from /dev/input/eventX devices
 * No native compilation required
 */

// evdev event structure (24 bytes)
// struct input_event {
//   struct timeval time;  // 16 bytes (8 + 8 on 64-bit)
//   __u16 type;           // 2 bytes
//   __u16 code;           // 2 bytes
//   __s32 value;          // 4 bytes
// }
const EVENT_SIZE = 24;

// Event types
const EV_SYN = 0x00;       // Sync event
const EV_KEY = 0x01;       // Button press/release
const EV_REL = 0x02;       // Relative axis (mouse movement)
const EV_ABS = 0x03;       // Absolute axis (gamepad, joystick)
const EV_MSC = 0x04;       // Miscellaneous

// Relative axis codes (mouse)
const REL_X = 0;
const REL_Y = 1;
const REL_Z = 2;           // Mouse wheel vertical
const REL_WHEEL = 8;       // Alternative wheel code
const REL_HWHEEL = 6;      // Horizontal wheel

// Button codes
const BTN_LEFT = 0x110;    // 272
const BTN_RIGHT = 0x111;   // 273
const BTN_MIDDLE = 0x112;  // 274
const BTN_SIDE = 0x113;    // 275
const BTN_EXTRA = 0x114;   // 276

const BTN_GAMEPAD = 0x130; // 304 - Start of gamepad buttons
const BTN_SOUTH = 0x130;   // A button
const BTN_EAST = 0x131;    // B button
const BTN_NORTH = 0x133;   // X button
const BTN_WEST = 0x134;    // Y button

// Absolute axis codes (gamepad)
const ABS_X = 0;           // Left stick X
const ABS_Y = 1;           // Left stick Y
const ABS_Z = 2;           // Left trigger
const ABS_RX = 3;          // Right stick X
const ABS_RY = 4;          // Right stick Y
const ABS_RZ = 5;          // Right trigger
const ABS_HAT0X = 16;      // D-pad X
const ABS_HAT0Y = 17;      // D-pad Y

class EvdevDevice extends EventEmitter {
  constructor(devicePath) {
    super();
    this.devicePath = devicePath;
    this.stream = null;
    this.buffer = Buffer.alloc(0);
    this.active = false;
  }

  async open() {
    return new Promise((resolve, reject) => {
      try {
        // Check if device exists and is readable
        fs.access(this.devicePath, fs.constants.R_OK, (err) => {
          if (err) {
            reject(new Error(`Cannot read ${this.devicePath}: ${err.message}`));
            return;
          }

          this.stream = fs.createReadStream(this.devicePath);
          this.active = true;

          this.stream.on('data', (chunk) => this.handleData(chunk));
          this.stream.on('error', (err) => this.handleError(err));
          this.stream.on('end', () => this.handleEnd());

          resolve();
        });
      } catch (err) {
        reject(err);
      }
    });
  }

  handleData(chunk) {
    // Append to buffer
    this.buffer = Buffer.concat([this.buffer, chunk]);

    // Process complete events
    while (this.buffer.length >= EVENT_SIZE) {
      const event = this.parseEvent(this.buffer.slice(0, EVENT_SIZE));
      this.buffer = this.buffer.slice(EVENT_SIZE);

      if (event) {
        this.emit('event', event);
      }
    }
  }

  parseEvent(buffer) {
    // Parse evdev input_event structure
    const timeSec = buffer.readBigInt64LE(0);
    const timeUsec = buffer.readBigInt64LE(8);
    const type = buffer.readUInt16LE(16);
    const code = buffer.readUInt16LE(18);
    const value = buffer.readInt32LE(20);

    return {
      time: Number(timeSec) + Number(timeUsec) / 1000000,
      type,
      code,
      value
    };
  }

  handleError(err) {
    console.error(`[evdev] Error on ${this.devicePath}:`, err.message);
    this.emit('error', err);
    this.close();
  }

  handleEnd() {
    console.log(`[evdev] Device ${this.devicePath} disconnected`);
    this.close();
  }

  close() {
    if (this.stream) {
      this.stream.destroy();
      this.stream = null;
    }
    this.active = false;
    this.emit('close');
  }
}

class EvdevInputCapture extends EventEmitter {
  constructor() {
    super();
    this.devices = [];
    this.mouseState = {
      x: 0,
      y: 0,
      buttons: new Map()
    };
    this.gamepadState = {
      axes: new Map(),
      buttons: new Map()
    };
  }

  async start() {
    console.log('[evdev] Starting input capture...');

    // Find all input devices
    try {
      const inputDir = '/dev/input';
      const files = await fsPromises.readdir(inputDir);

      // Filter for event devices (event0, event1, etc.)
      const eventDevices = files.filter(f => f.startsWith('event')).sort();

      console.log(`[evdev] Found ${eventDevices.length} input devices`);

      // Try to open each device
      for (const file of eventDevices) {
        const devicePath = `${inputDir}/${file}`;
        try {
          await this.openDevice(devicePath);
        } catch (err) {
          // Silently skip devices we can't read (permissions or busy)
          if (err.message.includes('EACCES')) {
            console.warn(`[evdev] ${devicePath}: Permission denied (add user to 'input' group)`);
          }
        }
      }

      if (this.devices.length === 0) {
        throw new Error('No input devices accessible. Run: sudo usermod -aG input $USER');
      }

      console.log(`[evdev] Successfully opened ${this.devices.length} devices`);
      return true;

    } catch (err) {
      console.error('[evdev] Failed to start:', err.message);
      throw err;
    }
  }

  async openDevice(devicePath) {
    const device = new EvdevDevice(devicePath);

    device.on('event', (event) => this.handleEvent(event, devicePath));
    device.on('close', () => {
      const index = this.devices.indexOf(device);
      if (index > -1) {
        this.devices.splice(index, 1);
      }
    });

    await device.open();
    this.devices.push(device);
    console.log(`[evdev] Opened: ${devicePath}`);
  }

  handleEvent(event, devicePath) {
    const { type, code, value } = event;

    // Skip sync events
    if (type === EV_SYN) return;

    // Keyboard keys
    if (type === EV_KEY && code >= 1 && code <= 248) {
      const pressed = value === 1;
      const released = value === 0;
      const keyName = this.getKeyName(code);

      if (pressed || released) {
        this.emit('keypress', {
          key: keyName,
          code: code,
          pressed,
          released
        });
      }
      return; // Don't process as mouse/gamepad button
    }

    // Mouse relative movement
    if (type === EV_REL) {
      if (code === REL_X) {
        this.mouseState.x += value;
        this.emit('mousemove', {
          deltaX: value,
          deltaY: 0,
          x: this.mouseState.x,
          y: this.mouseState.y
        });
      } else if (code === REL_Y) {
        this.mouseState.y += value;
        this.emit('mousemove', {
          deltaX: 0,
          deltaY: value,
          x: this.mouseState.x,
          y: this.mouseState.y
        });
      } else if (code === REL_WHEEL || code === REL_Z) {
        this.emit('mousewheel', {
          delta: value,
          direction: value > 0 ? 'up' : 'down'
        });
      } else if (code === REL_HWHEEL) {
        this.emit('mousehwheel', {
          delta: value,
          direction: value > 0 ? 'right' : 'left'
        });
      }
    }

    // Mouse/gamepad buttons
    if (type === EV_KEY) {
      // Mouse buttons
      if (code >= BTN_LEFT && code <= BTN_EXTRA) {
        const button = code - BTN_LEFT;
        const pressed = value === 1;
        const released = value === 0;

        if (pressed || released) {
          this.mouseState.buttons.set(button, pressed);
          this.emit('mousebutton', {
            button,
            buttonName: this.getMouseButtonName(code),
            pressed,
            released
          });
        }
      }
      // Gamepad buttons
      else if (code >= BTN_GAMEPAD) {
        const button = code - BTN_GAMEPAD;
        const pressed = value === 1;
        const released = value === 0;

        if (pressed || released) {
          this.gamepadState.buttons.set(button, pressed);
          this.emit('gamepadbutton', {
            button,
            buttonName: this.getGamepadButtonName(code),
            pressed,
            released
          });
        }
      }
    }

    // Gamepad axes
    if (type === EV_ABS) {
      this.gamepadState.axes.set(code, value);
      this.emit('gamepadaxis', {
        axis: code,
        axisName: this.getAxisName(code),
        value,
        normalized: this.normalizeAxis(value, code)
      });
    }
  }

  getMouseButtonName(code) {
    const names = {
      [BTN_LEFT]: 'left',
      [BTN_RIGHT]: 'right',
      [BTN_MIDDLE]: 'middle',
      [BTN_SIDE]: 'side',
      [BTN_EXTRA]: 'extra'
    };
    return names[code] || `button${code}`;
  }

  getGamepadButtonName(code) {
    const names = {
      [BTN_SOUTH]: 'A',
      [BTN_EAST]: 'B',
      [BTN_NORTH]: 'X',
      [BTN_WEST]: 'Y'
    };
    return names[code] || `button${code - BTN_GAMEPAD}`;
  }

  getAxisName(code) {
    const names = {
      [ABS_X]: 'leftStickX',
      [ABS_Y]: 'leftStickY',
      [ABS_Z]: 'leftTrigger',
      [ABS_RX]: 'rightStickX',
      [ABS_RY]: 'rightStickY',
      [ABS_RZ]: 'rightTrigger',
      [ABS_HAT0X]: 'dpadX',
      [ABS_HAT0Y]: 'dpadY'
    };
    return names[code] || `axis${code}`;
  }

  getKeyName(code) {
    // Complete keyboard mapping
    const keys = {
      // Function keys
      1: 'ESC', 59: 'F1', 60: 'F2', 61: 'F3', 62: 'F4', 63: 'F5', 64: 'F6',
      65: 'F7', 66: 'F8', 67: 'F9', 68: 'F10', 87: 'F11', 88: 'F12',

      // Number row
      2: '1', 3: '2', 4: '3', 5: '4', 6: '5', 7: '6', 8: '7', 9: '8', 10: '9', 11: '0',
      12: 'MINUS', 13: 'EQUAL', 14: 'BACKSPACE',

      // QWERTY row
      15: 'TAB', 16: 'Q', 17: 'W', 18: 'E', 19: 'R', 20: 'T', 21: 'Y', 22: 'U', 23: 'I',
      24: 'O', 25: 'P', 26: 'LEFTBRACE', 27: 'RIGHTBRACE', 28: 'ENTER',

      // ASDF row
      30: 'A', 31: 'S', 32: 'D', 33: 'F', 34: 'G', 35: 'H', 36: 'J', 37: 'K', 38: 'L',
      39: 'SEMICOLON', 40: 'APOSTROPHE', 41: 'GRAVE', 43: 'BACKSLASH',

      // ZXCV row
      44: 'Z', 45: 'X', 46: 'C', 47: 'V', 48: 'B', 49: 'N', 50: 'M',
      51: 'COMMA', 52: 'DOT', 53: 'SLASH',

      // Modifiers
      29: 'LCTRL', 42: 'LSHIFT', 54: 'RSHIFT', 56: 'LALT', 97: 'RCTRL', 100: 'RALT',
      125: 'LMETA', 126: 'RMETA',

      // Special keys
      57: 'SPACE', 58: 'CAPSLOCK', 69: 'NUMLOCK', 70: 'SCROLLLOCK',

      // Arrow keys
      103: 'UP', 105: 'LEFT', 106: 'RIGHT', 108: 'DOWN',

      // Navigation
      102: 'HOME', 107: 'END', 104: 'PAGEUP', 109: 'PAGEDOWN',
      110: 'INSERT', 111: 'DELETE',

      // Numpad
      71: 'KP7', 72: 'KP8', 73: 'KP9', 74: 'KPMINUS',
      75: 'KP4', 76: 'KP5', 77: 'KP6', 78: 'KPPLUS',
      79: 'KP1', 80: 'KP2', 81: 'KP3',
      82: 'KP0', 83: 'KPDOT', 96: 'KPENTER',
      98: 'KPSLASH', 55: 'KPASTERISK'
    };
    return keys[code] || `KEY_${code}`;
  }

  normalizeAxis(value, code) {
    // Most gamepad axes are -32768 to 32767 or 0 to 255
    // Normalize to -1.0 to 1.0 or 0.0 to 1.0

    // Triggers are usually 0-255
    if (code === ABS_Z || code === ABS_RZ) {
      return value / 255.0;
    }

    // Sticks are usually -32768 to 32767
    if (code === ABS_X || code === ABS_Y || code === ABS_RX || code === ABS_RY) {
      return value / 32768.0;
    }

    // D-pad is usually -1, 0, 1
    if (code === ABS_HAT0X || code === ABS_HAT0Y) {
      return value;
    }

    // Default: assume signed 16-bit
    return value / 32768.0;
  }

  stop() {
    console.log('[evdev] Stopping input capture...');
    this.devices.forEach(device => device.close());
    this.devices = [];
  }

  getMouseState() {
    return {
      x: this.mouseState.x,
      y: this.mouseState.y,
      buttons: Object.fromEntries(this.mouseState.buttons)
    };
  }

  getGamepadState() {
    return {
      axes: Object.fromEntries(this.gamepadState.axes),
      buttons: Object.fromEntries(this.gamepadState.buttons)
    };
  }

  isAvailable() {
    return this.devices.length > 0;
  }
}

module.exports = EvdevInputCapture;
