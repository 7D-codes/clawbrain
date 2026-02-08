/**
 * Zero-Config OpenClaw Gateway Client
 * 
 * Auto-discovers local gateway and provides seamless connection.
 * If auth is required, shows a one-time setup prompt.
 */

import { useEffect, useRef, useCallback, useState } from 'react';
import { useChatStore } from '@/stores/chat-store';

const DEFAULT_GATEWAY_URL = 'ws://127.0.0.1:18789';
const HTTP_HEALTH_URL = 'http://localhost:18789';
const WS_RECONNECT_INTERVAL = 3000;
const MAX_RECONNECT_ATTEMPTS = 5;

export type ConnectionState = 
  | 'checking'      // Auto-detecting gateway
  | 'needs-auth'    // Gateway found, needs password/token
  | 'connecting'    // WS handshake in progress
  | 'connected'     // Fully connected
  | 'disconnected'  // Disconnected
  | 'error';        // Error state

interface GatewayInfo {
  url: string;
  version?: string;
  requiresAuth: boolean;
}

// Check if gateway is running via HTTP health endpoint
async function detectGateway(): Promise<GatewayInfo | null> {
  try {
    // Try HTTP first to detect if gateway exists
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 2000);
    
    const response = await fetch(`${HTTP_HEALTH_URL}/health`, {
      method: 'GET',
      signal: controller.signal,
    }).catch(() => null);
    
    clearTimeout(timeout);
    
    if (response?.ok) {
      const data = await response.json().catch(() => ({}));
      return {
        url: DEFAULT_GATEWAY_URL,
        version: data.version,
        requiresAuth: true, // Always assume auth needed
      };
    }
    
    // If 401, gateway is there but needs auth
    if (response?.status === 401) {
      return {
        url: DEFAULT_GATEWAY_URL,
        requiresAuth: true,
      };
    }
    
    return null;
  } catch {
    return null;
  }
}

// Get stored auth from localStorage
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
  const [gatewayInfo, setGatewayInfo] = useState<GatewayInfo | null>(null);
  
  // Refs
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectAttempts = useRef(0);
  const reconnectTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const messageQueue = useRef<string[]>([]);
  const currentRequestId = useRef(0);
  const isConnecting = useRef(false);

  // Generate request ID
  const getNextId = useCallback(() => {
    currentRequestId.current += 1;
    return String(currentRequestId.current);
  }, []);

  // Auto-detect gateway on mount
  useEffect(() => {
    const init = async () => {
      setConnectionState('checking');
      
      // Check if we have stored auth
      const storedAuth = getStoredAuth();
      
      // Detect gateway
      const info = await detectGateway();
      
      if (!info) {
        setConnectionState('error');
        setConnectionError('OpenClaw Gateway not found. Is it running on localhost:18789?');
        return;
      }
      
      setGatewayInfo(info);
      
      // If we have auth, connect directly
      if (storedAuth.token || storedAuth.password) {
        connect(info.url, storedAuth);
      } else {
        // Need auth
        setConnectionState('needs-auth');
      }
    };
    
    init();
    
    return () => {
      disconnect();
    };
  }, []);

  // WebSocket connection
  const connect = useCallback((url: string, auth: { token?: string; password?: string }) => {
    if (isConnecting.current || wsRef.current?.readyState === WebSocket.OPEN) {
      return;
    }
    
    isConnecting.current = true;
    setConnectionState('connecting');
    setConnectionError(null);
    
    try {
      const ws = new WebSocket(url);
      wsRef.current = ws;
      
      ws.onopen = () => {
        // Send connect handshake
        const connectReq = {
          type: 'req',
          id: getNextId(),
          method: 'connect',
          params: {
            minProtocol: 3,
            maxProtocol: 3,
            client: {
              id: 'clawbrain',
              version: '1.0.0',
              platform: 'web',
              displayName: 'ClawBrain',
            },
            caps: ['agent', 'chat'],
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
        try {
          const msg = JSON.parse(event.data);
          handleMessage(msg);
        } catch {
          console.error('Failed to parse gateway message:', event.data);
        }
      };
      
      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        setConnectionError('Connection error');
      };
      
      ws.onclose = () => {
        isConnecting.current = false;
        setConnected(false);
        
        if (connectionState !== 'needs-auth') {
          setConnectionState('disconnected');
        }
        
        // Auto-reconnect if not manually disconnected
        if (reconnectAttempts.current < MAX_RECONNECT_ATTEMPTS) {
          reconnectAttempts.current += 1;
          reconnectTimer.current = setTimeout(() => {
            connect(url, auth);
          }, WS_RECONNECT_INTERVAL * reconnectAttempts.current);
        }
      };
      
    } catch (error) {
      isConnecting.current = false;
      setConnectionState('error');
      setConnectionError(error instanceof Error ? error.message : 'Failed to connect');
    }
  }, [connectionState, getNextId, setConnected]);

  // Handle incoming messages
  const handleMessage = useCallback((msg: any) => {
    if (msg.type === 'res') {
      // Handle response
      if (msg.id === '1' && msg.ok) {
        // Connect response - we're authenticated
        setConnectionState('connected');
        setConnected(true);
        reconnectAttempts.current = 0;
        
        // Flush message queue
        while (messageQueue.current.length > 0) {
          const text = messageQueue.current.shift();
          if (text) sendMessageToGateway(text);
        }
      } else if (!msg.ok) {
        // Auth failed
        if (msg.error?.code === 'UNAUTHORIZED' || msg.error?.message?.includes('auth')) {
          setConnectionState('needs-auth');
          setConnectionError('Authentication failed. Please enter your gateway password.');
        } else {
          setConnectionError(msg.error?.message || 'Unknown error');
        }
      }
    } else if (msg.type === 'event') {
      // Handle events (agent responses, etc.)
      if (msg.event === 'agent') {
        handleAgentEvent(msg.payload);
      }
    }
  }, [setConnected]);

  // Handle agent events (streaming responses)
  const handleAgentEvent = useCallback((payload: any) => {
    if (payload.type === 'text') {
      appendToCurrentMessage(payload.text);
    } else if (payload.type === 'done') {
      finalizeCurrentMessage();
      setLoading(false);
    } else if (payload.type === 'error') {
      setError(payload.error || 'Agent error');
      finalizeCurrentMessage();
      setLoading(false);
    }
  }, [appendToCurrentMessage, finalizeCurrentMessage, setLoading, setError]);

  // Send message to gateway
  const sendMessageToGateway = useCallback((text: string) => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      messageQueue.current.push(text);
      return;
    }
    
    const req = {
      type: 'req',
      id: getNextId(),
      method: 'agent',
      params: {
        message: text,
        agentId: 'main',
        stream: true,
      },
    };
    
    wsRef.current.send(JSON.stringify(req));
  }, [getNextId]);

  // Public send message function
  const sendMessage = useCallback((text: string) => {
    // Add user message immediately
    addMessage({
      id: `user-${Date.now()}`,
      role: 'user',
      content: text,
      createdAt: new Date(),
    });
    
    setLoading(true);
    clearError();
    
    // Start streaming
    startStreamingMessage();
    
    // Send to gateway
    sendMessageToGateway(text);
  }, [addMessage, setLoading, clearError, startStreamingMessage, sendMessageToGateway]);

  // Submit auth (called from UI)
  const submitAuth = useCallback((auth: { token?: string; password?: string }) => {
    storeAuth(auth);
    if (gatewayInfo) {
      connect(gatewayInfo.url, auth);
    }
  }, [gatewayInfo, connect]);

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
    
    setConnected(false);
  }, [setConnected]);

  // Manual reconnect
  const reconnect = useCallback(() => {
    reconnectAttempts.current = 0;
    const storedAuth = getStoredAuth();
    if (gatewayInfo) {
      connect(gatewayInfo.url, storedAuth);
    }
  }, [gatewayInfo, connect]);

  return {
    connectionState,
    connectionError,
    gatewayInfo,
    sendMessage,
    submitAuth,
    reconnect,
    disconnect,
    isConnected: connectionState === 'connected',
    isLoading: useChatStore(useCallback((state) => state.isLoading, [])),
  };
}
