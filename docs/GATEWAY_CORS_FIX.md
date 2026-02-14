# Gateway CORS Connection Fix

## Problem

The OpenClaw Gateway connection was failing with 401 Unauthorized in the browser, even though `curl` worked with the same password. This was a **CORS (Cross-Origin Resource Sharing)** issue.

### Why Curl Worked But Browser Failed

| Tool | CORS Check | Result |
|------|-----------|--------|
| `curl` | No CORS | ✅ Works with password header |
| Browser | CORS preflight required | ❌ Blocked - preflight OPTIONS rejected |

When the site runs on `localhost:3000` and the gateway on `localhost:18789`, browsers treat them as different origins. The browser sends an `OPTIONS` preflight request before the actual `POST`, and the gateway was rejecting it.

## Solution

Implemented a **Next.js rewrite proxy** that routes gateway requests through the site's own API, avoiding cross-origin requests entirely.

### Changes Made

#### 1. `next.config.ts` - Added Rewrite and CORS Headers

```typescript
async rewrites() {
  const gatewayUrl = process.env.GATEWAY_URL || 'http://localhost:18789';
  return [
    {
      source: '/api/gateway/:path*',
      destination: `${gatewayUrl}/:path*`,
    },
  ];
}
```

This proxies `/api/gateway/v1/responses` → `http://localhost:18789/v1/responses`.

#### 2. `src/lib/http-gateway.ts` - Auto-Detect Proxy Mode

```typescript
function getGatewayConfig(): { url: string; password: string; useProxy: boolean } {
  const storedUrl = localStorage.getItem('clawbrain_gateway_url') || 'http://localhost:18789';
  
  // Auto-detect if we need proxy (CORS avoidance)
  const isLocalhost = storedUrl.includes('localhost') || storedUrl.includes('127.0.0.1');
  const isDifferentPort = !storedUrl.includes(window.location.host);
  const useProxy = isLocalhost && isDifferentPort;
  
  return {
    url: useProxy ? '/api/gateway' : storedUrl,
    password: localStorage.getItem('clawbrain_gateway_password') || '',
    useProxy,
  };
}
```

**Logic:**
- If gateway is on `localhost` BUT different port than the site → use proxy
- If gateway is same origin → direct connection (no proxy needed)

#### 3. Updated `testFullConnection()` to Use Proxy

```typescript
const fetchUrl = useProxy ? '/api/gateway/v1/responses' : `${url}/v1/responses`;
const response = await fetch(fetchUrl, { ... });
```

#### 4. Updated `sendMessage()` to Use Proxy

Same pattern - uses `/api/gateway/v1/responses` when proxy mode is active.

## How It Works

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Browser       │────▶│  Next.js Dev    │────▶│  OpenClaw       │
│  (localhost:3000)│     │  Server (proxy) │     │  Gateway        │
│                 │     │  (localhost:3000)│     │  (localhost:18789)│
└─────────────────┘     └─────────────────┘     └─────────────────┘
       │                         │                       │
       │  POST /api/gateway/     │  POST /v1/responses   │
       │  v1/responses           │  (same origin)        │
       │  + Authorization        │  + Authorization      │
       │  (same origin ✅)       │                       │
```

1. Browser sends request to `/api/gateway/v1/responses` (same origin as site)
2. Next.js dev server rewrites it to `http://localhost:18789/v1/responses`
3. Gateway receives the request with all headers intact
4. No CORS issues because browser only sees same-origin request

## Environment Variable (Optional)

Set a custom gateway URL via environment variable:

```bash
# .env.local
GATEWAY_URL=http://localhost:18789
```

If not set, defaults to `http://localhost:18789`.

## Testing

1. Start your dev server: `bun run dev`
2. Open Gateway Settings in the UI
3. Enter your gateway URL (e.g., `http://localhost:18789`)
4. Enter password
5. Click **"Test Full"** - should show ✅ Full connection successful!

## Files Modified

- `next.config.ts` - Added rewrites and CORS headers
- `src/lib/http-gateway.ts` - Added proxy detection and routing
- `src/components/chat/GatewaySettings.tsx` - Updated test functions
- `src/components/chat/ChatWindow.tsx` - Updated diagnostics

## Related Issues

This fix resolves the "Unauthorized" error that occurred when:
- Gateway requires password authentication
- Site and gateway run on different ports
- Browser blocks cross-origin requests with custom headers
