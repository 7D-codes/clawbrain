/**
 * Gateway WebSocket Client
 * 
 * Handles connection to OpenClaw Gateway with:
 * - Auto-reconnect with exponential backoff
 * - Auth with Gateway password
 * - Session management (clawbrain:main:main)
 * - Message streaming support
 * - Detailed connection diagnostics
 */

import { useEffect, useRef, useCallback, useState } from 'react';
import { useChatStore } from '@/stores/chat-store';

// Gateway connection configuration
const SESSION_KEY = 'clawbrain:main:main';

// Get gateway URL from localStorage or env/default
function getGatewayUrl(): string {
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem('clawbrain_gateway_url');
    if (stored) return stored;
  }
  return process.env.NEXT_PUBLIC_GATEWAY_URL || 'ws://localhost:18789';
}

// Get gateway password from localStorage or env
function getStoredPassword(): string {
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem('clawbrain_gateway_password');
    if (stored) return stored;
  }
  return process.env.NEXT_PUBLIC_GATEWAY_PASSWORD || '';
}

// Test full connection including auth
function testFullConnection(
  url: string, 
  password: string
): Promise<{ 
  success: boolean; 
  stage: 'connect' | 'auth' | 'join' | 'success';
  error?: string;
  details?: string;
}> {
  return new Promise((resolve) => {
    let stage: 'connect' | 'auth' | 'join' | 'success' = 'connect';
    let ws: WebSocket | null = null;
    
    const timeout = setTimeout(() => {
      if (ws) ws.close();
      resolve({ 
        success: false, 
        stage, 
        error: `Timeout at stage: ${stage}`,
        details: stage === 'connect' 
          ? 'WebSocket failed to open within 5 seconds' 
          : stage === 'auth' 
            ? 'No auth response received' 
            : 'No session join response received'
      });
    }, 10000);

    try {
      ws = new WebSocket(url);
      
      ws.onopen = () => {
        stage = 'auth';
        // Send auth message
        const authMessage = {
          type: 'auth',
          params: {
            auth: { password },
          },
        };
        ws?.send(JSON.stringify(authMessage));
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          if (data.type === 'auth_success') {
            stage = 'join';
            // Send join message
            const joinMessage = {
              type: 'join',
              sessionKey: SESSION_KEY,
              label: 'main',
            };
            ws?.send(JSON.stringify(joinMessage));
          } else if (data.type === 'auth_error') {
            clearTimeout(timeout);
            ws?.close();
            resolve({ 
              success: false, 
              stage: 'auth', 
              error: `Auth failed: ${data.error}`,
              details: 'The gateway rejected the password. Check your password in settings.'
            });
          } else if (data.type === 'joined') {
            clearTimeout(timeout);
            ws?.close();
            resolve({ success: true, stage: 'success' });
          }
        } catch (err) {
          clearTimeout(timeout);
          ws?.close();
          resolve({ 
            success: false, 
            stage, 
            error: 'Invalid message format',
            details: err instanceof Error ? err.message : 'Unknown error'
          });
        }
      };

      ws.onerror = (e) => {
        clearTimeout(timeout);
        resolve({ 
          success: false, 
          stage, 
          error: stage === 'connect' ? 'Connection failed' : 'WebSocket error',
          details: stage === 'connect' 
            ? 'Could not establish WebSocket connection. Check if gateway is running.'
            : 'Error during communication'
        });
      };

      ws.onclose = (e) => {
        clearTimeout(timeout);
        if (stage !== 'success') {
          resolve({ 
            success: false, 
            stage, 
            error: `Connection closed (code: ${e.code})`,
            details: stage === 'connect' 
              ? 'WebSocket closed before auth. Gateway may require authentication.'
              : `Closed during ${stage} stage`
          });
        }
      };
    } catch (err) {
      clearTimeout(timeout);
      resolve({ 
        success: false, 
        stage: 'connect', 
        error: 'Failed to create WebSocket',
        details: err instanceof Error ? err.message : 'Invalid URL'
      });
    }
  });
}

const RECONNECT_INITIAL_DELAY = 1000;
const RECONNECT_MAX_DELAY = 30000;
const RECONNECT_MAX_ATTEMPTS = 10;

// Connection states for better UI feedback
export type ConnectionState = 
  | 'idle' 
  | 'connecting' 
  | 'authenticating'
  | 'connected' 
  | 'disconnected' 
  | 'error';

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

// Debug log with timestamps
function debugLog(message: string, data?: unknown) {
  const timestamp = new Date().toISOString().split('T')[1].split('.')[0];
  if (data) {
    console.log(`[${timestamp}] [Gateway] ${message}`, data);
  } else {
    console.log(`[${timestamp}] [Gateway] ${message}`);
  }
}

interface WebSocketState {
  ws: WebSocket | null;
  reconnectAttempts: number;
  reconnectTimeout: NodeJS.Timeout | null;
  isConnecting: boolean;
  isAuthenticated: boolean;
  messageQueue: string[];
  connectionState: ConnectionState;
  lastError: string | null;
}

class GatewayWebSocketClient {
  private state: WebSocketState = {
    ws: null,
    reconnectAttempts: 0,
    reconnectTimeout: null,
    isConnecting: false,
    isAuthenticated: false,
    messageQueue: [],
    connectionState: 'idle',
    lastError: null,
  };

  private password: string | null = null;
  private listeners: Set<(connected: boolean) => void> = new Set();
  private stateListeners: Set<(state: ConnectionState) => void> = new Set();
  private messageListeners: Set<(data: GatewayResponse) => void> = new Set();
  private errorListeners: Set<(error: string) => void> = new Set();

  // Get current connection status
  isConnected(): boolean {
    return this.state.ws?.readyState === WebSocket.OPEN && this.state.isAuthenticated;
  }

  // Check if currently connecting
  isConnecting(): boolean {
    return this.state.isConnecting;
  }

  // Get connection state
  getConnectionState(): ConnectionState {
    return this.state.connectionState;
  }

  // Get last error
  getLastError(): string | null {
    return this.state.lastError;
  }

  // Set the password for authentication
  setPassword(password: string): void {
    this.password = password;
    // Try to connect if not already connected
    if (!this.isConnected() && !this.state.isConnecting) {
      this.connect();
    }
  }

  // Get password from config, localStorage, or environment
  private getPassword(): string {
    if (this.password) return this.password;
    return getStoredPassword();
  }

  // Update connection state and notify listeners
  private setConnectionState(state: ConnectionState) {
    this.state.connectionState = state;
    this.stateListeners.forEach(listener => listener(state));
  }

  // Connect to Gateway
  connect(): void {
    if (this.state.isConnecting || this.isConnected()) {
      debugLog('Already connecting or connected, skipping');
      return;
    }

    this.state.isConnecting = true;
    this.state.lastError = null;
    this.setConnectionState('connecting');
    this.notifyListeners();

    const url = getGatewayUrl();
    debugLog(`Connecting to ${url}...`);

    try {
      const ws = new WebSocket(url);

      ws.onopen = () => {
        debugLog('WebSocket opened, sending auth...');
        this.setConnectionState('authenticating');
        
        // Send auth message immediately on connect
        const password = this.getPassword();
        const authMessage: GatewayMessage = {
          type: 'auth',
          params: {
            auth: {
              password,
            },
          },
        };
        
        try {
          ws.send(JSON.stringify(authMessage));
          debugLog('Auth message sent');
        } catch (err) {
          debugLog('Failed to send auth message:', err);
          this.handleError('Failed to send auth message');
        }
      };

      ws.onmessage = (event) => {
        try {
          const data: GatewayResponse = JSON.parse(event.data);
          debugLog('Received message:', data.type);
          this.handleMessage(data);
        } catch (err) {
          debugLog('Failed to parse message:', err);
          this.handleError('Invalid message format from gateway');
        }
      };

      ws.onclose = (event) => {
        debugLog(`WebSocket closed: code=${event.code}, reason=${event.reason || 'none'}`);
        this.handleDisconnect();
      };

      ws.onerror = (error) => {
        debugLog('WebSocket error:', error);
        this.handleError('Connection failed - check if gateway is running');
        // Error will trigger onclose, which handles reconnect
      };

      this.state.ws = ws;
    } catch (err) {
      debugLog('Failed to create WebSocket:', err);
      this.state.isConnecting = false;
      this.handleError(err instanceof Error ? err.message : 'Failed to create connection');
      this.scheduleReconnect();
    }
  }

  // Handle errors
  private handleError(error: string) {
    this.state.lastError = error;
    this.setConnectionState('error');
    this.errorListeners.forEach(listener => listener(error));
    this.notifyListeners();
  }

  // Handle incoming messages
  private handleMessage(data: GatewayResponse): void {
    switch (data.type) {
      case 'auth_success':
        debugLog('Auth successful, joining session...');
        this.state.isAuthenticated = true;
        // Join the session after auth
        this.send({
          type: 'join',
          sessionKey: SESSION_KEY,
          label: 'main',
        });
        break;

      case 'auth_error':
        debugLog('Auth failed:', data.error);
        this.state.isAuthenticated = false;
        this.handleError(`Authentication failed: ${data.error}`);
        // Don't reconnect on auth error - need correct password
        this.disconnect();
        break;

      case 'joined':
        debugLog(`Joined session: ${data.sessionKey}`);
        this.state.isConnecting = false;
        this.state.reconnectAttempts = 0;
        this.setConnectionState('connected');
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
        debugLog('Received unknown message type:', data);
    }
  }

  // Handle disconnection
  private handleDisconnect(): void {
    const wasConnected = this.isConnected();
    this.state.ws = null;
    this.state.isConnecting = false;
    this.state.isAuthenticated = false;
    
    if (wasConnected) {
      this.setConnectionState('disconnected');
    }
    
    this.notifyListeners();
    
    // Only reconnect if we were connected or trying to connect
    if (this.state.connectionState !== 'error') {
      this.scheduleReconnect();
    }
  }

  // Schedule reconnect with exponential backoff
  private scheduleReconnect(): void {
    if (this.state.reconnectTimeout) {
      clearTimeout(this.state.reconnectTimeout);
    }

    if (this.state.reconnectAttempts >= RECONNECT_MAX_ATTEMPTS) {
      debugLog('Max reconnect attempts reached');
      this.handleError('Max reconnect attempts reached - check gateway status');
      return;
    }

    const delay = Math.min(
      RECONNECT_INITIAL_DELAY * Math.pow(2, this.state.reconnectAttempts),
      RECONNECT_MAX_DELAY
    );

    debugLog(`Reconnecting in ${delay}ms (attempt ${this.state.reconnectAttempts + 1}/${RECONNECT_MAX_ATTEMPTS})`);
    this.setConnectionState('connecting');

    this.state.reconnectTimeout = setTimeout(() => {
      this.state.reconnectAttempts++;
      this.connect();
    }, delay);
  }

  // Send a message to the Gateway
  send(message: GatewayMessage): boolean {
    if (!this.isConnected()) {
      debugLog('Not connected, queueing message');
      this.state.messageQueue.push(JSON.stringify(message));
      return false;
    }

    try {
      this.state.ws?.send(JSON.stringify(message));
      return true;
    } catch (err) {
      debugLog('Send failed:', err);
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
    debugLog('Disconnecting...');
    
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
    this.setConnectionState('idle');
    this.notifyListeners();
  }

  // Subscribe to connection status changes
  onConnectionChange(listener: (connected: boolean) => void): () => void {
    this.listeners.add(listener);
    // Immediately notify with current state
    listener(this.isConnected());
    return () => this.listeners.delete(listener);
  }

  // Subscribe to connection state changes
  onStateChange(listener: (state: ConnectionState) => void): () => void {
    this.stateListeners.add(listener);
    // Immediately notify with current state
    listener(this.state.connectionState);
    return () => this.stateListeners.delete(listener);
  }

  // Subscribe to errors
  onError(listener: (error: string) => void): () => void {
    this.errorListeners.add(listener);
    return () => this.errorListeners.delete(listener);
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
  // Use individual selectors instead of the entire store object
  const setConnected = useChatStore(useCallback((state) => state.setConnected, []));
  const addMessage = useChatStore(useCallback((state) => state.addMessage, []));
  const appendToCurrentMessage = useChatStore(useCallback((state) => state.appendToCurrentMessage, []));
  const finalizeCurrentMessage = useChatStore(useCallback((state) => state.finalizeCurrentMessage, []));
  const setLoading = useChatStore(useCallback((state) => state.setLoading, []));
  const setError = useChatStore(useCallback((state) => state.setError, []));
  const clearError = useChatStore(useCallback((state) => state.clearError, []));
  
  // Local state for connection details
  const [connectionState, setConnectionState] = useState<ConnectionState>('idle');
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [reconnectAttempt, setReconnectAttempt] = useState(0);
  
  const clientRef = useRef(getGatewayClient());
  const unsubscribeRef = useRef<(() => void) | null>(null);
  const messageUnsubscribeRef = useRef<(() => void) | null>(null);
  const stateUnsubscribeRef = useRef<(() => void) | null>(null);
  const errorUnsubscribeRef = useRef<(() => void) | null>(null);

  // Setup connection listener - stable dependencies
  useEffect(() => {
    const client = clientRef.current;
    debugLog('Setting up WebSocket listeners');

    // Subscribe to connection changes
    unsubscribeRef.current = client.onConnectionChange((connected) => {
      setConnected(connected);
    });

    // Subscribe to state changes
    stateUnsubscribeRef.current = client.onStateChange((state) => {
      setConnectionState(state);
      setReconnectAttempt(client['state'].reconnectAttempts);
    });

    // Subscribe to errors
    errorUnsubscribeRef.current = client.onError((error) => {
      setConnectionError(error);
      setError(error);
    });

    // Subscribe to messages
    messageUnsubscribeRef.current = client.onMessage((data) => {
      switch (data.type) {
        case 'chunk':
          if (data.content) {
            appendToCurrentMessage(data.content);
          }
          break;
        case 'done':
          finalizeCurrentMessage();
          break;
        case 'error':
          setError(data.error);
          finalizeCurrentMessage();
          break;
      }
    });

    // Try to connect if not already connected
    if (!client.isConnected() && !client.isConnecting()) {
      debugLog('Initiating connection...');
      client.connect();
    }

    return () => {
      debugLog('Cleaning up WebSocket listeners');
      unsubscribeRef.current?.();
      messageUnsubscribeRef.current?.();
      stateUnsubscribeRef.current?.();
      errorUnsubscribeRef.current?.();
    };
  }, [setConnected, appendToCurrentMessage, finalizeCurrentMessage, setError]);

  const sendMessage = useCallback((text: string) => {
    // Add user message to store
    addMessage({
      id: `user-${Date.now()}`,
      role: 'user',
      content: text,
      createdAt: new Date(),
    });

    // Set loading state
    setLoading(true);
    clearError();
    setConnectionError(null);

    // Send via WebSocket
    const sent = clientRef.current.sendMessage(text);

    if (!sent) {
      debugLog('Message queued for delivery');
    }
  }, [addMessage, setLoading, clearError]);

  const reconnect = useCallback(() => {
    debugLog('Manual reconnect triggered');
    setConnectionError(null);
    clientRef.current.disconnect();
    // Small delay to ensure disconnect completes
    setTimeout(() => clientRef.current.connect(), 100);
  }, []);

  const setPassword = useCallback((password: string) => {
    clientRef.current.setPassword(password);
  }, []);

  const disconnect = useCallback(() => {
    clientRef.current.disconnect();
  }, []);

  return {
    isConnected: clientRef.current.isConnected(),
    connectionState,
    connectionError,
    reconnectAttempt,
    isLoading: useChatStore(useCallback((state) => state.isLoading, [])),
    error: useChatStore(useCallback((state) => state.error, [])),
    sendMessage,
    reconnect,
    disconnect,
    setPassword,
  };
}

export type { GatewayResponse, GatewayMessage };
export { GatewayWebSocketClient, SESSION_KEY, getGatewayUrl, testFullConnection };
