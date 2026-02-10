/**
 * OpenClaw Gateway Client
 * 
 * Based on OpenClaw Studio's battle-tested implementation.
 * Uses native WebSocket with proper auth handshake.
 */

import { useEffect, useRef, useCallback, useState } from 'react';
import { useChatStore } from '@/stores/chat-store';

const DEFAULT_GATEWAY_URL = 'ws://127.0.0.1:18789';
const WS_RECONNECT_INTERVAL = 3000;
const MAX_RECONNECT_ATTEMPTS = 5;

export type ConnectionState = 
  | 'checking'      // Auto-detecting gateway
  | 'needs-auth'    // Gateway found, needs password/token
  | 'connecting'    // WS handshake in progress
  | 'connected'     // Fully connected
  | 'disconnected'  // Disconnected
  | 'error';        // Error state

// Frame types matching OpenClaw protocol
export type ReqFrame = {
  type: 'req';
  id: string;
  method: string;
  params?: unknown;
};

export type ResFrame = {
  type: 'res';
  id: string;
  ok: boolean;
  payload?: unknown;
  error?: {
    code: string;
    message: string;
    details?: unknown;
    retryable?: boolean;
    retryAfterMs?: number;
  };
};

export type EventFrame = {
  type: 'event';
  event: string;
  payload?: unknown;
  seq?: number;
};

export type GatewayFrame = ReqFrame | ResFrame | EventFrame;

// Parse gateway frame
const parseGatewayFrame = (raw: string): GatewayFrame | null => {
  try {
    return JSON.parse(raw) as GatewayFrame;
  } catch {
    return null;
  }
};

// Generate UUID
const generateUUID = (): string => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

// Get stored auth
function getStoredAuth(): { token?: string; password?: string } {
  if (typeof window === 'undefined') return {};
  return {
    token: localStorage.getItem('clawbrain_gateway_token') || undefined,
    password: localStorage.getItem('clawbrain_gateway_password') || undefined,
  };
}

// Store auth
function storeAuth(auth: { token?: string; password?: string }) {
  if (typeof window === 'undefined') return;
  if (auth.token) localStorage.setItem('clawbrain_gateway_token', auth.token);
  if (auth.password) localStorage.setItem('clawbrain_gateway_password', auth.password);
}

// Check gateway health via WebSocket
async function detectGateway(url: string): Promise<boolean> {
  return new Promise((resolve) => {
    try {
      const ws = new WebSocket(url);
      const timeout = setTimeout(() => {
        ws.close();
        resolve(false);
      }, 3000);

      ws.onopen = () => {
        clearTimeout(timeout);
        ws.close();
        resolve(true);
      };

      ws.onerror = () => {
        clearTimeout(timeout);
        resolve(false);
      };
    } catch {
      resolve(false);
    }
  });
}

export function useOpenClawGateway() {
  // Store actions
  const setConnected = useChatStore(useCallback((state) => state.setConnected, []));
  const addMessage = useChatStore(useCallback((state) => state.addMessage, []));
  const appendToCurrentMessage = useChatStore(useCallback((state) => state.appendToCurrentMessage, []));
  const finalizeCurrentMessage = useChatStore(useCallback((state) => state.finalizeCurrentMessage, []));
  const startStreamingMessage = useChatStore(useCallback((state) => state.startStreamingMessage, []));
  const setLoading = useChatStore(useCallback((state) => state.setLoading, []));
  const setError = useChatStore(useCallback((state) => state.setError, []));
  const clearError = useChatStore(useCallback((state) => state.clearError, []));

  // Local state
  const [connectionState, setConnectionState] = useState<ConnectionState>('checking');
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [gatewayUrl, setGatewayUrl] = useState(DEFAULT_GATEWAY_URL);
  
  // Refs
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectAttempts = useRef(0);
  const reconnectTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingRequests = useRef<Map<string, { resolve: (value: unknown) => void; reject: (err: Error) => void }>>(new Map());
  const isConnecting = useRef(false);
  const isAuthenticated = useRef(false);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnect();
    };
  }, []);

  // Auto-detect gateway on mount
  useEffect(() => {
    const init = async () => {
      setConnectionState('checking');
      
      const storedAuth = getStoredAuth();
      const isRunning = await detectGateway(gatewayUrl);
      
      if (!isRunning) {
        setConnectionState('error');
        setConnectionError('OpenClaw Gateway not found. Is it running on localhost:18789?');
        return;
      }
      
      // If we have auth, connect directly
      if (storedAuth.token || storedAuth.password) {
        connect(gatewayUrl, storedAuth);
      } else {
        setConnectionState('needs-auth');
      }
    };
    
    init();
  }, []);

  // WebSocket connection
  const connect = useCallback((url: string, auth: { token?: string; password?: string }) => {
    if (isConnecting.current || wsRef.current?.readyState === WebSocket.OPEN) {
      return;
    }
    
    isConnecting.current = true;
    isAuthenticated.current = false;
    setConnectionState('connecting');
    setConnectionError(null);
    
    try {
      const ws = new WebSocket(url);
      wsRef.current = ws;
      
      ws.onopen = () => {
        // Send connect handshake
        const connectReq: ReqFrame = {
          type: 'req',
          id: generateUUID(),
          method: 'connect',
          params: {
            minProtocol: 3,
            maxProtocol: 3,
            client: {
              id: 'clawbrain',
              version: '1.0.0',
              platform: 'web',
              mode: 'webchat',
              displayName: 'ClawBrain',
            },
            role: 'operator',
            scopes: ['operator.admin', 'operator.approvals', 'operator.pairing'],
            caps: [],
            auth: auth.token 
              ? { token: auth.token }
              : auth.password 
                ? { password: auth.password }
                : undefined,
          },
        };
        
        ws.send(JSON.stringify(connectReq));
      };
      
      ws.onmessage = (event) => {
        const frame = parseGatewayFrame(String(event.data));
        if (!frame) {
          console.error('Failed to parse gateway message:', event.data);
          return;
        }
        handleFrame(frame);
      };
      
      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        setConnectionError('Connection error');
      };
      
      ws.onclose = (event) => {
        isConnecting.current = false;
        isAuthenticated.current = false;
        setConnected(false);
        
        if (connectionState !== 'needs-auth') {
          setConnectionState('disconnected');
        }
        
        // Reject all pending requests
        pendingRequests.current.forEach(({ reject }) => {
          reject(new Error('Connection closed'));
        });
        pendingRequests.current.clear();
        
        // Auto-reconnect if not manually disconnected and auth succeeded before
        if (reconnectAttempts.current < MAX_RECONNECT_ATTEMPTS) {
          reconnectAttempts.current += 1;
          reconnectTimer.current = setTimeout(() => {
            connect(url, auth);
          }, WS_RECONNECT_INTERVAL * Math.min(reconnectAttempts.current, 3));
        }
      };
      
    } catch (error) {
      isConnecting.current = false;
      setConnectionState('error');
      setConnectionError(error instanceof Error ? error.message : 'Failed to connect');
    }
  }, [connectionState, setConnected]);

  // Handle incoming frames
  const handleFrame = useCallback((frame: GatewayFrame) => {
    if (frame.type === 'res') {
      const pending = pendingRequests.current.get(frame.id);
      if (pending) {
        pendingRequests.current.delete(frame.id);
        if (frame.ok) {
          pending.resolve(frame.payload);
        } else {
          const error = new Error(frame.error?.message || 'Request failed');
          (error as Error & { code?: string }).code = frame.error?.code;
          pending.reject(error);
        }
      }
      
      // Handle connect response
      if (!isAuthenticated.current) {
        if (frame.ok) {
          isAuthenticated.current = true;
          setConnectionState('connected');
          setConnected(true);
          reconnectAttempts.current = 0;
        } else if (frame.error?.code === 'UNAUTHORIZED' || frame.error?.message?.includes('auth')) {
          setConnectionState('needs-auth');
          setConnectionError('Authentication failed. Check your gateway password/token.');
          disconnect();
        }
      }
    } else if (frame.type === 'event') {
      handleEvent(frame);
    }
  }, [setConnected]);

  // Handle events
  const handleEvent = useCallback((event: EventFrame) => {
    switch (event.event) {
      case 'chat.text':
        if (event.payload && typeof event.payload === 'object') {
          const payload = event.payload as { text?: string; sessionKey?: string };
          if (payload.text) {
            appendToCurrentMessage(payload.text);
          }
        }
        break;
        
      case 'chat.done':
        finalizeCurrentMessage();
        setLoading(false);
        break;
        
      case 'chat.error':
        if (event.payload && typeof event.payload === 'object') {
          const payload = event.payload as { error?: string };
          setError(payload.error || 'Agent error');
        }
        finalizeCurrentMessage();
        setLoading(false);
        break;
        
      case 'agent.status':
        // Agent status update - could be used for War Room
        break;
        
      default:
        // Handle other events
        break;
    }
  }, [appendToCurrentMessage, finalizeCurrentMessage, setLoading, setError]);

  // Make a request to the gateway
  const request = useCallback(<T = unknown>(method: string, params?: unknown): Promise<T> => {
    return new Promise((resolve, reject) => {
      if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
        reject(new Error('Gateway not connected'));
        return;
      }
      
      const id = generateUUID();
      const frame: ReqFrame = { type: 'req', id, method, params };
      
      pendingRequests.current.set(id, { 
        resolve: (value) => resolve(value as T), 
        reject 
      });
      
      // Set timeout
      setTimeout(() => {
        if (pendingRequests.current.has(id)) {
          pendingRequests.current.delete(id);
          reject(new Error('Request timeout'));
        }
      }, 30000);
      
      wsRef.current.send(JSON.stringify(frame));
    });
  }, []);

  // Send chat message
  const sendMessageToGateway = useCallback((text: string) => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      setError('Not connected to gateway');
      return;
    }
    
    request('chat.send', {
      message: text,
      agentId: 'main',
      stream: true,
    }).catch((err) => {
      setError(err.message || 'Failed to send message');
      finalizeCurrentMessage();
      setLoading(false);
    });
  }, [request, setError, finalizeCurrentMessage, setLoading]);

  // Public send message function
  const sendMessage = useCallback((text: string) => {
    addMessage({
      id: `user-${Date.now()}`,
      role: 'user',
      content: text,
      createdAt: new Date(),
    });
    
    setLoading(true);
    clearError();
    startStreamingMessage();
    sendMessageToGateway(text);
  }, [addMessage, setLoading, clearError, startStreamingMessage, sendMessageToGateway]);

  // Submit auth
  const submitAuth = useCallback((auth: { token?: string; password?: string }) => {
    storeAuth(auth);
    connect(gatewayUrl, auth);
  }, [gatewayUrl, connect]);

  // Disconnect
  const disconnect = useCallback(() => {
    if (reconnectTimer.current) {
      clearTimeout(reconnectTimer.current);
      reconnectTimer.current = null;
    }
    
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    
    isConnecting.current = false;
    isAuthenticated.current = false;
    setConnected(false);
  }, [setConnected]);

  // Manual reconnect
  const reconnect = useCallback(() => {
    reconnectAttempts.current = 0;
    const storedAuth = getStoredAuth();
    connect(gatewayUrl, storedAuth);
  }, [gatewayUrl, connect]);

  // Gateway API methods for War Room
  const listAgents = useCallback(() => {
    return request<{ agents: Array<{ id: string; name: string; model?: string }> }>('agents.list');
  }, [request]);

  const listSessions = useCallback((agentId?: string) => {
    return request<{ sessions: Array<{ key: string; agentId: string; status: string }> }>('sessions.list', { agentId });
  }, [request]);

  const getAgentFiles = useCallback((agentId: string, path: string) => {
    return request<string>('agents.files.get', { agentId, path });
  }, [request]);

  const setAgentFile = useCallback((agentId: string, path: string, content: string) => {
    return request<void>('agents.files.set', { agentId, path, content });
  }, [request]);

  return {
    connectionState,
    connectionError,
    gatewayUrl,
    sendMessage,
    submitAuth,
    reconnect,
    disconnect,
    isConnected: connectionState === 'connected',
    isLoading: useChatStore(useCallback((state) => state.isLoading, [])),
    // War Room API
    listAgents,
    listSessions,
    getAgentFiles,
    setAgentFile,
    request,
  };
}
