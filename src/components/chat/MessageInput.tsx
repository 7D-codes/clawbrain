/**
 * MessageInput - Chat input field
 * 
 * Mono wireframe grid aesthetic:
 * - Sharp corners, 1px borders
 * - No shadows
 * - Space Grotesk for UI text
 * - Full-width input with send button
 */

'use client';

import { useState, useRef, useEffect, KeyboardEvent } from 'react';
import { useGatewayWebSocket } from '@/lib/websocket';
import { cn } from '@/lib/utils';
import { Send, Loader2 } from 'lucide-react';

interface MessageInputProps {
  disabled?: boolean;
  className?: string;
}

export function MessageInput({ disabled, className }: MessageInputProps) {
  const [text, setText] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { sendMessage, isLoading } = useGatewayWebSocket();

  // Handle quick prompt events from MessageList
  useEffect(() => {
    const handleQuickPrompt = (e: Event) => {
      const customEvent = e as CustomEvent<string>;
      setText(customEvent.detail);
      textareaRef.current?.focus();
    };

    window.addEventListener('quickPrompt', handleQuickPrompt);
    return () => window.removeEventListener('quickPrompt', handleQuickPrompt);
  }, [setText]); // setText is stable from useState

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    textarea.style.height = 'auto';
    const newHeight = Math.min(textarea.scrollHeight, 200);
    textarea.style.height = `${newHeight}px`;
  }, [text]);

  const handleSubmit = () => {
    if (!text.trim() || disabled || isLoading) return;

    sendMessage(text.trim());
    setText('');

    // Reset height
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const canSubmit = text.trim().length > 0 && !disabled && !isLoading;

  return (
    <div className={cn('p-4 bg-background', className)}>
      <div
        className={cn(
          'flex items-end gap-2 border bg-background transition-colors',
          disabled ? 'border-border/50 bg-secondary/30' : 'border-border focus-within:border-border-strong'
        )}
      >
        {/* Text input */}
        <textarea
          ref={textareaRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={disabled ? 'Connect to send messages...' : 'Type a message...'}
          disabled={disabled}
          rows={1}
          className={cn(
            'flex-1 resize-none bg-transparent px-3 py-2.5 text-sm font-sans',
            'placeholder:text-muted-foreground/60',
            'focus:outline-none',
            'disabled:cursor-not-allowed disabled:opacity-50',
            'min-h-[40px] max-h-[200px]'
          )}
        />

        {/* Send button */}
        <button
          onClick={handleSubmit}
          disabled={!canSubmit}
          className={cn(
            'flex-shrink-0 m-1 p-2 transition-colors',
            'border border-transparent',
            canSubmit
              ? 'bg-foreground text-background hover:bg-foreground/90'
              : 'bg-transparent text-muted-foreground/50 cursor-not-allowed'
          )}
          aria-label="Send message"
        >
          {isLoading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Send className="w-4 h-4" />
          )}
        </button>
      </div>

      {/* Keyboard hint */}
      <div className="flex items-center justify-between mt-2 px-1">
        <span className="font-mono text-[10px] text-muted-foreground/60">
          {disabled ? (
            'Waiting for connection...'
          ) : (
            <>
              <kbd className="px-1 py-0.5 border border-border bg-secondary font-mono text-[9px]">Enter</kbd>
              {' '}to send
              {' '}
              <kbd className="px-1 py-0.5 border border-border bg-secondary font-mono text-[9px]">Shift+Enter</kbd>
              {' '}for new line
            </>
          )}
        </span>
        <span className="font-mono text-[10px] text-muted-foreground/60">
          {text.length} chars
        </span>
      </div>
    </div>
  );
}
