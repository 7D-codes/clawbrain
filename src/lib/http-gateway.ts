/**
 * HTTP Gateway Client for OpenClaw
 * 
 * Uses the HTTP API (POST /v1/responses) instead of WebSocket.
 * This is more reliable and matches the working curl test.
 */

import { useEffect, useRef, useCallback, useState } from 'react';
import { useChatStore } from '@/stores/chat-store';

// Get gateway config from localStorage or defaults
function getGatewayConfig(): { url: string; password: string; useProxy: boolean } {
  if (typeof window === 'undefined') {
    return { url: 'http://localhost:18789', password: '', useProxy: false };
  }
  
  const storedUrl = localStorage.getItem('clawbrain_gateway_url')?.replace('ws://', 'http://').replace('wss://', 'https://') || 'http://localhost:18789';
  
  // Use proxy for cross-origin requests to avoid CORS issues
  // If the gateway is on localhost but site is on different port, use proxy
  const isLocalhost = storedUrl.includes('localhost') || storedUrl.includes('127.0.0.1');
  const isDifferentPort = !storedUrl.includes(window.location.host);
  const useProxy = isLocalhost && isDifferentPort;
  
  return {
    url: useProxy ? '/api/gateway' : storedUrl,
    password: localStorage.getItem('clawbrain_gateway_password') || '',
    useProxy,
  };
}

export type ConnectionState = 
  | 'idle' 
  | 'connecting' 
  | 'authenticating'
  | 'connected' 
  | 'disconnected' 
  | 'error';

// Test connection to gateway
export async function testFullConnection(
  url: string, 
  password: string,
  useProxy = false
): Promise<{ 
  success: boolean; 
  stage: 'connect' | 'auth' | 'success';
  error?: string;
  details?: string;
}> {
  try {
    // Use proxy path if needed to avoid CORS
    const fetchUrl = useProxy ? '/api/gateway/v1/responses' : `${url}/v1/responses`;
    const response = await fetch(fetchUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${password}`,
        'Content-Type': 'application/json',
        'x-openclaw-agent-id': 'main',
      },
      body: JSON.stringify({
        model: 'openclaw',
        input: 'Hello',
        stream: false,
      }),
    });

    if (response.status === 401) {
      return {
        success: false,
        stage: 'auth',
        error: 'Authentication failed',
        details: 'Invalid password. Check your gateway password.',
      };
    }

    if (!response.ok) {
      return {
        success: false,
        stage: 'connect',
        error: `HTTP ${response.status}`,
        details: await response.text(),
      };
    }

    const data = await response.json();
    if (data.status === 'completed' || data.output) {
      return {
        success: true,
        stage: 'success',
        details: 'Gateway responding correctly',
      };
    }

    return {
      success: false,
      stage: 'connect',
      error: 'Unexpected response',
      details: JSON.stringify(data).slice(0, 200),
    };
  } catch (err) {
    return {
      success: false,
      stage: 'connect',
      error: 'Connection failed',
      details: err instanceof Error ? err.message : 'Unknown error',
    };
  }
}

// HTTP-based hook for chat
export function useGatewayHTTP() {
  const setConnected = useChatStore(useCallback((state) => state.setConnected, []));
  const addMessage = useChatStore(useCallback((state) => state.addMessage, []));
  const appendToCurrentMessage = useChatStore(useCallback((state) => state.appendToCurrentMessage, []));
  const finalizeCurrentMessage = useChatStore(useCallback((state) => state.finalizeCurrentMessage, []));
  const setLoading = useChatStore(useCallback((state) => state.setLoading, []));
  const setError = useChatStore(useCallback((state) => state.setError, []));
  const clearError = useChatStore(useCallback((state) => state.clearError, []));
  
  const [connectionState, setConnectionState] = useState<ConnectionState>('idle');
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const configRef = useRef(getGatewayConfig());

  // Test connection on mount - only once
  useEffect(() => {
    let mounted = true;
    
    const test = async () => {
      // Skip if already connected or tested
      if (connectionState !== 'idle') return;
      
      setConnectionState('connecting');
      const config = getGatewayConfig();
      const result = await testFullConnection(config.url, config.password, config.useProxy);
      
      if (!mounted) return;
      
      if (result.success) {
        setConnectionState('connected');
        setConnected(true);
      } else {
        setConnectionState('error');
        setConnectionError(result.error || 'Unknown error');
        setConnected(false);
      }
    };
    
    test();
    
    return () => {
      mounted = false;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty deps - only run once on mount

  const sendMessage = useCallback(async (text: string) => {
    // Add user message
    addMessage({
      id: `user-${Date.now()}`,
      role: 'user',
      content: text,
      createdAt: new Date(),
    });

    setLoading(true);
    clearError();
    setConnectionError(null);

    // Cancel any in-flight request
    if (abortRef.current) {
      abortRef.current.abort();
    }
    abortRef.current = new AbortController();

    try {
      const config = getGatewayConfig();
      // Use proxy URL to avoid CORS issues
      const fetchUrl = config.useProxy ? '/api/gateway/v1/responses' : `${config.url}/v1/responses`;
      
      const response = await fetch(fetchUrl, {
        method: 'POST',
        signal: abortRef.current.signal,
        headers: {
          'Authorization': `Bearer ${config.password}`,
          'Content-Type': 'application/json',
          'x-openclaw-agent-id': 'main',
          'Accept': 'text/event-stream',
        },
        body: JSON.stringify({
          model: 'openclaw',
          input: text,
          stream: true,
          instructions: 'You are Hero, Mohammed\'s AI assistant. Be concise and helpful.',
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${await response.text()}`);
      }

      if (!response.body) {
        throw new Error('No response body');
      }

      // Handle SSE streaming
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      // Start streaming message
      useChatStore.getState().startStreamingMessage();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') continue;
            
            try {
              const parsed = JSON.parse(data);
              // Extract text from OpenResponses format
              const text = parsed.output?.[0]?.content?.[0]?.text || 
                          parsed.delta?.content?.[0]?.text ||
                          parsed.content || '';
              if (text) {
                appendToCurrentMessage(text);
              }
            } catch {
              // Ignore parse errors for incomplete chunks
            }
          }
        }
      }

      finalizeCurrentMessage();
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        return; // User cancelled
      }
      const errorMsg = err instanceof Error ? err.message : 'Request failed';
      setError(errorMsg);
      setConnectionError(errorMsg);
      finalizeCurrentMessage();
    }
  }, [addMessage, setLoading, clearError, appendToCurrentMessage, finalizeCurrentMessage, setError]);

  const reconnect = useCallback(async () => {
    setConnectionState('connecting');
    setConnectionError(null);
    const config = getGatewayConfig();
    const result = await testFullConnection(config.url, config.password, config.useProxy);
    if (result.success) {
      setConnectionState('connected');
      setConnected(true);
    } else {
      setConnectionState('error');
      setConnectionError(result.error || 'Unknown error');
      setConnected(false);
    }
  }, [setConnected]);

  const setPassword = useCallback((password: string) => {
    localStorage.setItem('clawbrain_gateway_password', password);
    configRef.current.password = password;
  }, []);

  const disconnect = useCallback(() => {
    if (abortRef.current) {
      abortRef.current.abort();
    }
    setConnectionState('idle');
    setConnected(false);
  }, [setConnected]);

  return {
    isConnected: connectionState === 'connected',
    connectionState,
    connectionError,
    reconnectAttempt: 0,
    isLoading: useChatStore(useCallback((state) => state.isLoading, [])),
    error: useChatStore(useCallback((state) => state.error, [])),
    sendMessage,
    reconnect,
    disconnect,
    setPassword,
  };
}

// Export for GatewaySettings
export { getGatewayConfig as getStoredSettings };
