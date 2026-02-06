/**
 * GatewaySettings - Configure OpenClaw Gateway connection
 * 
 * Allows users to set:
 * - Gateway URL (WebSocket endpoint)
 * - Gateway Password (for authentication)
 */

'use client';

import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Settings, Check, X, Eye, EyeOff, Loader2, TestTube, Zap } from 'lucide-react';
import { testFullConnection } from '@/lib/http-gateway';

interface GatewaySettingsProps {
  className?: string;
  onSave?: () => void;
  variant?: 'button' | 'panel';
}

// Get current settings from localStorage or defaults
function getStoredSettings() {
  if (typeof window === 'undefined') {
    return { url: 'http://localhost:18789', password: '', useProxy: false };
  }
  const url = localStorage.getItem('clawbrain_gateway_url')?.replace('ws://', 'http://').replace('wss://', 'https://') || 'http://localhost:18789';
  
  // Determine if we need to use proxy (CORS avoidance)
  const isLocalhost = url.includes('localhost') || url.includes('127.0.0.1');
  const isDifferentPort = !url.includes(window.location.host);
  const useProxy = isLocalhost && isDifferentPort;
  
  return {
    url,
    password: localStorage.getItem('clawbrain_gateway_password') || '',
    useProxy,
  };
}

// Simple HTTP test (just checks if gateway responds)
async function testBasicConnection(url: string, useProxy = false): Promise<{ success: boolean; error?: string }> {
  try {
    // Use proxy to avoid CORS issues
    const fetchUrl = useProxy ? '/api/gateway/v1/responses' : `${url}/v1/responses`;
    const response = await fetch(fetchUrl, {
      method: 'OPTIONS',
    });
    if (response.ok || response.status === 401 || response.status === 405) {
      return { success: true };
    }
    return { success: false, error: `HTTP ${response.status}` };
  } catch (err) {
    return { 
      success: false, 
      error: err instanceof Error ? err.message : 'Connection failed - check if gateway is running' 
    };
  }
}

export function GatewaySettings({ className, onSave, variant = 'button' }: GatewaySettingsProps) {
  const [isOpen, setIsOpen] = useState(variant === 'panel');
  const [url, setUrl] = useState('http://localhost:18789');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [saved, setSaved] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testMode, setTestMode] = useState<'basic' | 'full'>('basic');
  const [testResult, setTestResult] = useState<{
    success: boolean;
    stage?: string;
    message: string;
    details?: string;
  } | null>(null);

  // Load settings on mount
  useEffect(() => {
    const settings = getStoredSettings();
    setUrl(settings.url);
    setPassword(settings.password);
  }, []);

  const handleTest = async () => {
    setTesting(true);
    setTestResult(null);
    const settings = getStoredSettings();
    
    if (testMode === 'basic') {
      const result = await testBasicConnection(url, settings.useProxy);
      setTesting(false);
      setTestResult({
        success: result.success,
        message: result.success 
          ? '✅ Gateway reachable' 
          : `❌ ${result.error}`,
        details: result.success 
          ? 'Gateway responds to HTTP. Try "Full Test" to verify auth.' 
          : 'Gateway is not accepting HTTP connections.'
      });
    } else {
      // Full test with auth
      const settings = getStoredSettings();
      const result = await testFullConnection(url, password, settings.useProxy);
      setTesting(false);
      setTestResult({
        success: result.success,
        stage: result.stage,
        message: result.success 
          ? '✅ Full connection successful!' 
          : `❌ Failed at ${result.stage} stage`,
        details: result.details || result.error
      });
    }
  };

  const handleSave = () => {
    localStorage.setItem('clawbrain_gateway_url', url);
    localStorage.setItem('clawbrain_gateway_password', password);
    
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
    
    onSave?.();
    
    // Reload page to apply new settings
    window.location.reload();
  };

  const handleCancel = () => {
    const settings = getStoredSettings();
    setUrl(settings.url);
    setPassword(settings.password);
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
    <div className={cn('flex flex-col gap-3', variant === 'button' && 'p-4 border border-border bg-background min-w-[340px] max-w-[400px]', className)}>
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
          placeholder="ws://localhost:18789"
          className={cn(
            'px-3 py-2 text-xs font-mono',
            'border border-border bg-background',
            'focus:outline-none focus:border-foreground',
            'text-foreground placeholder:text-muted-foreground'
          )}
        />
        <p className="text-[10px] text-muted-foreground">
          Format: ws://host:port or wss://host:port
        </p>
      </div>

      {/* Password Input */}
      <div className="flex flex-col gap-1.5">
        <label className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider">
          Password (optional)
        </label>
        <div className="relative">
          <input
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              setTestResult(null);
            }}
            placeholder="Enter gateway password"
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

      {/* Test Mode Toggle */}
      <div className="flex gap-2">
        <button
          onClick={() => { setTestMode('basic'); setTestResult(null); }}
          className={cn(
            'flex-1 px-3 py-1.5 text-[10px] font-mono uppercase',
            'border transition-colors',
            testMode === 'basic'
              ? 'bg-foreground text-background border-foreground'
              : 'border-border text-muted-foreground hover:text-foreground'
          )}
        >
          Basic
        </button>
        <button
          onClick={() => { setTestMode('full'); setTestResult(null); }}
          className={cn(
            'flex-1 px-3 py-1.5 text-[10px] font-mono uppercase',
            'border transition-colors',
            testMode === 'full'
              ? 'bg-foreground text-background border-foreground'
              : 'border-border text-muted-foreground hover:text-foreground'
          )}
        >
          Full
        </button>
      </div>

      {/* Test Description */}
      <p className="text-[10px] text-muted-foreground">
        {testMode === 'basic' 
          ? 'Basic: Only checks if WebSocket opens (no auth)' 
          : 'Full: Tests complete flow including auth & session join'}
      </p>

      {/* Test Button */}
      <button
        onClick={handleTest}
        disabled={testing}
        className={cn(
          'flex items-center justify-center gap-1.5 px-3 py-2',
          'text-xs font-mono border transition-colors',
          testing 
            ? 'border-border text-muted-foreground' 
            : testMode === 'full'
              ? 'border-amber-500 text-amber-700 hover:bg-amber-50 dark:hover:bg-amber-950/30'
              : 'border-foreground text-foreground hover:bg-foreground hover:text-background'
        )}
      >
        {testing ? (
          <>
            <Loader2 className="w-3 h-3 animate-spin" />
            <span>Testing...</span>
          </>
        ) : testMode === 'full' ? (
          <>
            <Zap className="w-3 h-3" />
            <span>Test Full</span>
          </>
        ) : (
          <>
            <TestTube className="w-3 h-3" />
            <span>Test Basic</span>
          </>
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
          {testResult.stage && (
            <div className="text-[10px] uppercase opacity-70">
              Stage: {testResult.stage}
            </div>
          )}
          {testResult.details && (
            <div className="text-[10px] mt-1 opacity-90 border-t border-current/20 pt-1">
              {testResult.details}
            </div>
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
            <span>Saved - Reloading...</span>
          </>
        ) : (
          <span>Save & Connect</span>
        )}
      </button>

      {/* Help Text */}
      <div className="space-y-1.5 pt-2 border-t border-border">
        <p className="text-[10px] font-mono text-muted-foreground">
          Default: http://localhost:18789
        </p>
        <div className="text-[10px] text-muted-foreground space-y-0.5">
          <p>• If Basic passes but Full fails → Check password</p>
          <p>• If both fail → Gateway not running or wrong URL</p>
        </div>
      </div>
    </div>
  );
}

// Export settings for use in other components
export { getStoredSettings };
