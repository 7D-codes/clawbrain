'use client';

import { useState, useEffect } from 'react';
import { testFullConnection, getGatewayUrl, getGatewayClient } from '@/lib/websocket';
import { Button } from '@/components/ui/button';

interface TestResult {
  stage: 'idle' | 'running' | 'connect' | 'auth' | 'success' | 'error';
  success?: boolean;
  error?: string;
  details?: string;
}

export function GatewayDiagnostics() {
  const [result, setResult] = useState<TestResult>({ stage: 'idle' });
  const [password, setPassword] = useState('');
  const [gatewayUrl, setGatewayUrl] = useState('');
  const [deviceKeys, setDeviceKeys] = useState<{ exists: boolean; id?: string }>({ exists: false });

  useEffect(() => {
    setGatewayUrl(getGatewayUrl());
    if (typeof window !== 'undefined') {
      const keys = localStorage.getItem('clawbrain_device_keys');
      const id = localStorage.getItem('clawbrain_device_id');
      setDeviceKeys({ exists: !!keys, id: id || undefined });
    }
  }, []);

  const runTest = async () => {
    setResult({ stage: 'running' });
    const testResult = await testFullConnection(gatewayUrl, password);
    setResult({
      ...testResult,
      stage: testResult.success ? 'success' : testResult.stage,
    });
  };

  const clearDeviceKeys = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('clawbrain_device_keys');
      localStorage.removeItem('clawbrain_device_id');
      localStorage.removeItem('clawbrain_device_token');
      setDeviceKeys({ exists: false });
      getGatewayClient().disconnect();
    }
  };

  const savePassword = () => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('clawbrain_gateway_password', password);
      getGatewayClient().setPassword(password);
    }
  };

  const getStatusColor = () => {
    switch (result.stage) {
      case 'success': return 'bg-green-500';
      case 'error': return 'bg-red-500';
      case 'running': return 'bg-yellow-500 animate-pulse';
      default: return 'bg-gray-500';
    }
  };

  return (
    <div className="space-y-4 p-1">
      {/* Header */}
      <div className="flex items-center gap-2 mb-3">
        <span className="font-mono text-xs uppercase font-medium">Gateway Diagnostics</span>
        <div className={`w-2 h-2 rounded-full ${getStatusColor()}`} />
      </div>

      {/* Gateway URL */}
      <div className="space-y-1.5">
        <label className="text-[10px] font-mono text-muted-foreground uppercase">Gateway URL</label>
        <input
          value={gatewayUrl}
          onChange={(e) => setGatewayUrl(e.target.value)}
          placeholder="ws://localhost:18789"
          className="w-full px-2 py-1.5 text-xs font-mono border border-border bg-background focus:outline-none focus:border-foreground"
        />
      </div>

      {/* Password */}
      <div className="space-y-1.5">
        <label className="text-[10px] font-mono text-muted-foreground uppercase">Gateway Password</label>
        <div className="flex gap-2">
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter gateway password"
            className="flex-1 px-2 py-1.5 text-xs font-mono border border-border bg-background focus:outline-none focus:border-foreground"
          />
          <Button onClick={savePassword} variant="outline" size="sm" className="text-xs">
            Save
          </Button>
        </div>
      </div>

      {/* Device Keys Status */}
      <div className="flex items-center justify-between p-2 border rounded bg-background/50">
        <div>
          <p className="text-xs font-medium">Device Keys</p>
          <p className="text-[10px] text-muted-foreground">
            {deviceKeys.exists ? `ID: ${deviceKeys.id?.slice(0, 16)}...` : 'Not generated'}
          </p>
        </div>
        <div className="flex gap-2 items-center">
          <span className={`text-[10px] px-1.5 py-0.5 rounded ${deviceKeys.exists ? 'bg-primary text-primary-foreground' : 'bg-destructive text-destructive-foreground'}`}>
            {deviceKeys.exists ? 'Present' : 'Missing'}
          </span>
          {deviceKeys.exists && (
            <Button onClick={clearDeviceKeys} variant="destructive" size="sm" className="text-[10px] h-6 px-2">
              Clear
            </Button>
          )}
        </div>
      </div>

      {/* Test Button */}
      <Button 
        onClick={runTest} 
        disabled={result.stage === 'running'}
        className="w-full text-xs"
        size="sm"
      >
        {result.stage === 'running' ? 'Testing...' : 'Test Full Connection'}
      </Button>

      {/* Results */}
      {result.stage !== 'idle' && result.stage !== 'running' && (
        <div className={`p-3 rounded border text-xs space-y-1.5 ${result.success ? 'bg-green-500/10 border-green-500/30 text-green-700 dark:text-green-400' : 'bg-red-500/10 border-red-500/30 text-red-700 dark:text-red-400'}`}>
          <div className="flex items-center gap-2">
            <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${result.success ? 'bg-green-500 text-white' : 'bg-red-500 text-white'}`}>
              {result.success ? 'SUCCESS' : 'FAILED'}
            </span>
            <span className="font-medium">Stage: {result.stage}</span>
          </div>
          {result.error && (
            <div>
              <p className="font-medium text-[10px] uppercase opacity-70">Error:</p>
              <p className="text-[11px]">{result.error}</p>
            </div>
          )}
          {result.details && (
            <div>
              <p className="font-medium text-[10px] uppercase opacity-70">Details:</p>
              <p className="text-[11px]">{result.details}</p>
            </div>
          )}
        </div>
      )}

      {/* Help Text */}
      <div className="text-[10px] text-muted-foreground space-y-1 pt-2 border-t border-border">
        <p className="font-medium">Common Issues:</p>
        <ul className="list-disc list-inside space-y-0.5">
          <li><code className="bg-muted px-1 rounded">connect</code> fail: Gateway not running</li>
          <li><code className="bg-muted px-1 rounded">auth</code> fail: Wrong password or device auth rejected</li>
          <li>Device keys missing: Will auto-generate on first connection</li>
          <li>Crypto API: Requires HTTPS or localhost</li>
        </ul>
      </div>
    </div>
  );
}
