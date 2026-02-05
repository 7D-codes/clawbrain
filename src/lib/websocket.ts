/**
 * Gateway WebSocket Client
 * 
 * Handles connection to OpenClaw Gateway with:
 * - Auto-reconnect with exponential backoff
 * - Auth with Gateway password
 * - Session management (clawbrain:main:main)
 * - Message streaming support
 */

import { useEffect, useRef, useCallback } from 'react';
import { useChatStore } from '@/stores/chat-store';

// Gateway connection configuration
const GATEWAY_URL = process.env.NEXT_PUBLIC_GATEWAY_URL || 'ws://localhost:18789';
const SESSION_KEY = 'clawbrain:main:main';
const RECONNECT_INITIAL_DELAY = 1000;
const RECONNECT_MAX_DELAY = 30000;
const RECONNECT_MAX_ATTEMPTS = 10;

// Message types from Gateway protocol
type GatewayMessage =
  | { type: 'auth'; params: { auth: { password: string } } }
  | { type: 'join'; sessionKey: string; label: string }
  | { type: 'message'; text: string; replyToCurrent?: boolean };

type GatewayResponse =
  | { type: 'chunk'; content: string; sessionKey?: string }
  | { type: 'done'; sessionKey?: string }
  | { type: 'error'; error: string; sessionKey?: string }
  | { type: 'auth_success' }
  | { type: 'auth_error'; error: string }
  | { type: 'joined'; sessionKey: string };

interface WebSocketState {
  ws: WebSocket | null;
  reconnectAttempts: number;
  reconnectTimeout: NodeJS.Timeout | null;
  isConnecting: boolean;
  isAuthenticated: boolean;
  messageQueue: string[];
}

class GatewayWebSocketClient {
  private state: WebSocketState = {
    ws: null,
    reconnectAttempts: 0,
    reconnectTimeout: null,
    isConnecting: false,
    isAuthenticated: false,
    messageQueue: [],
  };

  private password: string | null = null;
  private listeners: Set<(connected: boolean) => void> = new Set();
  private messageListeners: Set<(data: GatewayResponse) => void> = new Set();

  // Get current connection status
  isConnected(): boolean {
    return this.state.ws?.readyState === WebSocket.OPEN && this.state.isAuthenticated;
  }

  // Check if currently connecting
  isConnecting(): boolean {
    return this.state.isConnecting;
  }

  // Set the password for authentication
  setPassword(password: string): void {
    this.password = password;
    // Try to connect if not already connected
    if (!this.isConnected() && !this.state.isConnecting) {
      this.connect();
    }
  }

  // Get password from config or environment
  private getPassword(): string {
    if (this.password) return this.password;
    // Fallback to environment variable or default
    return process.env.NEXT_PUBLIC_GATEWAY_PASSWORD || '';
  }

  // Connect to Gateway
  connect(): void {
    if (this.state.isConnecting || this.isConnected()) {
      return;
    }

    this.state.isConnecting = true;
    this.notifyListeners();

    try {
      const ws = new WebSocket(GATEWAY_URL);

      ws.onopen = () => {
        console.log('[GatewayWebSocket] Connected, sending auth...');
        // Send auth message immediately on connect
        const authMessage: GatewayMessage = {
          type: 'auth',
          params: {
            auth: {
              password: this.getPassword(),
            },
          },
        };
        ws.send(JSON.stringify(authMessage));
      };

      ws.onmessage = (event) => {
        try {
          const data: GatewayResponse = JSON.parse(event.data);
          this.handleMessage(data);
        } catch (err) {
          console.error('[GatewayWebSocket] Failed to parse message:', err);
        }
      };

      ws.onclose = (event) => {
        console.log('[GatewayWebSocket] Disconnected:', event.code, event.reason);
        this.handleDisconnect();
      };

      ws.onerror = (error) => {
        console.error('[GatewayWebSocket] Error:', error);
        // Error will trigger onclose, which handles reconnect
      };

      this.state.ws = ws;
    } catch (err) {
      console.error('[GatewayWebSocket] Failed to connect:', err);
      this.state.isConnecting = false;
      this.scheduleReconnect();
    }
  }

  // Handle incoming messages
  private handleMessage(data: GatewayResponse): void {
    switch (data.type) {
      case 'auth_success':
        console.log('[GatewayWebSocket] Auth successful, joining session...');
        this.state.isAuthenticated = true;
        // Join the session after auth
        this.send({
          type: 'join',
          sessionKey: SESSION_KEY,
          label: 'main',
        });
        break;

      case 'auth_error':
        console.error('[GatewayWebSocket] Auth failed:', data.error);
        this.state.isAuthenticated = false;
        // Don't reconnect on auth error - need correct password
        this.disconnect();
        break;

      case 'joined':
        console.log('[GatewayWebSocket] Joined session:', data.sessionKey);
        this.state.isConnecting = false;
        this.state.reconnectAttempts = 0;
        this.notifyListeners();
        // Send any queued messages
        this.flushMessageQueue();
        break;

      case 'chunk':
      case 'done':
      case 'error':
        // Forward streaming messages to listeners
        this.messageListeners.forEach((listener) => listener(data));
        break;

      default:
        console.log('[GatewayWebSocket] Received:', data);
    }
  }

  // Handle disconnection
  private handleDisconnect(): void {
    this.state.ws = null;
    this.state.isConnecting = false;
    this.state.isAuthenticated = false;
    this.notifyListeners();
    this.scheduleReconnect();
  }

  // Schedule reconnect with exponential backoff
  private scheduleReconnect(): void {
    if (this.state.reconnectTimeout) {
      clearTimeout(this.state.reconnectTimeout);
    }

    if (this.state.reconnectAttempts >= RECONNECT_MAX_ATTEMPTS) {
      console.log('[GatewayWebSocket] Max reconnect attempts reached');
      return;
    }

    const delay = Math.min(
      RECONNECT_INITIAL_DELAY * Math.pow(2, this.state.reconnectAttempts),
      RECONNECT_MAX_DELAY
    );

    console.log(`[GatewayWebSocket] Reconnecting in ${delay}ms (attempt ${this.state.reconnectAttempts + 1})`);

    this.state.reconnectTimeout = setTimeout(() => {
      this.state.reconnectAttempts++;
      this.connect();
    }, delay);
  }

  // Send a message to the Gateway
  send(message: GatewayMessage): boolean {
    if (!this.isConnected()) {
      console.log('[GatewayWebSocket] Not connected, queueing message');
      this.state.messageQueue.push(JSON.stringify(message));
      return false;
    }

    try {
      this.state.ws?.send(JSON.stringify(message));
      return true;
    } catch (err) {
      console.error('[GatewayWebSocket] Send failed:', err);
      this.state.messageQueue.push(JSON.stringify(message));
      return false;
    }
  }

  // Send a chat message
  sendMessage(text: string, replyToCurrent: boolean = true): boolean {
    return this.send({
      type: 'message',
      text,
      replyToCurrent,
    });
  }

  // Flush queued messages
  private flushMessageQueue(): void {
    while (this.state.messageQueue.length > 0) {
      const message = this.state.messageQueue.shift();
      if (message) {
        this.state.ws?.send(message);
      }
    }
  }

  // Disconnect and cleanup
  disconnect(): void {
    if (this.state.reconnectTimeout) {
      clearTimeout(this.state.reconnectTimeout);
      this.state.reconnectTimeout = null;
    }

    if (this.state.ws) {
      this.state.ws.close();
      this.state.ws = null;
    }

    this.state.isConnecting = false;
    this.state.isAuthenticated = false;
    this.state.reconnectAttempts = 0;
    this.state.messageQueue = [];
    this.notifyListeners();
  }

  // Subscribe to connection status changes
  onConnectionChange(listener: (connected: boolean) => void): () => void {
    this.listeners.add(listener);
    // Immediately notify with current state
    listener(this.isConnected());
    return () => this.listeners.delete(listener);
  }

  // Subscribe to incoming messages
  onMessage(listener: (data: GatewayResponse) => void): () => void {
    this.messageListeners.add(listener);
    return () => this.messageListeners.delete(listener);
  }

  private notifyListeners(): void {
    const connected = this.isConnected();
    this.listeners.forEach((listener) => listener(connected));
  }
}

// Singleton instance
let clientInstance: GatewayWebSocketClient | null = null;

export function getGatewayClient(): GatewayWebSocketClient {
  if (!clientInstance) {
    clientInstance = new GatewayWebSocketClient();
  }
  return clientInstance;
}

// Reset singleton (useful for testing)
export function resetGatewayClient(): void {
  if (clientInstance) {
    clientInstance.disconnect();
    clientInstance = null;
  }
}

// React hook for using the WebSocket client
export function useGatewayWebSocket() {
  const store = useChatStore();
  const clientRef = useRef(getGatewayClient());
  const unsubscribeRef = useRef<(() => void) | null>(null);
  const messageUnsubscribeRef = useRef<(() => void) | null>(null);

  // Setup connection listener
  useEffect(() => {
    const client = clientRef.current;

    // Subscribe to connection changes
    unsubscribeRef.current = client.onConnectionChange((connected) => {
      store.setConnected(connected);
    });

    // Subscribe to messages
    messageUnsubscribeRef.current = client.onMessage((data) => {
      switch (data.type) {
        case 'chunk':
          if (data.content) {
            store.appendToCurrentMessage(data.content);
          }
          break;
        case 'done':
          store.finalizeCurrentMessage();
          break;
        case 'error':
          store.setError(data.error);
          store.finalizeCurrentMessage();
          break;
      }
    });

    // Try to connect if not already connected
    if (!client.isConnected() && !client.isConnecting()) {
      client.connect();
    }

    return () => {
      unsubscribeRef.current?.();
      messageUnsubscribeRef.current?.();
    };
  }, [store]);

  const sendMessage = useCallback((text: string) => {
    // Add user message to store
    store.addMessage({
      id: `user-${Date.now()}`,
      role: 'user',
      content: text,
      createdAt: new Date(),
    });

    // Set loading state
    store.setLoading(true);
    store.clearError();

    // Send via WebSocket
    const sent = clientRef.current.sendMessage(text);

    if (!sent) {
      // Message was queued, will be sent when connected
      console.log('[useGatewayWebSocket] Message queued for delivery');
    }
  }, [store]);

  const reconnect = useCallback(() => {
    clientRef.current.connect();
  }, []);

  const setPassword = useCallback((password: string) => {
    clientRef.current.setPassword(password);
  }, []);

  return {
    isConnected: store.isConnected,
    isLoading: store.isLoading,
    error: store.error,
    sendMessage,
    reconnect,
    setPassword,
  };
}

export type { GatewayResponse, GatewayMessage };
export { GatewayWebSocketClient, SESSION_KEY, GATEWAY_URL };
