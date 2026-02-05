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
import { Settings, Check, X, Eye, EyeOff } from 'lucide-react';

interface GatewaySettingsProps {
  className?: string;
  onSave?: () => void;
}

// Get current settings from localStorage or defaults
function getStoredSettings() {
  if (typeof window === 'undefined') {
    return { url: 'ws://localhost:18789', password: '' };
  }
  return {
    url: localStorage.getItem('clawbrain_gateway_url') || 'ws://localhost:18789',
    password: localStorage.getItem('clawbrain_gateway_password') || '',
  };
}

export function GatewaySettings({ className, onSave }: GatewaySettingsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [url, setUrl] = useState('ws://localhost:18789');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [saved, setSaved] = useState(false);

  // Load settings on mount
  useEffect(() => {
    const settings = getStoredSettings();
    setUrl(settings.url);
    setPassword(settings.password);
  }, []);

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
    setIsOpen(false);
  };

  if (!isOpen) {
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

  return (
    <div className={cn('flex flex-col gap-3 p-3 border border-border bg-background', className)}>
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-foreground">Gateway Settings</span>
        <button
          onClick={handleCancel}
          className="text-muted-foreground hover:text-foreground"
        >
          <X className="w-3 h-3" />
        </button>
      </div>

      {/* URL Input */}
      <div className="flex flex-col gap-1">
        <label className="text-[10px] font-mono text-muted-foreground uppercase">
          WebSocket URL
        </label>
        <input
          type="text"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="ws://localhost:18789"
          className={cn(
            'px-2 py-1.5 text-xs font-mono',
            'border border-border bg-background',
            'focus:outline-none focus:border-foreground',
            'text-foreground placeholder:text-muted-foreground'
          )}
        />
      </div>

      {/* Password Input */}
      <div className="flex flex-col gap-1">
        <label className="text-[10px] font-mono text-muted-foreground uppercase">
          Password (optional)
        </label>
        <div className="relative">
          <input
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter gateway password"
            className={cn(
              'w-full px-2 py-1.5 text-xs font-mono',
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

      {/* Save Button */}
      <button
        onClick={handleSave}
        disabled={saved}
        className={cn(
          'flex items-center justify-center gap-1.5 px-3 py-1.5',
          'text-xs font-mono',
          saved
            ? 'bg-green-500/20 text-green-600 border border-green-500/50'
            : 'bg-foreground text-background hover:bg-foreground/90',
          'transition-colors'
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
      <p className="text-[10px] font-mono text-muted-foreground">
        Default: ws://localhost:18789
      </p>
    </div>
  );
}

// Export settings for use in other components
export { getStoredSettings };
