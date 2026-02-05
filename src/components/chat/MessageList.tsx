/**
 * MessageList - Display chat messages
 * 
 * Mono wireframe grid aesthetic:
 * - Sharp corners, 1px borders
 * - User messages: right-aligned, subtle bg
 * - Assistant messages: left-aligned with left border accent
 * - JetBrains Mono for timestamps
 * - Space Grotesk for content
 */

'use client';

import { Message, MessageRole } from '@/stores/chat-store';
import { cn } from '@/lib/utils';
import { User, Bot } from 'lucide-react';
import { format } from 'date-fns';

interface MessageListProps {
  messages: Message[];
  className?: string;
}

export function MessageList({ messages, className }: MessageListProps) {
  if (messages.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center">
        <div className="space-y-4">
          <div className="flex items-center justify-center w-12 h-12 border border-border bg-secondary/50">
            <Bot className="w-5 h-5 text-muted-foreground" />
          </div>
          <div className="space-y-1">
            <h3 className="font-sans text-sm font-medium text-foreground">
              Start a conversation
            </h3>
            <p className="font-sans text-xs text-muted-foreground max-w-[200px]">
              Send a message to connect with OpenClaw Gateway
            </p>
          </div>
        </div>
        <div className="mt-8 grid grid-cols-1 gap-2 w-full max-w-[280px]">
          <QuickPrompt text="Create a task to review the codebase" />
          <QuickPrompt text="What tasks are currently in progress?" />
          <QuickPrompt text="Summarize today's progress" />
        </div>
      </div>
    );
  }

  return (
    <div className={cn('flex flex-col gap-0', className)}>
      {messages.map((message, index) => (
        <MessageItem
          key={message.id}
          message={message}
          showTimestamp={shouldShowTimestamp(messages, index)}
          isLast={index === messages.length - 1}
        />
      ))}
    </div>
  );
}

interface MessageItemProps {
  message: Message;
  showTimestamp: boolean;
  isLast: boolean;
}

function MessageItem({ message, showTimestamp, isLast }: MessageItemProps) {
  const isUser = message.role === 'user';
  const isStreaming = message.isStreaming;

  return (
    <div
      className={cn(
        'group flex gap-3 px-4 py-4',
        isUser ? 'flex-row-reverse' : 'flex-row',
        !isLast && 'border-b border-border/50',
        isUser ? 'bg-transparent' : 'bg-secondary/20'
      )}
    >
      {/* Avatar */}
      <div
        className={cn(
          'flex-shrink-0 w-7 h-7 flex items-center justify-center border',
          isUser
            ? 'border-border bg-foreground text-background'
            : 'border-border bg-secondary text-foreground'
        )}
      >
        {isUser ? (
          <User className="w-3.5 h-3.5" />
        ) : (
          <Bot className="w-3.5 h-3.5" />
        )}
      </div>

      {/* Content wrapper */}
      <div className={cn('flex flex-col gap-1.5', isUser ? 'items-end' : 'items-start')}>
        {/* Header with role and timestamp */}
        <div
          className={cn(
            'flex items-center gap-2',
            isUser ? 'flex-row-reverse' : 'flex-row'
          )}
        >
          <span className="font-sans text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
            {isUser ? 'You' : 'Claw'}
          </span>
          {showTimestamp && (
            <span className="font-mono text-[10px] text-muted-foreground">
              {format(message.createdAt, 'HH:mm:ss')}
            </span>
          )}
        </div>

        {/* Message content */}
        <div
          className={cn(
            'max-w-[85%] text-sm leading-relaxed font-sans',
            isUser ? 'text-foreground text-right' : 'text-foreground text-left'
          )}
        >
          {isUser ? (
            <p className="whitespace-pre-wrap">{message.content}</p>
          ) : (
            <AssistantContent content={message.content} />
          )}
          {isStreaming && (
            <span className="inline-block w-1.5 h-3 ml-0.5 bg-foreground animate-pulse" />
          )}
        </div>
      </div>
    </div>
  );
}

function AssistantContent({ content }: { content: string }) {
  // Simple markdown-like rendering for assistant messages
  const lines = content.split('\n');

  return (
    <div className="space-y-2">
      {lines.map((line, i) => {
        // Heading
        if (line.startsWith('# ')) {
          return (
            <h1 key={i} className="text-base font-semibold text-foreground">
              {line.slice(2)}
            </h1>
          );
        }
        if (line.startsWith('## ')) {
          return (
            <h2 key={i} className="text-sm font-semibold text-foreground">
              {line.slice(3)}
            </h2>
          );
        }

        // Code block
        if (line.startsWith('```')) {
          return null; // Handled by block detection below
        }

        // Bullet list
        if (line.startsWith('- ') || line.startsWith('* ')) {
          return (
            <div key={i} className="flex items-start gap-2 pl-2">
              <span className="text-muted-foreground mt-1.5">•</span>
              <span className="text-muted-foreground">{line.slice(2)}</span>
            </div>
          );
        }

        // Empty line
        if (line.trim() === '') {
          return <div key={i} className="h-1" />;
        }

        // Inline code
        const parts = line.split(/(`[^`]+`)/g);
        if (parts.length > 1) {
          return (
            <p key={i} className="text-muted-foreground">
              {parts.map((part, j) => {
                if (part.startsWith('`') && part.endsWith('`')) {
                  return (
                    <code
                      key={j}
                      className="px-1 py-0.5 font-mono text-xs bg-secondary border border-border text-foreground"
                    >
                      {part.slice(1, -1)}
                    </code>
                  );
                }
                return <span key={j}>{part}</span>;
              })}
            </p>
          );
        }

        // Regular paragraph
        return (
          <p key={i} className="text-muted-foreground">
            {line}
          </p>
        );
      })}
    </div>
  );
}

function QuickPrompt({ text }: { text: string }) {
  const handleClick = () => {
    // Dispatch custom event to be handled by parent component
    const event = new CustomEvent('quickPrompt', { detail: text });
    window.dispatchEvent(event);
  };

  return (
    <button
      onClick={handleClick}
      className="text-left px-3 py-2 text-xs font-sans text-muted-foreground border border-border/50 hover:border-border hover:bg-secondary/50 transition-colors"
    >
      {text}
    </button>
  );
}

// Helper to determine if timestamp should be shown
function shouldShowTimestamp(messages: Message[], index: number): boolean {
  if (index === 0) return true;

  const current = messages[index];
  const previous = messages[index - 1];

  // Show timestamp if role changes
  if (current.role !== previous.role) return true;

  // Show timestamp if more than 5 minutes passed
  const diff = current.createdAt.getTime() - previous.createdAt.getTime();
  if (diff > 5 * 60 * 1000) return true;

  return false;
}
