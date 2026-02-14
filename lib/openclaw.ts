/**
 * OpenClaw Gateway Connection
 * Enables real-time communication between ClawBrain and OpenClaw
 */

const GATEWAY_URL = process.env.NEXT_PUBLIC_OPENCLAW_URL || 'ws://192.168.1.219:18789';
const GATEWAY_TOKEN = process.env.NEXT_PUBLIC_OPENCLAW_TOKEN || '1220';

export interface OpenClawMessage {
  type: 'event' | 'req' | 'res';
  event?: string;
  id?: string;
  payload?: unknown;
}

export class OpenClawClient {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private listeners: Map<string, ((data: unknown) => void)[]> = new Map();
  
  constructor() {
    if (typeof window !== 'undefined') {
      this.connect();
    }
  }
  
  connect() {
    try {
      const url = `${GATEWAY_URL}?auth=${GATEWAY_TOKEN}`;
      this.ws = new WebSocket(url);
      
      this.ws.onopen = () => {
        console.log('✅ Connected to OpenClaw gateway');
        this.reconnectAttempts = 0;
        
        // Subscribe to events
        this.send({
          type: 'req',
          id: crypto.randomUUID(),
          method: 'session.subscribe',
          params: { events: ['agent.message', 'memory.updated', 'task.completed'] }
        });
      };
      
      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data) as OpenClawMessage;
          this.handleMessage(data);
        } catch (err) {
          console.error('Failed to parse message:', err);
        }
      };
      
      this.ws.onclose = () => {
        console.log('Disconnected from OpenClaw gateway');
        this.attemptReconnect();
      };
      
      this.ws.onerror = (err) => {
        console.error('WebSocket error:', err);
      };
      
    } catch (err) {
      console.error('Failed to connect:', err);
      this.attemptReconnect();
    }
  }
  
  private attemptReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(`Reconnecting... (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
      setTimeout(() => this.connect(), 2000 * this.reconnectAttempts);
    }
  }
  
  private handleMessage(data: OpenClawMessage) {
    if (data.event && this.listeners.has(data.event)) {
      const handlers = this.listeners.get(data.event) || [];
      handlers.forEach(handler => handler(data.payload));
    }
    
    // Handle specific events
    switch (data.event) {
      case 'agent.message':
        console.log('Agent message:', data.payload);
        break;
      case 'memory.updated':
        // Trigger refresh of memory data
        window.dispatchEvent(new CustomEvent('memory:updated', { detail: data.payload }));
        break;
    }
  }
  
  send(message: unknown) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    } else {
      console.warn('WebSocket not connected, message queued');
    }
  }
  
  on(event: string, handler: (data: unknown) => void) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)?.push(handler);
    
    // Return unsubscribe function
    return () => {
      const handlers = this.listeners.get(event) || [];
      const index = handlers.indexOf(handler);
      if (index > -1) handlers.splice(index, 1);
    };
  }
  
  disconnect() {
    this.ws?.close();
  }
}

// Singleton instance
let client: OpenClawClient | null = null;

export function getOpenClawClient(): OpenClawClient {
  if (!client && typeof window !== 'undefined') {
    client = new OpenClawClient();
  }
  return client!;
}

// Helper to send agent commands
export function sendAgentCommand(method: string, params: unknown) {
  const client = getOpenClawClient();
  client.send({
    type: 'req',
    id: crypto.randomUUID(),
    method,
    params
  });
}
