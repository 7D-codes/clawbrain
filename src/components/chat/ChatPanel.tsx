/**
 * ChatPanel - Main chat container
 * 
 * Mono wireframe grid aesthetic:
 * - Sharp corners (0 radius)
 * - 1px borders, no shadows
 * - Space Grotesk for UI
 * - JetBrains Mono for timestamps
 */

'use client';

import { useEffect, useRef, useState } from 'react';
import { useGatewayHTTP, getStoredSettings, type ConnectionState } from '@/lib/http-gateway';
import { useChatStore, selectMessages, selectCurrentStreamingMessage } from '@/stores/chat-store';
import { MessageList } from './MessageList';
import { MessageInput } from './MessageInput';
import { GatewaySettings } from './GatewaySettings';
import { cn } from '@/lib/utils';
import { 
  Wifi, 
  WifiOff, 
  AlertCircle, 
  Loader2, 
  RefreshCw,
  Terminal,
  X
} from 'lucide-react';

interface ChatPanelProps {
  className?: string;
}

export function ChatPanel({ className }: ChatPanelProps) {
  const { 
    isConnected, 
    connectionState, 
    connectionError, 
    reconnectAttempt,
    isLoading, 
    error, 
    reconnect 
  } = useGatewayHTTP();
  
  const messages = useChatStore(selectMessages);
  const currentStreamingMessage = useChatStore(selectCurrentStreamingMessage);
  const scrollRef = useRef<HTMLDivElement>(null);
  const prevMessageCountRef = useRef<number>(0);
  const [gatewayUrl, setGatewayUrl] = useState('http://localhost:18789');
  const [showDiagnostics, setShowDiagnostics] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  const logsRef = useRef<HTMLDivElement>(null);

  // Get gateway URL on client side
  useEffect(() => {
    const cfg = getStoredSettings();
    setGatewayUrl(cfg.url);
  }, []);

  // Capture console logs for diagnostics
  useEffect(() => {
    if (!showDiagnostics) return;
    
    const originalLog = console.log;
    const originalError = console.error;
    
    const captureLog = (...args: unknown[]) => {
      originalLog(...args);
      const message = args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' ');
      if (message.includes('[Gateway]') || message.includes('WebSocket')) {
        setLogs(prev => [...prev.slice(-50), `[${new Date().toLocaleTimeString()}] ${message}`]);
      }
    };
    
    console.log = captureLog;
    console.error = captureLog;
    
    return () => {
      console.log = originalLog;
      console.error = originalError;
    };
  }, [showDiagnostics]);

  // Auto-scroll logs
  useEffect(() => {
    if (logsRef.current) {
      logsRef.current.scrollTop = logsRef.current.scrollHeight;
    }
  }, [logs]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    const currentCount = messages.length + (currentStreamingMessage ? 1 : 0);
    if (currentCount !== prevMessageCountRef.current) {
      prevMessageCountRef.current = currentCount;
      if (scrollRef.current) {
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
      }
    }
  }, [messages.length, currentStreamingMessage?.id]);

  const getStatusDisplay = () => {
    switch (connectionState) {
      case 'connecting':
        return { 
          icon: <Loader2 className="w-3 h-3 animate-spin" />, 
          text: 'CONNECTING...', 
          className: 'text-amber-600 border-amber-300 bg-amber-50' 
        };
      case 'authenticating':
        return { 
          icon: <Loader2 className="w-3 h-3 animate-spin" />, 
          text: 'AUTH...', 
          className: 'text-amber-600 border-amber-300 bg-amber-50' 
        };
      case 'connected':
        return { 
          icon: <Wifi className="w-3 h-3" />, 
          text: 'CONNECTED', 
          className: 'text-green-700 border-green-300 bg-green-50' 
        };
      case 'error':
        return { 
          icon: <AlertCircle className="w-3 h-3" />, 
          text: 'ERROR', 
          className: 'text-destructive border-destructive/50 bg-destructive/10' 
        };
      case 'disconnected':
      case 'idle':
      default:
        return { 
          icon: <WifiOff className="w-3 h-3" />, 
          text: 'OFFLINE', 
          className: 'text-muted-foreground border-border/50 bg-secondary/30' 
        };
    }
  };

  const status = getStatusDisplay();

  return (
    <div
      className={cn(
        'flex flex-col h-full border border-border bg-background',
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-secondary/30">
        <div className="flex items-center gap-3">
          <h2 className="font-sans text-sm font-medium text-foreground tracking-tight">
            CLAW
          </h2>
          <span className="text-muted-foreground text-xs">/</span>
          <span className="font-mono text-xs text-muted-foreground uppercase tracking-wider">
            Chat
          </span>
        </div>

        {/* Connection status */}
        <div className="flex items-center gap-2">
          {/* Diagnostics Toggle */}
          {!isConnected && (
            <button
              onClick={() => setShowDiagnostics(!showDiagnostics)}
              className={cn(
                'flex items-center gap-1.5 px-2 py-1 text-xs font-mono',
                'border transition-colors',
                showDiagnostics 
                  ? 'bg-foreground text-background border-foreground' 
                  : 'text-muted-foreground border-border hover:border-foreground hover:text-foreground'
              )}
              title="Toggle diagnostics"
            >
              <Terminal className="w-3 h-3" />
              <span>Debug</span>
            </button>
          )}

          {/* Settings */}
          {!isConnected && (
            <GatewaySettings 
              className="mr-1"
              onSave={() => {
                setGatewayUrl(getStoredSettings().url);
                reconnect();
              }}
            />
          )}

          {/* Retry Button */}
          {(connectionState === 'error' || connectionState === 'disconnected' || connectionState === 'idle') && (
            <button
              onClick={reconnect}
              className="flex items-center gap-1.5 px-2 py-1 text-xs font-mono text-destructive hover:bg-destructive/10 transition-colors border border-destructive/30"
              title="Click to reconnect"
            >
              <RefreshCw className="w-3 h-3" />
              <span>RETRY</span>
            </button>
          )}

          {/* Status Badge */}
          <div
            className={cn(
              'flex items-center gap-1.5 px-2 py-1 text-xs font-mono border',
              status.className
            )}
          >
            {status.icon}
            <span>{status.text}</span>
            {reconnectAttempt > 0 && connectionState === 'connecting' && (
              <span className="text-[10px] opacity-70">({reconnectAttempt})</span>
            )}
          </div>
        </div>
      </div>

      {/* Diagnostics Panel */}
      {showDiagnostics && !isConnected && (
        <div className="border-b border-border bg-black text-green-400 font-mono text-xs">
          <div className="flex items-center justify-between px-3 py-2 border-b border-border/30">
            <span className="uppercase tracking-wider">Connection Diagnostics</span>
            <button 
              onClick={() => setShowDiagnostics(false)}
              className="hover:text-white"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
          
          <div className="p-3 space-y-2">
            {/* Connection Info */}
            <div className="grid grid-cols-2 gap-2 text-[10px]">
              <div className="text-muted-foreground">URL:</div>
              <div className="truncate">{gatewayUrl}</div>
              
              <div className="text-muted-foreground">State:</div>
              <div className="uppercase">{connectionState}</div>
              
              <div className="text-muted-foreground">Attempts:</div>
              <div>{reconnectAttempt} / 10</div>
            </div>

            {/* Error Display */}
            {(connectionError || error) && (
              <div className="border border-red-500/30 bg-red-500/10 p-2 rounded">
                <div className="text-red-400 text-[10px] uppercase mb-1">Error:</div>
                <div className="text-red-300">{connectionError || error}</div>
              </div>
            )}

            {/* Live Logs */}
            <div>
              <div className="text-muted-foreground text-[10px] uppercase mb-1">Live Logs:</div>
              <div 
                ref={logsRef}
                className="h-24 overflow-y-auto bg-black/50 p-2 text-[10px] space-y-1 font-mono"
              >
                {logs.length === 0 ? (
                  <span className="text-muted-foreground italic">Waiting for logs...</span>
                ) : (
                  logs.map((log, i) => (
                    <div key={i} className="truncate">{log}</div>
                  ))
                )}
              </div>
            </div>

            {/* Quick Test */}
            <button
              onClick={() => {
                const ws = new WebSocket(gatewayUrl);
                ws.onopen = () => {
                  console.log('[Gateway] Test connection successful!');
                  ws.close();
                };
                ws.onerror = (e) => {
                  console.log('[Gateway] Test connection failed:', e);
                };
              }}
              className="w-full py-1.5 text-[10px] uppercase border border-green-500/30 text-green-400 hover:bg-green-500/10 transition-colors"
            >
              Test Connection
            </button>
          </div>
        </div>
      )}

      {/* Messages area */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto overflow-x-hidden scroll-smooth"
      >
        <MessageList messages={currentStreamingMessage ? [...messages, currentStreamingMessage] : messages} />
      </div>

      {/* Input area */}
      <div className="border-t border-border">
        <MessageInput disabled={!isConnected || isLoading} />
      </div>

      {/* Status bar */}
      <div className="flex items-center justify-between px-4 py-1.5 border-t border-border bg-secondary/20">
        <div className="flex items-center gap-4">
          <span className="font-mono text-[10px] text-muted-foreground uppercase tracking-wider">
            {messages.length} message{messages.length !== 1 ? 's' : ''}
          </span>
          {isLoading && (
            <span className="font-mono text-[10px] text-muted-foreground animate-pulse">
              ● streaming
            </span>
          )}
        </div>
        <div 
          className="font-mono text-[10px] text-muted-foreground truncate max-w-[200px]"
          title={gatewayUrl}
        >
          {gatewayUrl}
        </div>
      </div>
    </div>
  );
}
