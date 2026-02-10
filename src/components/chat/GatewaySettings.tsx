/**
 * GatewaySettings - Configure OpenClaw Gateway connection
 * 
 * Updated for WebSocket-only OpenClaw protocol
 * - Uses ws:// instead of http://
 * - Stores token/password for WebSocket auth
 */

'use client';

import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Settings, Check, X, Eye, EyeOff, Loader2 } from 'lucide-react';

interface GatewaySettingsProps {
  className?: string;
  onSave?: (auth: { token?: string; password?: string }) => void;
  variant?: 'button' | 'panel';
}

// Get current settings from localStorage or defaults
function getStoredSettings() {
  if (typeof window === 'undefined') {
    return { url: 'ws://127.0.0.1:18789', password: '', token: '' };
  }
  
  const storedUrl = localStorage.getItem('clawbrain_gateway_url') || 'ws://127.0.0.1:18789';
  // Convert http to ws if needed
  const url = storedUrl
    .replace('http://', 'ws://')
    .replace('https://', 'wss://');
  
  return {
    url,
    password: localStorage.getItem('clawbrain_gateway_password') || '',
    token: localStorage.getItem('clawbrain_gateway_token') || '',
  };
}

// Test WebSocket connection
async function testWebSocketConnection(url: string): Promise<{ success: boolean; error?: string }> {
  return new Promise((resolve) => {
    try {
      const ws = new WebSocket(url);
      const timeout = setTimeout(() => {
        ws.close();
        resolve({ success: false, error: 'Connection timeout (3s)' });
      }, 3000);

      ws.onopen = () => {
        clearTimeout(timeout);
        ws.close();
        resolve({ success: true });
      };

      ws.onerror = () => {
        clearTimeout(timeout);
        resolve({ success: false, error: 'WebSocket connection failed' });
      };
    } catch (err) {
      resolve({ 
        success: false, 
        error: err instanceof Error ? err.message : 'Invalid WebSocket URL'
      });
    }
  });
}

export function GatewaySettings({ className, onSave, variant = 'button' }: GatewaySettingsProps) {
  const [isOpen, setIsOpen] = useState(variant === 'panel');
  const [url, setUrl] = useState('ws://127.0.0.1:18789');
  const [password, setPassword] = useState('');
  const [token, setToken] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [saved, setSaved] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    message: string;
    error?: string;
  } | null>(null);

  // Load settings on mount
  useEffect(() => {
    const settings = getStoredSettings();
    setUrl(settings.url);
    setPassword(settings.password);
    setToken(settings.token);
  }, []);

  const handleTest = async () => {
    setTesting(true);
    setTestResult(null);
    
    const result = await testWebSocketConnection(url);
    
    setTesting(false);
    setTestResult({
      success: result.success,
      message: result.success 
        ? '✅ Gateway WebSocket reachable' 
        : '❌ Connection failed',
      error: result.error
    });
  };

  const handleSave = () => {
    localStorage.setItem('clawbrain_gateway_url', url);
    localStorage.setItem('clawbrain_gateway_password', password);
    localStorage.setItem('clawbrain_gateway_token', token);
    
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
    
    onSave?.({ token: token || undefined, password: password || undefined });
    
    if (variant !== 'panel') {
      setIsOpen(false);
    }
  };

  const handleCancel = () => {
    const settings = getStoredSettings();
    setUrl(settings.url);
    setPassword(settings.password);
    setToken(settings.token);
    setTestResult(null);
    if (variant !== 'panel') {
      setIsOpen(false);
    }
  };

  // Button variant - shows a settings button that opens the panel
  if (variant === 'button' && !isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className={cn(
          'flex items-center gap-1.5 px-2 py-1 text-xs font-mono',
          'text-muted-foreground hover:text-foreground',
          'border border-transparent hover:border-border',
          'transition-colors',
          className
        )}
        title="Configure Gateway Connection"
      >
        <Settings className="w-3 h-3" />
        <span>Settings</span>
      </button>
    );
  }

  // Panel variant or expanded button variant
  return (
    <div className={cn(
      'flex flex-col gap-3', 
      variant === 'button' && 'p-4 border border-border bg-background min-w-[340px] max-w-[400px]', 
      className
    )}>
      {variant === 'button' && (
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-foreground">Gateway Settings</span>
          <button
            onClick={handleCancel}
            className="text-muted-foreground hover:text-foreground"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* URL Input */}
      <div className="flex flex-col gap-1.5">
        <label className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider">
          WebSocket URL
        </label>
        <input
          type="text"
          value={url}
          onChange={(e) => {
            setUrl(e.target.value);
            setTestResult(null);
          }}
          placeholder="ws://127.0.0.1:18789"
          className={cn(
            'px-3 py-2 text-xs font-mono',
            'border border-border bg-background',
            'focus:outline-none focus:border-foreground',
            'text-foreground placeholder:text-muted-foreground'
          )}
        />
        <p className="text-[10px] text-muted-foreground">
          Format: ws://host:port (or wss:// for secure)
        </p>
      </div>

      {/* Password Input */}
      <div className="flex flex-col gap-1.5">
        <label className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider">
          Password
        </label>
        <div className="relative">
          <input
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              setTestResult(null);
            }}
            placeholder="Gateway password (if required)"
            className={cn(
              'w-full px-3 py-2 text-xs font-mono',
              'border border-border bg-background',
              'focus:outline-none focus:border-foreground',
              'text-foreground placeholder:text-muted-foreground'
            )}
          />
          <button
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            {showPassword ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
          </button>
        </div>
      </div>

      {/* Token Input (optional) */}
      <div className="flex flex-col gap-1.5">
        <label className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider">
          Auth Token (optional)
        </label>
        <input
          type="text"
          value={token}
          onChange={(e) => {
            setToken(e.target.value);
            setTestResult(null);
          }}
          placeholder="Bearer token (if using token auth)"
          className={cn(
            'px-3 py-2 text-xs font-mono',
            'border border-border bg-background',
            'focus:outline-none focus:border-foreground',
            'text-foreground placeholder:text-muted-foreground'
          )}
        />
        <p className="text-[10px] text-muted-foreground">
          Use either password OR token, not both
        </p>
      </div>

      {/* Test Button */}
      <button
        onClick={handleTest}
        disabled={testing}
        className={cn(
          'flex items-center justify-center gap-1.5 px-3 py-2',
          'text-xs font-mono border transition-colors',
          testing 
            ? 'border-border text-muted-foreground' 
            : 'border-foreground text-foreground hover:bg-foreground hover:text-background'
        )}
      >
        {testing ? (
          <>
            <Loader2 className="w-3 h-3 animate-spin" />
            <span>Testing...</span>
          </>
        ) : (
          <span>Test Connection</span>
        )}
      </button>

      {/* Test Result */}
      {testResult && (
        <div className={cn(
          'px-3 py-2.5 text-xs font-mono space-y-1',
          testResult.success 
            ? 'border border-green-500/30 bg-green-500/10 text-green-700 dark:text-green-400' 
            : 'border border-red-500/30 bg-red-500/10 text-red-700 dark:text-red-400'
        )}>
          <div className="font-medium">{testResult.message}</div>
          {testResult.error && (
            <div className="text-[10px] opacity-80">{testResult.error}</div>
          )}
        </div>
      )}

      {/* Save Button */}
      <button
        onClick={handleSave}
        disabled={saved}
        className={cn(
          'flex items-center justify-center gap-1.5 px-3 py-2',
          'text-xs font-mono transition-colors',
          saved
            ? 'bg-green-500/20 text-green-600 border border-green-500/50'
            : 'bg-foreground text-background hover:bg-foreground/90 border border-foreground'
        )}
      >
        {saved ? (
          <>
            <Check className="w-3 h-3" />
            <span>Saved!</span>
          </>
        ) : (
          <span>Save & Connect</span>
        )}
      </button>

      {/* Help Text */}
      <div className="space-y-1.5 pt-2 border-t border-border">
        <p className="text-[10px] font-mono text-muted-foreground">
          Default: ws://127.0.0.1:18789
        </p>
        <div className="text-[10px] text-muted-foreground space-y-0.5">
          <p>• Test checks if gateway WebSocket is reachable</p>
          <p>• Password/token sent during actual connection</p>
          <p>• Check your openclaw.json for auth settings</p>
        </div>
      </div>
    </div>
  );
}

// Export settings for use in other components
export { getStoredSettings };
