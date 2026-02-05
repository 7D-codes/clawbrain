# Connecting to OpenClaw Gateway

This guide helps you connect ClawBrain to your locally hosted OpenClaw Gateway.

## Quick Start

### 1. Start OpenClaw Gateway

Make sure your OpenClaw Gateway is running:

```bash
# In your OpenClaw directory
python -m openclaw.gateway
# or
openclaw-gateway
```

By default, it runs on **port 18789**.

### 2. Verify Gateway is Running

Test the connection:

```bash
curl http://localhost:18789/health
# or
curl http://localhost:18789/
```

You should see a response indicating the gateway is active.

### 3. Configure ClawBrain Connection

When the ClawBrain UI shows **"OFFLINE"**:

1. Click the **"Settings"** button in the chat header
2. Enter your Gateway URL (default: `ws://localhost:18789`)
3. Enter password if your Gateway requires authentication
4. Click **"Save & Connect"**

The page will reload and attempt to connect.

---

## Troubleshooting

### "Gateway Failed" / Connection Errors

#### Check 1: Is Gateway Running?

```bash
# Check if port 18789 is in use
lsof -i :18789
# or
netstat -an | grep 18789
```

If nothing is listening, start the Gateway:
```bash
openclaw-gateway --port 18789
```

#### Check 2: Correct URL Format

WebSocket URLs must use `ws://` or `wss://` protocol:

| Correct | Incorrect |
|---------|-----------|
| `ws://localhost:18789` | `http://localhost:18789` |
| `ws://192.168.1.100:18789` | `localhost:18789` |
| `wss://gateway.example.com` | `https://gateway.example.com` |

#### Check 3: CORS Issues

If connecting from a different origin, ensure your Gateway allows CORS:

```python
# In your Gateway config
CORS_ORIGINS = ["http://localhost:3000", "http://127.0.0.1:3000"]
```

#### Check 4: Firewall/Network

```bash
# Test WebSocket connection manually
wscat -c ws://localhost:18789

# Or use curl to test the WebSocket endpoint
curl -i -N \
  -H "Connection: Upgrade" \
  -H "Upgrade: websocket" \
  -H "Host: localhost:18789" \
  http://localhost:18789
```

### Authentication Issues

If your Gateway requires a password:

1. Open **Settings** in ClawBrain chat panel
2. Enter the password in the **Password** field
3. Save and reconnect

Password is stored in your browser's localStorage.

### Common Error Messages

| Error | Cause | Solution |
|-------|-------|----------|
| `WebSocket connection failed` | Gateway not running | Start the Gateway service |
| `Connection refused` | Wrong port/URL | Verify URL and port |
| `Auth failed` | Wrong password | Check Gateway password config |
| `Network Error` | Firewall/CORS | Check network settings |

---

## Configuration Options

### Environment Variables

Create a `.env.local` file in your ClawBrain directory:

```bash
# Default Gateway URL (used if no localStorage setting)
NEXT_PUBLIC_GATEWAY_URL=ws://localhost:18789

# Default password (optional, not recommended for production)
NEXT_PUBLIC_GATEWAY_PASSWORD=your-password
```

### Runtime Configuration

The Gateway settings are stored in your browser's **localStorage**:

```javascript
// View current settings
localStorage.getItem('clawbrain_gateway_url');
localStorage.getItem('clawbrain_gateway_password');

// Update settings
localStorage.setItem('clawbrain_gateway_url', 'ws://192.168.1.100:18789');
localStorage.setItem('clawbrain_gateway_password', 'secret');
```

---

## Advanced: Remote Gateway

To connect to a Gateway on another machine:

1. **Ensure network accessibility:**
   ```bash
   # On the Gateway machine, allow port 18789
   sudo ufw allow 18789
   # or
   sudo iptables -A INPUT -p tcp --dport 18789 -j ACCEPT
   ```

2. **Use the correct IP:**
   - Find the Gateway machine's IP: `ip addr` or `ifconfig`
   - Set URL to: `ws://<gateway-ip>:18789`

3. **For production with HTTPS:**
   - Use `wss://` (WebSocket Secure)
   - Set up SSL certificates
   - Use a reverse proxy (nginx, Caddy)

---

## Testing the Connection

### Browser Console Test

Open browser DevTools (F12) and run:

```javascript
const ws = new WebSocket('ws://localhost:18789');
ws.onopen = () => console.log('Connected!');
ws.onerror = (e) => console.error('Error:', e);
ws.onclose = () => console.log('Disconnected');
```

### Expected Gateway Protocol

ClawBrain expects the Gateway to support this protocol:

1. **Connect** → Gateway accepts WebSocket
2. **Auth** → Send `{type: 'auth', params: {auth: {password: ''}}}`
3. **Auth Success** ← Receive `{type: 'auth_success'}`
4. **Join Session** → Send `{type: 'join', sessionKey: 'clawbrain:main:main', label: 'main'}`
5. **Joined** ← Receive `{type: 'joined', sessionKey: 'clawbrain:main:main'}`
6. **Send Message** → Send `{type: 'message', text: '...'}`
7. **Receive Chunks** ← Receive `{type: 'chunk', content: '...'}`
8. **Done** ← Receive `{type: 'done'}`

---

## Still Having Issues?

1. Check the **browser console** (F12 → Console) for detailed error messages
2. Check the **Network tab** to see WebSocket connection attempts
3. Verify Gateway logs for connection attempts
4. Try connecting with a simple WebSocket client first (like `wscat`)
