# Testing ClawBrain from Another Device on the Same Network

This guide explains how to access your ClawBrain instance from another PC, phone, or tablet on the same local network.

## Quick Steps

### 1. Find Your Computer's IP Address

**On macOS:**
```bash
ipconfig getifaddr en0
# or
ifconfig | grep "inet " | grep -v 127.0.0.1
```

**On Linux:**
```bash
ip addr show | grep "inet " | grep -v 127.0.0.1
# or
hostname -I
```

**On Windows:**
```cmd
ipconfig
# Look for "IPv4 Address" under your active connection
```

Example output: `192.168.1.100`

---

### 2. Start Next.js on All Interfaces

By default, Next.js only listens on `localhost` (127.0.0.1). To allow network access:

```bash
cd /Users/mac/Projects/clawbrain

# Method 1: Using --hostname flag
bun run dev --hostname 0.0.0.0

# Method 2: Using PORT and HOSTNAME env vars
HOSTNAME=0.0.0.0 PORT=3000 bun run dev
```

> **Note:** `0.0.0.0` means "listen on all network interfaces"

You should see:
```
▲ Next.js 16.x.x
- Local:        http://localhost:3000
- Network:      http://192.168.1.100:3000  ← Use this URL!
```

---

### 3. Configure Gateway for Network Access

The Gateway connection also needs to use the network IP instead of `localhost`.

#### Option A: Update Settings in UI (Recommended)

1. On the host PC, open ClawBrain at `http://localhost:3000`
2. Click **Settings** in the chat panel
3. Change Gateway URL from:
   - `ws://localhost:18789` 
   - To: `ws://192.168.1.100:18789` (use your actual IP)
4. Click **Save & Connect**

#### Option B: Set Environment Variable

Create/update `.env.local`:
```bash
NEXT_PUBLIC_GATEWAY_URL=ws://192.168.1.100:18789
```

Then restart the dev server.

---

### 4. Start OpenClaw Gateway on All Interfaces

Your OpenClaw Gateway also needs to accept connections from the network:

```bash
# Check if your Gateway supports binding to all interfaces
openclaw-gateway --host 0.0.0.0 --port 18789

# Or with Python
python -m openclaw.gateway --host 0.0.0.0
```

> If your Gateway doesn't have a `--host` option, it may already listen on all interfaces by default.

**Verify it's listening on all interfaces:**
```bash
# macOS/Linux
netstat -an | grep 18789
# Should show: 0.0.0.0:18789 or :::18789 (not 127.0.0.1:18789)

# Or use lsof
lsof -i :18789
```

---

### 5. Access from Another Device

On your other PC/phone/tablet (same WiFi/network):

1. Open browser
2. Navigate to: `http://192.168.1.100:3000` (use the host PC's IP)
3. The UI should load

**Configure Gateway on the client device:**
1. Click **Settings** in chat panel
2. Set Gateway URL to: `ws://192.168.1.100:18789`
3. Click **Save & Connect**

---

## Troubleshooting

### "Can't reach site" from other device

**Check 1: Firewall on host PC**

**macOS:**
```bash
# Check if firewall is blocking
sudo /usr/libexec/ApplicationFirewall/socketfilterfw --getglobalstate

# Temporarily disable (for testing only!)
sudo /usr/libexec/ApplicationFirewall/socketfilterfw --setglobalstate off
```

**Linux (UFW):**
```bash
# Allow port 3000 (Next.js)
sudo ufw allow 3000/tcp

# Allow port 18789 (Gateway)
sudo ufw allow 18789/tcp
```

**Windows:**
1. Windows Defender Firewall → Advanced Settings
2. Inbound Rules → New Rule
3. Port → TCP → 3000, 18789 → Allow

**Check 2: Verify IP addresses**

On host PC:
```bash
# Make sure you're using the right IP
ifconfig | grep "inet "
# Use the one starting with 192.168.x.x or 10.x.x.x
```

**Check 3: Test connectivity**

From the other device:
```bash
# Test if port 3000 is reachable
ping 192.168.1.100
curl http://192.168.1.100:3000

# Test if port 18789 is reachable
curl http://192.168.1.100:18789
```

### "Gateway Failed" on client device

**Problem:** Gateway URL is still pointing to `localhost`

**Solution:** Update Gateway URL to use the host PC's IP:
```
ws://192.168.1.100:18789
```

**Problem:** Gateway only listening on localhost

**Solution:** Restart Gateway with `--host 0.0.0.0` or check its binding.

### CORS Errors in Browser Console

If you see CORS errors, your Gateway needs to allow requests from the client device's origin.

In your Gateway config, add:
```python
# Example for Python/Flask-SocketIO
CORS_ALLOWED_ORIGINS = [
    "http://localhost:3000",
    "http://192.168.1.100:3000",  # Add your host IP
    "http://192.168.1.101:3000",  # Add client device IP if needed
]
```

---

## Quick Reference: URLs

| Service | On Host PC | On Other Devices |
|---------|------------|------------------|
| ClawBrain UI | `http://localhost:3000` | `http://192.168.1.100:3000` |
| Gateway WS | `ws://localhost:18789` | `ws://192.168.1.100:18789` |

> Replace `192.168.1.100` with your actual host PC IP

---

## Using Mobile Device for Testing

### iPhone/iPad
1. Open Safari
2. Enter: `http://192.168.1.100:3000`
3. If it doesn't load, try:
   - Settings → Safari → Advanced → Web Inspector (enable for debugging)
   - Connect iPhone to Mac and use Safari DevTools

### Android
1. Open Chrome
2. Enter: `http://192.168.1.100:3000`
3. For debugging:
   - Chrome on Android → DevTools → Remote Devices
   - Or use `chrome://inspect`

---

## Production Build Testing

For more realistic testing, build and start the production version:

```bash
# Build
bun run build

# Start production server on all interfaces
bun run start --hostname 0.0.0.0
```

---

## Security Warning

⚠️ **Only use this on trusted networks!**

- Don't expose port 3000 or 18789 to the internet
- Use a firewall to block external access
- Consider using a VPN for remote access
- Never use `--hostname 0.0.0.0` on public WiFi

---

## Alternative: Using a Tunnel (Ngrok)

If you need to test from outside your network:

```bash
# Install ngrok
brew install ngrok  # macOS
# or download from ngrok.com

# Tunnel the Next.js app
ngrok http 3000

# Tunnel the Gateway (in another terminal)
ngrok tcp 18789
```

Then use the ngrok URLs provided.

> Note: ngrok free tier has limitations and random URLs.
