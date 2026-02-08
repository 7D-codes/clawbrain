/**
 * ChatWindow - Chat panel with zero-config OpenClaw integration
 */

'use client';

import { useEffect, useRef } from 'react';
import { useOpenClawGateway } from '@/lib/gateway-client';
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
  Lock,
  CheckCircle,
} from 'lucide-react';

interface ChatWindowProps {
  className?: string;
}

export function ChatWindow({ className }: ChatWindowProps) {
  const { 
    connectionState, 
    connectionError, 
    submitAuth,
    reconnect,
    sendMessage,
    isConnected,
    isLoading,
  } = useOpenClawGateway();
  
  const messages = useChatStore(selectMessages);
  const currentStreamingMessage = useChatStore(selectCurrentStreamingMessage);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages.length, currentStreamingMessage?.content]);

  const allMessages = currentStreamingMessage 
    ? [...messages, currentStreamingMessage] 
    : messages;

  // Render connection status
  const renderStatus = () => {
    switch (connectionState) {
      case 'checking':
        return (
          <div className="flex items-center gap-2 text-amber-600">
            <Loader2 className="w-3 h-3 animate-spin" />
            <span className="text-[10px] font-mono">Looking for OpenClaw...</span>
          </div>
        );
      case 'needs-auth':
        return (
          <div className="flex items-center gap-2 text-amber-600">
            <Lock className="w-3 h-3" />
            <span className="text-[10px] font-mono">Needs password</span>
          </div>
        );
      case 'connecting':
        return (
          <div className="flex items-center gap-2 text-amber-600">
            <Loader2 className="w-3 h-3 animate-spin" />
            <span className="text-[10px] font-mono">Connecting...</span>
          </div>
        );
      case 'connected':
        return (
          <div className="flex items-center gap-2 text-green-600">
            <CheckCircle className="w-3 h-3" />
            <span className="text-[10px] font-mono">Connected</span>
          </div>
        );
      case 'error':
      case 'disconnected':
        return (
          <div className="flex items-center gap-2 text-destructive">
            <WifiOff className="w-3 h-3" />
            <button 
              onClick={reconnect}
              className="text-[10px] font-mono hover:underline"
            >
              Disconnected - Retry?
            </button>
          </div>
        );
    }
  };

  return (
    <div className={cn('flex flex-col h-full bg-background', className)}>
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-border bg-secondary/30">
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs font-medium">CLAW</span>
        </div>
        {renderStatus()}
      </div>

      {/* Auth Prompt */}
      {connectionState === 'needs-auth' && <AuthPrompt onSubmit={submitAuth} error={connectionError} />}

      {/* Error Banner */}
      {connectionState === 'error' && connectionError && (
        <div className="px-3 py-2 bg-destructive/10 border-b border-destructive/20">
          <p className="text-xs text-destructive">{connectionError}</p>
        </div>
      )}

      {/* Messages area */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto overflow-x-hidden scroll-smooth min-h-0 p-2"
      >
        {allMessages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-4">
            {connectionState === 'checking' ? (
              <>
                <Loader2 className="w-8 h-8 animate-spin text-muted-foreground mb-4" />
                <p className="text-sm text-muted-foreground">Looking for OpenClaw Gateway...</p>
              </>
            ) : connectionState === 'needs-auth' ? (
              <>
                <Lock className="w-8 h-8 text-muted-foreground mb-4" />
                <p className="text-sm text-muted-foreground">Enter your gateway password to connect</p>
              </>
            ) : (
              <>
                <p className="text-sm text-muted-foreground">Start a conversation with your AI assistant</p>
                <p className="text-xs text-muted-foreground mt-2">Try: "Create a task to review the codebase"</p>
              </>
            )}
          </div>
        ) : (
          <MessageList messages={allMessages} />
        )}
      </div>

      {/* Input area */}
      <div className="border-t border-border p-2">
        <MessageInput 
          disabled={!isConnected || isLoading} 
          onSend={sendMessage}
        />
      </div>

      {/* Status bar */}
      <div className="flex items-center justify-between px-3 py-1.5 border-t border-border bg-secondary/20 text-[10px] font-mono text-muted-foreground">
        <span>{messages.length} messages</span>
        {isLoading && <span className="animate-pulse">●</span>}
      </div>
    </div>
  );
}

// Auth prompt component
function AuthPrompt({ onSubmit, error }: { onSubmit: (auth: { password: string }) => void; error?: string | null }) {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password.trim()) {
      onSubmit({ password: password.trim() });
    }
  };

  return (
    <div className="p-4 border-b border-border bg-amber-50 dark:bg-amber-950/20">
      <div className="flex items-center gap-2 mb-3">
        <Lock className="w-4 h-4 text-amber-600" />
        <span className="text-sm font-medium">Connect to OpenClaw</span>
      </div>
      
      <p className="text-xs text-muted-foreground mb-3">
        Found OpenClaw Gateway at localhost:18789. Enter your password to connect.
      </p>
      
      {error && (
        <p className="text-xs text-destructive mb-3">{error}</p>
      )}
      
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type={showPassword ? 'text' : 'password'}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Gateway password"
          className="flex-1 px-2 py-1.5 text-sm border border-border bg-background focus:outline-none focus:ring-1 focus:ring-foreground"
        />
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="px-2 py-1.5 text-xs border border-border hover:bg-secondary"
        >
          {showPassword ? 'Hide' : 'Show'}
        </button>
        
        <button
          type="submit"
          disabled={!password.trim()}
          className="px-3 py-1.5 text-xs bg-foreground text-background hover:bg-foreground/90 disabled:opacity-50"
        >
          Connect
        </button>
      </form>
      
      <p className="text-[10px] text-muted-foreground mt-2">
        This will be saved locally. You can change it in Settings.
      </p>
    </div>
  );
}

import { useState } from 'react';
