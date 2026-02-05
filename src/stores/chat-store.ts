/**
 * Chat Store - Zustand
 * 
 * Manages chat state including:
 * - Message history
 * - Connection status
 * - Loading states
 * - Streaming message handling
 */

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

// Message types
export type MessageRole = 'user' | 'assistant' | 'system';

export interface Message {
  id: string;
  role: MessageRole;
  content: string;
  createdAt: Date;
  isStreaming?: boolean;
}

// Chat state interface
interface ChatState {
  // Messages
  messages: Message[];
  currentStreamingMessage: Message | null;

  // Connection state
  isConnected: boolean;
  isLoading: boolean;
  error: string | null;

  // Actions
  setConnected: (connected: boolean) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;

  // Message actions
  addMessage: (message: Message) => void;
  updateMessage: (id: string, updates: Partial<Message>) => void;
  deleteMessage: (id: string) => void;
  clearMessages: () => void;

  // Streaming actions
  startStreamingMessage: () => void;
  appendToCurrentMessage: (content: string) => void;
  finalizeCurrentMessage: () => void;
  cancelStreaming: () => void;
}

// Generate unique ID
function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

// Create the store
export const useChatStore = create<ChatState>()(
  devtools(
    (set, get) => ({
      // Initial state
      messages: [],
      currentStreamingMessage: null,
      isConnected: false,
      isLoading: false,
      error: null,

      // Connection actions
      setConnected: (connected) => {
        set({ isConnected: connected }, false, 'setConnected');
      },

      setLoading: (loading) => {
        set({ isLoading: loading }, false, 'setLoading');
      },

      setError: (error) => {
        set({ error, isLoading: false }, false, 'setError');
      },

      clearError: () => {
        set({ error: null }, false, 'clearError');
      },

      // Message actions
      addMessage: (message) => {
        set(
          (state) => ({
            messages: [...state.messages, message],
          }),
          false,
          'addMessage'
        );
      },

      updateMessage: (id, updates) => {
        set(
          (state) => ({
            messages: state.messages.map((msg) =>
              msg.id === id ? { ...msg, ...updates } : msg
            ),
          }),
          false,
          'updateMessage'
        );
      },

      deleteMessage: (id) => {
        set(
          (state) => ({
            messages: state.messages.filter((msg) => msg.id !== id),
          }),
          false,
          'deleteMessage'
        );
      },

      clearMessages: () => {
        set(
          { messages: [], currentStreamingMessage: null },
          false,
          'clearMessages'
        );
      },

      // Streaming actions
      startStreamingMessage: () => {
        const newMessage: Message = {
          id: generateId(),
          role: 'assistant',
          content: '',
          createdAt: new Date(),
          isStreaming: true,
        };
        set(
          { currentStreamingMessage: newMessage },
          false,
          'startStreamingMessage'
        );
      },

      appendToCurrentMessage: (content) => {
        const state = get();

        // If we don't have a streaming message yet, start one
        if (!state.currentStreamingMessage) {
          get().startStreamingMessage();
        }

        set(
          (state) => {
            if (!state.currentStreamingMessage) return state;
            return {
              currentStreamingMessage: {
                ...state.currentStreamingMessage,
                content: state.currentStreamingMessage.content + content,
              },
            };
          },
          false,
          'appendToCurrentMessage'
        );
      },

      finalizeCurrentMessage: () => {
        const state = get();
        if (!state.currentStreamingMessage) {
          set({ isLoading: false }, false, 'finalizeCurrentMessage');
          return;
        }

        const finalizedMessage: Message = {
          ...state.currentStreamingMessage,
          isStreaming: false,
        };

        set(
          {
            messages: [...state.messages, finalizedMessage],
            currentStreamingMessage: null,
            isLoading: false,
          },
          false,
          'finalizeCurrentMessage'
        );
      },

      cancelStreaming: () => {
        set(
          { currentStreamingMessage: null, isLoading: false },
          false,
          'cancelStreaming'
        );
      },
    }),
    { name: 'chat-store' }
  )
);

// Selectors for performance
export const selectMessages = (state: ChatState) => state.messages;
export const selectIsConnected = (state: ChatState) => state.isConnected;
export const selectIsLoading = (state: ChatState) => state.isLoading;
export const selectError = (state: ChatState) => state.error;
export const selectCurrentStreamingMessage = (state: ChatState) =>
  state.currentStreamingMessage;

// Derived selectors
// Note: This selector may return a new array when currentStreamingMessage changes
// Use with caution in useEffect dependencies - prefer using messages + currentStreamingMessage separately
export const selectAllMessages = (state: ChatState): Message[] => {
  const { messages, currentStreamingMessage } = state;
  if (currentStreamingMessage) {
    return [...messages, currentStreamingMessage];
  }
  return messages;
};

// Stable selector that only returns the array reference (for dependency tracking)
export const selectMessagesArray = (state: ChatState): Message[] => state.messages;

// Selector for checking if we need to scroll (returns primitive)
export const selectMessageCount = (state: ChatState): number => {
  return state.messages.length + (state.currentStreamingMessage ? 1 : 0);
};

export const selectLastMessage = (state: ChatState): Message | null => {
  const allMessages = selectAllMessages(state);
  return allMessages[allMessages.length - 1] || null;
};


