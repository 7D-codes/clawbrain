/**
 * ChatWindow - Chat panel for sidebar integration
 * 
 * Mono wireframe aesthetic.
 * Can operate in compact mode (inside sidebar) or full mode.
 */

'use client';

import { useEffect, useRef, useState } from 'react';
import { useGatewayHTTP, getStoredSettings, type ConnectionState } from '@/lib/http-gateway';
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
} from 'lucide-react';

interface ChatWindowProps {
  compact?: boolean;
  className?: string;
}

export function ChatWindow({ compact, className }: ChatWindowProps) {
  const { 
    isConnected, 
    connectionState, 
    connectionError, 
    reconnect,
    isLoading, 
  } = useGatewayHTTP();
  
  const messages = useChatStore(selectMessages);
  const currentStreamingMessage = useChatStore(selectCurrentStreamingMessage);
  const scrollRef = useRef<HTMLDivElement>(null);
  const prevMessageCountRef = useRef<number>(0);
  const [gatewayUrl, setGatewayUrl] = useState('http://localhost:18789');

  // Get gateway URL on client side
  useEffect(() => {
    const cfg = getStoredSettings();
    setGatewayUrl(cfg.useProxy ? '/api/gateway' : cfg.url);
  }, []);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    const currentCount = messages.length + (currentStreamingMessage ? 1 : 0);
    if (currentCount !== prevMessageCountRef.current) {
      prevMessageCountRef.current = currentCount;
      if (scrollRef.current) {
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
      }
    }
  }, [messages.length, currentStreamingMessage?.content]);

  const getStatusDisplay = () => {
    switch (connectionState) {
      case 'connecting':
      case 'authenticating':
        return { 
          icon: <Loader2 className="w-3 h-3 animate-spin" />, 
          text: 'connecting...', 
          className: 'text-amber-600' 
        };
      case 'connected':
        return { 
          icon: <Wifi className="w-3 h-3" />, 
          text: 'connected', 
          className: 'text-green-600' 
        };
      case 'error':
        return { 
          icon: <AlertCircle className="w-3 h-3" />, 
          text: 'error', 
          className: 'text-destructive' 
        };
      default:
        return { 
          icon: <WifiOff className="w-3 h-3" />, 
          text: 'offline', 
          className: 'text-muted-foreground' 
        };
    }
  };

  const status = getStatusDisplay();
  const allMessages = currentStreamingMessage 
    ? [...messages, currentStreamingMessage] 
    : messages;

  return (
    <div className={cn(
      'flex flex-col h-full bg-background',
      className
    )}>
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-border bg-secondary/30">
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs font-medium">CHAT</span>
        </div>

        <div className="flex items-center gap-2">
          {/* Status */}
          <div className={cn('flex items-center gap-1 text-[10px] font-mono', status.className)}>
            {status.icon}
            <span className="hidden sm:inline">{status.text}</span>
          </div>

          {/* Retry button when error */}
          {(connectionState === 'error' || connectionState === 'disconnected') && (
            <button
              onClick={reconnect}
              className="p-1 hover:bg-secondary rounded"
              title="Reconnect"
            >
              <RefreshCw className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>

      {/* Messages area */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto overflow-x-hidden scroll-smooth min-h-0 p-2"
      >
        {allMessages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-4">
            <p className="text-xs text-muted-foreground">
              Start a conversation with your AI assistant
            </p>
          </div>
        ) : (
          <MessageList messages={allMessages} />
        )}
      </div>

      {/* Input area */}
      <div className="border-t border-border p-2">
        <MessageInput disabled={!isConnected || isLoading} />
      </div>

      {/* Status bar */}
      <div className="flex items-center justify-between px-3 py-1.5 border-t border-border bg-secondary/20 text-[10px] font-mono text-muted-foreground">
        <span>{messages.length} messages</span>
        {isLoading && <span className="animate-pulse">●</span>}
      </div>
    </div>
  );
}
