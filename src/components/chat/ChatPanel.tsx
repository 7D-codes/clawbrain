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
import { useGatewayWebSocket, getGatewayUrl } from '@/lib/websocket';
import { useChatStore, selectMessages, selectCurrentStreamingMessage } from '@/stores/chat-store';
import { MessageList } from './MessageList';
import { MessageInput } from './MessageInput';
import { GatewaySettings } from './GatewaySettings';
import { cn } from '@/lib/utils';
import { Wifi, WifiOff, AlertCircle } from 'lucide-react';

interface ChatPanelProps {
  className?: string;
}

export function ChatPanel({ className }: ChatPanelProps) {
  const { isConnected, isLoading, error, reconnect } = useGatewayWebSocket();
  // Use stable selectors to avoid infinite re-renders
  const messages = useChatStore(selectMessages);
  const currentStreamingMessage = useChatStore(selectCurrentStreamingMessage);
  const scrollRef = useRef<HTMLDivElement>(null);
  const prevMessageCountRef = useRef<number>(0);
  const [gatewayUrl, setGatewayUrl] = useState('ws://localhost:18789');

  // Get gateway URL on client side
  useEffect(() => {
    setGatewayUrl(getGatewayUrl());
  }, []);

  // Auto-scroll to bottom when new messages arrive (use count, not array)
  useEffect(() => {
    const currentCount = messages.length + (currentStreamingMessage ? 1 : 0);
    // Only scroll if message count changed
    if (currentCount !== prevMessageCountRef.current) {
      prevMessageCountRef.current = currentCount;
      if (scrollRef.current) {
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
      }
    }
  }, [messages.length, currentStreamingMessage?.id]); // Use stable primitives

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
          {!isConnected && (
            <GatewaySettings 
              className="mr-1"
              onSave={() => {
                setGatewayUrl(getGatewayUrl());
                reconnect();
              }}
            />
          )}
          {error && (
            <button
              onClick={reconnect}
              className="flex items-center gap-1.5 px-2 py-1 text-xs font-mono text-destructive hover:bg-destructive/10 transition-colors border border-destructive/30"
              title="Click to reconnect"
            >
              <AlertCircle className="w-3 h-3" />
              <span>RETRY</span>
            </button>
          )}
          <div
            className={cn(
              'flex items-center gap-1.5 px-2 py-1 text-xs font-mono border',
              isConnected
                ? 'text-foreground border-border bg-secondary/50'
                : 'text-muted-foreground border-border/50 bg-secondary/30'
            )}
          >
            {isConnected ? (
              <>
                <Wifi className="w-3 h-3" />
                <span>CONNECTED</span>
              </>
            ) : (
              <>
                <WifiOff className="w-3 h-3" />
                <span>OFFLINE</span>
              </>
            )}
          </div>
        </div>
      </div>

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
        <div className="font-mono text-[10px] text-muted-foreground" title={gatewayUrl}>
          {gatewayUrl.length > 25 ? gatewayUrl.slice(0, 25) + '...' : gatewayUrl}
        </div>
      </div>
    </div>
  );
}
