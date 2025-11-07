#!/usr/bin/env node
/**
 * Test script for Neutralino backend
 * Runs server and tests evdev integration without browser
 */

const http = require('http');
const WebSocket = require('ws');

console.log('\n=== Neutralino Backend Test ===\n');

// Try to require evdev
let evdevModule = null;
try {
  evdevModule = require('evdev');
  console.log('✓ evdev npm package loaded');
} catch (error) {
  console.error('✗ Failed to load evdev:', error.message);
  console.error('\nInstall with: npm install evdev');
  process.exit(1);
}

// Test 1: Check available devices
console.log('\nTest 1: Enumerate input devices');
const devices = evdevModule.enumerate();
console.log(`✓ Found ${devices.length} input devices:`);

devices.forEach((device, index) => {
  console.log(`  [${index}] ${device.name || 'Unknown'} (${device.path})`);
});

if (devices.length === 0) {
  console.error('\n⚠️  No input devices found!');
  console.error('Ensure user is in input group: sudo usermod -aG input $USER');
  process.exit(1);
}

// Test 2: Try to read events from first device
console.log('\nTest 2: Listen for input events (30 seconds)');
console.log('Try pressing keys, moving mouse, or moving gamepad...\n');

let eventCount = 0;
const testDevice = devices[0];

if (!testDevice) {
  console.error('No device available');
  process.exit(1);
}

const testListener = (event) => {
  if (eventCount < 10) { // Only show first 10 events
    const typeStr = event.type === 0x01 ? 'KEY' :
                   event.type === 0x02 ? 'REL' :
                   event.type === 0x03 ? 'ABS' : 'OTHER';
    console.log(`  [${eventCount}] Event type=${typeStr} code=${event.code} value=${event.value}`);
  }
  eventCount++;
};

testDevice.on('data', testListener);

// Test timeout
setTimeout(() => {
  testDevice.removeListener('data', testListener);

  console.log(`\n✓ Received ${eventCount} events in 30 seconds`);
  console.log(`  (${(eventCount / 30).toFixed(1)} events/second average)`);

  if (eventCount === 0) {
    console.error('\n⚠️  No events captured!');
    console.error('This could mean:');
    console.error('  1. No input devices connected');
    console.error('  2. Permissions issue (check "input" group)');
    console.error('  3. All input devices are grabbed by another app');
    process.exit(1);
  }

  // Test 3: Test WebSocket server
  console.log('\nTest 3: Start WebSocket server');

  const server = http.createServer();
  const wss = new WebSocket.Server({ server });

  let wsConnected = false;
  wss.on('connection', (ws) => {
    wsConnected = true;
    console.log('✓ Client connected via WebSocket');

    ws.send(JSON.stringify({
      type: 'test:hello',
      message: 'Backend is working!'
    }));

    ws.on('message', (data) => {
      console.log(`  Received message: ${data}`);
    });

    ws.on('close', () => {
      console.log('✓ Client disconnected');
      server.close();
    });
  });

  server.listen(9001, () => {
    console.log('✓ WebSocket server listening on port 9001');
    console.log('\nTest complete! ✅');
    console.log('\nTo use the full overlay:');
    console.log('  npm start          # Start production server');
    console.log('  ./run.sh           # Use launcher script');
    process.exit(0);
  });

  // Auto-close after 10 seconds if no connection
  setTimeout(() => {
    if (!wsConnected) {
      console.warn('\n⚠️  No WebSocket client connected');
      server.close();
      process.exit(0);
    }
  }, 10000);
}, 30000);

// Handle Ctrl+C
process.on('SIGINT', () => {
  console.log('\n\nTest interrupted');
  process.exit(1);
});
