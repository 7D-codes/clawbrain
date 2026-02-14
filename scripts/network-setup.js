#!/usr/bin/env node
/**
 * Network Setup Helper for ClawBrain
 * 
 * This script helps you configure ClawBrain for network access
 * so you can test from other devices on the same WiFi/LAN.
 */

const os = require('os');
const { execSync } = require('child_process');

console.log('\n🔧 ClawBrain Network Setup Helper\n');

// Get network interfaces
const nets = os.networkInterfaces();
const addresses = [];

Object.keys(nets).forEach(name => {
  nets[name].forEach(net => {
    if (net.family === 'IPv4' && !net.internal) {
      addresses.push({
        interface: name,
        address: net.address,
        url: `http://${net.address}:3000`,
        gateway: `ws://${net.address}:18789`
      });
    }
  });
});

if (addresses.length === 0) {
  console.log('❌ No network interfaces found!');
  console.log('   Make sure you\'re connected to a network.\n');
  process.exit(1);
}

console.log('📡 Available Network Interfaces:\n');
addresses.forEach((addr, i) => {
  console.log(`  ${i + 1}. ${addr.interface}`);
  console.log(`     App URL:    ${addr.url}`);
  console.log(`     Gateway:    ${addr.gateway}\n`);
});

const primary = addresses[0];

console.log('📋 Quick Start:\n');
console.log('  1. Start Next.js on all interfaces:');
console.log(`     $ bun run dev:network`);
console.log('     or');
console.log(`     $ bun run dev --hostname 0.0.0.0\n`);

console.log('  2. Start OpenClaw Gateway on all interfaces:');
console.log(`     $ openclaw-gateway --host 0.0.0.0`);
console.log('     (or check your Gateway docs for the --host flag)\n');

console.log('  3. On the other device, open:');
console.log(`     ${primary.url}\n`);

console.log('  4. Configure Gateway URL in Settings:');
console.log(`     ${primary.gateway}\n`);

console.log('🔥 Firewall Check:\n');
console.log('   If you can\'t connect from other devices, try:');
console.log('   - macOS: Disable firewall temporarily');
console.log('   - Linux: sudo ufw allow 3000/tcp && sudo ufw allow 18789/tcp');
console.log('   - Windows: Add ports 3000 and 18789 to firewall rules\n');

console.log('📖 Full guide: docs/NETWORK_TESTING.md\n');

// Check if Next.js is running
try {
  const result = execSync('lsof -i :3000 2>/dev/null || echo "not running"', { encoding: 'utf-8' });
  if (result.includes('not running')) {
    console.log('⚠️  Next.js is not currently running on port 3000\n');
  } else {
    console.log('✅ Next.js appears to be running on port 3000\n');
  }
} catch (e) {
  // Ignore errors
}

// Check if Gateway is running
try {
  const result = execSync('lsof -i :18789 2>/dev/null || echo "not running"', { encoding: 'utf-8' });
  if (result.includes('not running')) {
    console.log('⚠️  Gateway is not currently running on port 18789\n');
  } else {
    console.log('✅ Gateway appears to be running on port 18789\n');
  }
} catch (e) {
  // Ignore errors
}
