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
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
  
  try {
    // Use proxy path if needed to avoid CORS
    const fetchUrl = useProxy ? '/api/gateway/v1/responses' : `${url}/v1/responses`;
    const response = await fetch(fetchUrl, {
      method: 'POST',
      signal: controller.signal,
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

    clearTimeout(timeoutId);

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
    clearTimeout(timeoutId);
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
  // Use individual selectors to avoid object creation and infinite loops
  const setConnected = useChatStore(useCallback((state) => state.setConnected, []));
  const addMessage = useChatStore(useCallback((state) => state.addMessage, []));
  const appendToCurrentMessage = useChatStore(useCallback((state) => state.appendToCurrentMessage, []));
  const finalizeCurrentMessage = useChatStore(useCallback((state) => state.finalizeCurrentMessage, []));
  const startStreamingMessage = useChatStore(useCallback((state) => state.startStreamingMessage, []));
  const setLoading = useChatStore(useCallback((state) => state.setLoading, []));
  const setError = useChatStore(useCallback((state) => state.setError, []));
  const clearError = useChatStore(useCallback((state) => state.clearError, []));
  const isLoading = useChatStore(useCallback((state) => state.isLoading, []));
  const error = useChatStore(useCallback((state) => state.error, []));
  
  const [connectionState, setConnectionState] = useState<ConnectionState>('idle');
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [reconnectAttempt, setReconnectAttempt] = useState(0);
  
  const abortRef = useRef<AbortController | null>(null);
  const configRef = useRef(getGatewayConfig());
  const isSendingRef = useRef(false); // Prevent race conditions
  const mountedRef = useRef(true);

  // Test connection on mount - only once
  useEffect(() => {
    mountedRef.current = true;
    
    const test = async () => {
      // Skip if already connected or tested
      if (connectionState !== 'idle') return;
      
      setConnectionState('connecting');
      const config = getGatewayConfig();
      configRef.current = config; // Update ref
      
      const result = await testFullConnection(config.url, config.password, config.useProxy);
      
      if (!mountedRef.current) return;
      
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
      mountedRef.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty deps - only run once on mount

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortRef.current) {
        abortRef.current.abort();
        abortRef.current = null;
      }
    };
  }, []);

  const sendMessage = useCallback(async (text: string) => {
    // Prevent race conditions
    if (isSendingRef.current) {
      console.warn('Already sending a message, please wait');
      return;
    }
    
    isSendingRef.current = true;
    
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

    // Cancel any in-flight request (shouldn't happen due to isSendingRef)
    if (abortRef.current) {
      abortRef.current.abort();
    }
    abortRef.current = new AbortController();

    try {
      const config = getGatewayConfig();
      configRef.current = config;
      
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
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      if (!response.body) {
        throw new Error('No response body');
      }

      // Handle SSE streaming
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let hasReceivedContent = false;

      // Start streaming message
      startStreamingMessage();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || ''; // Keep incomplete line in buffer

        for (const line of lines) {
          const trimmedLine = line.trim();
          
          // Skip empty lines and comments
          if (!trimmedLine || trimmedLine.startsWith(':')) continue;
          
          if (trimmedLine.startsWith('data: ')) {
            const data = trimmedLine.slice(6);
            if (data === '[DONE]') continue;
            
            try {
              const parsed = JSON.parse(data);
              
              // Extract text from OpenResponses format (multiple possible formats)
              let textContent = '';
              
              // Format 1: output[0].content[0].text
              if (parsed.output?.[0]?.content?.[0]?.text) {
                textContent = parsed.output[0].content[0].text;
              }
              // Format 2: delta.content[0].text (streaming)
              else if (parsed.delta?.content?.[0]?.text) {
                textContent = parsed.delta.content[0].text;
              }
              // Format 3: direct content
              else if (typeof parsed.content === 'string') {
                textContent = parsed.content;
              }
              // Format 4: choices[0].delta.content (OpenAI format)
              else if (parsed.choices?.[0]?.delta?.content) {
                textContent = parsed.choices[0].delta.content;
              }
              
              if (textContent) {
                hasReceivedContent = true;
                appendToCurrentMessage(textContent);
              }
              
              // Check for completion status
              if (parsed.status === 'completed' && !hasReceivedContent) {
                // Handle case where response is in output but not streamed
                const finalOutput = parsed.output?.[0]?.content?.[0]?.text;
                if (finalOutput) {
                  appendToCurrentMessage(finalOutput);
                }
              }
            } catch {
              // Ignore parse errors for incomplete chunks
            }
          }
        }
      }

      // Process any remaining buffer content
      if (buffer.trim()) {
        const trimmedLine = buffer.trim();
        if (trimmedLine.startsWith('data: ')) {
          const data = trimmedLine.slice(6);
          if (data !== '[DONE]') {
            try {
              const parsed = JSON.parse(data);
              const textContent = parsed.output?.[0]?.content?.[0]?.text || 
                                parsed.delta?.content?.[0]?.text || '';
              if (textContent) {
                appendToCurrentMessage(textContent);
              }
            } catch {
              // Ignore parse errors
            }
          }
        }
      }

      finalizeCurrentMessage();
      setConnectionState('connected');
      
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        // User cancelled - finalize any partial message
        finalizeCurrentMessage();
        return; 
      }
      
      const errorMsg = err instanceof Error ? err.message : 'Request failed';
      setError(errorMsg);
      setConnectionError(errorMsg);
      setConnectionState('error');
      finalizeCurrentMessage();
      
      // Auto-retry logic for certain errors
      if (reconnectAttempt < 3 && errorMsg.includes('fetch')) {
        setReconnectAttempt(prev => prev + 1);
        setTimeout(() => {
          if (mountedRef.current) {
            reconnect();
          }
        }, 1000 * Math.pow(2, reconnectAttempt)); // Exponential backoff
      }
    } finally {
      isSendingRef.current = false;
      abortRef.current = null;
    }
  }, [addMessage, appendToCurrentMessage, clearError, finalizeCurrentMessage, reconnectAttempt, setConnected, setError, setLoading, startStreamingMessage]);

  const reconnect = useCallback(async () => {
    if (connectionState === 'connecting') return; // Prevent concurrent reconnects
    
    setConnectionState('connecting');
    setConnectionError(null);
    const config = getGatewayConfig();
    configRef.current = config;
    
    const result = await testFullConnection(config.url, config.password, config.useProxy);
    
    if (!mountedRef.current) return;
    
    if (result.success) {
      setConnectionState('connected');
      setReconnectAttempt(0);
      setConnected(true);
    } else {
      setConnectionState('error');
      setConnectionError(result.error || 'Unknown error');
      setConnected(false);
    }
  }, [setConnected, connectionState]);

  const setPassword = useCallback((password: string) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('clawbrain_gateway_password', password);
      configRef.current.password = password;
    }
  }, []);

  const disconnect = useCallback(() => {
    if (abortRef.current) {
      abortRef.current.abort();
      abortRef.current = null;
    }
    isSendingRef.current = false;
    setConnectionState('idle');
    setConnected(false);
  }, [setConnected]);

  return {
    isConnected: connectionState === 'connected',
    connectionState,
    connectionError,
    reconnectAttempt,
    isLoading,
    error,
    sendMessage,
    reconnect,
    disconnect,
    setPassword,
  };
}

// Export for GatewaySettings
export { getGatewayConfig as getStoredSettings };
