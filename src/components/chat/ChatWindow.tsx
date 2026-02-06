/**
 * ChatWindow - Chat as a collapsible window panel (not a sidebar)
 * 
 * Positioned on the left side of the screen.
 * Can be toggled open/closed.
 * Mono wireframe grid aesthetic.
 */

'use client';

import { useEffect, useRef, useState } from 'react';
import { useGatewayHTTP, getStoredSettings, testFullConnection, type ConnectionState } from '@/lib/http-gateway';
import { useChatStore, selectMessages, selectCurrentStreamingMessage } from '@/stores/chat-store';
import { MessageList } from './MessageList';
import { MessageInput } from './MessageInput';
import { cn } from '@/lib/utils';
import { 
  Wifi, 
  WifiOff, 
  AlertCircle, 
  Loader2, 
  RefreshCw,
  PanelLeftClose,
  Terminal,
  X
} from 'lucide-react';

interface ChatWindowProps {
  isOpen: boolean;
  onToggle: () => void;
  className?: string;
}

export function ChatWindow({ isOpen, onToggle, className }: ChatWindowProps) {
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
    setGatewayUrl(cfg.useProxy ? '/api/gateway (proxy)' : cfg.url);
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
          text: '...', 
          className: 'text-amber-600 border-amber-300 bg-amber-50 dark:bg-amber-950/30' 
        };
      case 'authenticating':
        return { 
          icon: <Loader2 className="w-3 h-3 animate-spin" />, 
          text: '...', 
          className: 'text-amber-600 border-amber-300 bg-amber-50 dark:bg-amber-950/30' 
        };
      case 'connected':
        return { 
          icon: <Wifi className="w-3 h-3" />, 
          text: '', 
          className: 'text-green-700 border-green-300 bg-green-50 dark:bg-green-950/30' 
        };
      case 'error':
        return { 
          icon: <AlertCircle className="w-3 h-3" />, 
          text: '', 
          className: 'text-destructive border-destructive/50 bg-destructive/10' 
        };
      case 'disconnected':
      case 'idle':
      default:
        return { 
          icon: <WifiOff className="w-3 h-3" />, 
          text: '', 
          className: 'text-muted-foreground border-border/50 bg-secondary/30' 
        };
    }
  };

  const status = getStatusDisplay();

  // Collapsed state - show as a thin vertical bar with toggle
  if (!isOpen) {
    return (
      <div 
        className={cn(
          'flex flex-col h-full border-r border-border bg-background',
          'w-10 items-center py-3 gap-3',
          className
        )}
      >
        <button
          onClick={onToggle}
          className="p-2 text-muted-foreground hover:text-foreground hover:bg-accent border border-transparent hover:border-border transition-colors"
          title="Open chat"
        >
          <PanelLeftClose className="h-4 w-4 rotate-180" />
        </button>
        
        <div className="flex-1" />
        
        {/* Status indicator */}
        <div 
          className={cn(
            'w-2 h-2 border',
            status.className
          )}
          title={connectionState}
        />
      </div>
    );
  }

  return (
    <div
      className={cn(
        'flex flex-col h-full border-r border-border bg-background',
        'w-full sm:w-[380px] lg:w-[420px]',
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-border bg-secondary/30">
        <div className="flex items-center gap-2">
          <button
            onClick={onToggle}
            className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-accent border border-transparent hover:border-border transition-colors"
            title="Close chat"
          >
            <PanelLeftClose className="h-4 w-4" />
          </button>
          
          <div className="flex items-center gap-2">
            <span className="font-sans text-sm font-medium text-foreground tracking-tight">
              CLAW
            </span>
            <span className="text-muted-foreground text-xs">/</span>
            <span className="font-mono text-xs text-muted-foreground uppercase tracking-wider">
              Chat
            </span>
          </div>
        </div>

        {/* Connection status & actions */}
        <div className="flex items-center gap-1.5">
          {/* Diagnostics Toggle */}
          {!isConnected && (
            <button
              onClick={() => setShowDiagnostics(!showDiagnostics)}
              className={cn(
                'flex items-center gap-1 px-1.5 py-1 text-[10px] font-mono',
                'border transition-colors',
                showDiagnostics 
                  ? 'bg-foreground text-background border-foreground' 
                  : 'text-muted-foreground border-border hover:border-foreground hover:text-foreground'
              )}
              title="Toggle diagnostics"
            >
              <Terminal className="w-3 h-3" />
            </button>
          )}

          {/* Retry Button */}
          {(connectionState === 'error' || connectionState === 'disconnected' || connectionState === 'idle') && (
            <button
              onClick={reconnect}
              className="flex items-center gap-1 px-1.5 py-1 text-[10px] font-mono text-destructive hover:bg-destructive/10 transition-colors border border-destructive/30"
              title="Reconnect"
            >
              <RefreshCw className="w-3 h-3" />
            </button>
          )}

          {/* Status Badge */}
          <div
            className={cn(
              'flex items-center gap-1 px-1.5 py-1 text-[10px] font-mono border',
              status.className
            )}
          >
            {status.icon}
            {status.text && <span>{status.text}</span>}
          </div>
        </div>
      </div>

      {/* Diagnostics Panel */}
      {showDiagnostics && !isConnected && (
        <div className="border-b border-border bg-black text-green-400 font-mono text-xs">
          <div className="flex items-center justify-between px-3 py-2 border-b border-border/30">
            <span className="uppercase tracking-wider">Diagnostics</span>
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
              <div className="border border-red-500/30 bg-red-500/10 p-2">
                <div className="text-red-400 text-[10px] uppercase mb-1">Error:</div>
                <div className="text-red-300">{connectionError || error}</div>
              </div>
            )}

            {/* Live Logs */}
            <div>
              <div className="text-muted-foreground text-[10px] uppercase mb-1">Live Logs:</div>
              <div 
                ref={logsRef}
                className="h-20 overflow-y-auto bg-black/50 p-2 text-[10px] space-y-1 font-mono"
              >
                {logs.length === 0 ? (
                  <span className="text-muted-foreground italic">Waiting...</span>
                ) : (
                  logs.map((log, i) => (
                    <div key={i} className="truncate">{log}</div>
                  ))
                )}
              </div>
            </div>

            {/* Quick Test */}
            <button
              onClick={async () => {
                console.log('[Gateway] Testing HTTP connection...');
                const settings = getStoredSettings();
                const result = await testFullConnection(gatewayUrl, settings.password, settings.useProxy);
                console.log('[Gateway] Test result:', result);
              }}
              className="w-full py-1 text-[10px] uppercase border border-green-500/30 text-green-400 hover:bg-green-500/10 transition-colors"
            >
              Test Connection
            </button>
          </div>
        </div>
      )}

      {/* Messages area */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto overflow-x-hidden scroll-smooth min-h-0"
      >
        <MessageList messages={currentStreamingMessage ? [...messages, currentStreamingMessage] : messages} />
      </div>

      {/* Input area */}
      <div className="border-t border-border">
        <MessageInput disabled={!isConnected || isLoading} />
      </div>

      {/* Status bar */}
      <div className="flex items-center justify-between px-3 py-1.5 border-t border-border bg-secondary/20">
        <div className="flex items-center gap-3">
          <span className="font-mono text-[10px] text-muted-foreground uppercase tracking-wider">
            {messages.length} msg
          </span>
          {isLoading && (
            <span className="font-mono text-[10px] text-muted-foreground animate-pulse">
              ●
            </span>
          )}
        </div>
        <div 
          className="font-mono text-[10px] text-muted-foreground truncate max-w-[150px]"
          title={gatewayUrl}
        >
          {gatewayUrl.replace('ws://', '').replace('wss://', '')}
        </div>
      </div>
    </div>
  );
}
