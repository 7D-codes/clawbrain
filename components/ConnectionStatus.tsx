'use client';

import { useEffect, useState } from 'react';
import { getOpenClawClient } from '@/lib/openclaw';
import { Wifi, WifiOff, Server } from 'lucide-react';

export function ConnectionStatus() {
  const [status, setStatus] = useState<'connected' | 'disconnected' | 'connecting'>('connecting');
  const [lastMessage, setLastMessage] = useState<string>('');
  
  useEffect(() => {
    const client = getOpenClawClient();
    
    // Check connection status
    const checkStatus = () => {
      const ws = (client as any).ws;
      if (ws?.readyState === WebSocket.OPEN) {
        setStatus('connected');
      } else if (ws?.readyState === WebSocket.CONNECTING) {
        setStatus('connecting');
      } else {
        setStatus('disconnected');
      }
    };
    
    checkStatus();
    const interval = setInterval(checkStatus, 2000);
    
    // Listen for events
    const unsubscribe = client.on('agent.message', (data) => {
      setLastMessage(typeof data === 'string' ? data : JSON.stringify(data).slice(0, 50));
    });
    
    return () => {
      clearInterval(interval);
      unsubscribe();
    };
  }, []);
  
  const statusConfig = {
    connected: { icon: Wifi, color: '#22c55e', text: 'Connected to OpenClaw' },
    connecting: { icon: Server, color: '#f59e0b', text: 'Connecting...' },
    disconnected: { icon: WifiOff, color: '#ef4444', text: 'Disconnected' }
  };
  
  const config = statusConfig[status];
  const Icon = config.icon;
  
  return (
    <div style={{
      position: 'fixed',
      bottom: 20,
      right: 20,
      display: 'flex',
      alignItems: 'center',
      gap: 8,
      padding: '8px 12px',
      background: '#18181b',
      border: '1px solid #27272a',
      borderRadius: 8,
      fontSize: 12,
      color: config.color,
      zIndex: 100
    }}>
      <Icon size={14} />
      <span>{config.text}</span>
      {lastMessage && status === 'connected' && (
        <span style={{ color: '#71717a', marginLeft: 8 }}>
          Last: {lastMessage}...
        </span>
      )}
    </div>
  );
}
