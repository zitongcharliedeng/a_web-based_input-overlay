#!/usr/bin/env node
/**
 * Standalone test for evdev input capture
 * Run with: node test-evdev.js
 */

const EvdevInputCapture = require('./browserInputListeners/evdevInput');

console.log('=== evdev Input Capture Test ===\n');

const capture = new EvdevInputCapture();

// Set up event listeners
capture.on('mousemove', (data) => {
  console.log('Mouse move:', `dx=${data.deltaX} dy=${data.deltaY} pos=(${data.x}, ${data.y})`);
});

capture.on('mousewheel', (data) => {
  console.log('Mouse wheel:', `delta=${data.delta} direction=${data.direction}`);
});

capture.on('mousebutton', (data) => {
  console.log('Mouse button:', `${data.buttonName} ${data.pressed ? 'PRESSED' : 'released'}`);
});

capture.on('gamepadaxis', (data) => {
  console.log('Gamepad axis:', `${data.axisName} = ${data.normalized.toFixed(3)} (raw: ${data.value})`);
});

capture.on('gamepadbutton', (data) => {
  console.log('Gamepad button:', `${data.buttonName} ${data.pressed ? 'PRESSED' : 'released'}`);
});

// Start capture
console.log('Starting evdev capture...\n');
capture.start().then(() => {
  console.log('✅ Capture started successfully!');
  console.log('Move your mouse, scroll, press buttons, or move gamepad to see events.');
  console.log('Press Ctrl+C to exit.\n');
}).catch((err) => {
  console.error('❌ Failed to start capture:', err.message);
  process.exit(1);
});

// Handle Ctrl+C
process.on('SIGINT', () => {
  console.log('\n\nStopping capture...');
  capture.stop();
  process.exit(0);
});
