/**
 * Gateway WebSocket Client
 * 
 * Handles connection to OpenClaw Gateway with:
 * - Auto-reconnect with exponential backoff
 * - Auth with Gateway password (Protocol v3)
 * - Device identity with RSA keypair generation
 * - Challenge signing for non-loopback connections
 * - Session management (clawbrain:main:main)
 * - Message streaming support
 * - Detailed connection diagnostics
 */

import { useEffect, useRef, useCallback, useState } from 'react';
import { useChatStore } from '@/stores/chat-store';

// Gateway connection configuration
const SESSION_KEY = 'clawbrain:main:main';
const PROTOCOL_VERSION = 3;
const DEVICE_KEY_STORAGE_KEY = 'clawbrain_device_keys';
const DEVICE_TOKEN_STORAGE_KEY = 'clawbrain_device_token';

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

// Generate a unique request ID
function generateReqId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

// Device keypair interface
interface DeviceKeyPair {
  id: string;
  publicKey: string; // PEM format
  privateKey: CryptoKey; // Web Crypto API key object
  createdAt: number;
}

// Stored device keys (serializable)
interface StoredDeviceKeys {
  id: string;
  publicKey: string; // PEM format
  privateKeyJwk: JsonWebKey; // Exportable private key
  createdAt: number;
}

// Generate a unique device ID
function generateDeviceId(): string {
  const stored = typeof window !== 'undefined' ? localStorage.getItem('clawbrain_device_id') : null;
  if (stored) return stored;
  
  const id = `clawbrain-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  if (typeof window !== 'undefined') {
    localStorage.setItem('clawbrain_device_id', id);
  }
  return id;
}

// Get device ID
function getDeviceId(): string {
  return generateDeviceId();
}

// Convert ArrayBuffer to Base64
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

// Convert Base64 to ArrayBuffer
function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

// Export public key to PEM format
async function exportPublicKeyToPEM(publicKey: CryptoKey): Promise<string> {
  const exported = await crypto.subtle.exportKey('spki', publicKey);
  const base64 = arrayBufferToBase64(exported);
  // Format as PEM with line breaks every 64 characters
  const lines = base64.match(/.{1,64}/g) || [];
  return `-----BEGIN PUBLIC KEY-----\n${lines.join('\n')}\n-----END PUBLIC KEY-----`;
}

// Import public key from PEM format
async function importPublicKeyFromPEM(pem: string): Promise<CryptoKey> {
  const base64 = pem
    .replace('-----BEGIN PUBLIC KEY-----', '')
    .replace('-----END PUBLIC KEY-----', '')
    .replace(/\s/g, '');
  const buffer = base64ToArrayBuffer(base64);
  return crypto.subtle.importKey(
    'spki',
    buffer,
    { name: 'RSA-PSS', hash: 'SHA-256' },
    false,
    ['verify']
  );
}

// Generate new RSA keypair for device identity
async function generateDeviceKeyPair(): Promise<DeviceKeyPair> {
  const keyPair = await crypto.subtle.generateKey(
    {
      name: 'RSA-PSS',
      modulusLength: 2048,
      publicExponent: new Uint8Array([1, 0, 1]),
      hash: 'SHA-256',
    },
    true, // exportable
    ['sign', 'verify']
  );

  const publicKeyPEM = await exportPublicKeyToPEM(keyPair.publicKey);
  
  return {
    id: getDeviceId(),
    publicKey: publicKeyPEM,
    privateKey: keyPair.privateKey,
    createdAt: Date.now(),
  };
}

// Save device keys to localStorage
async function saveDeviceKeys(keyPair: DeviceKeyPair): Promise<void> {
  if (typeof window === 'undefined') return;
  
  try {
    const privateKeyJwk = await crypto.subtle.exportKey('jwk', keyPair.privateKey);
    const stored: StoredDeviceKeys = {
      id: keyPair.id,
      publicKey: keyPair.publicKey,
      privateKeyJwk,
      createdAt: keyPair.createdAt,
    };
    localStorage.setItem(DEVICE_KEY_STORAGE_KEY, JSON.stringify(stored));
  } catch (err) {
    debugLog('Failed to save device keys:', err);
  }
}

// Load device keys from localStorage
async function loadDeviceKeys(): Promise<DeviceKeyPair | null> {
  if (typeof window === 'undefined') return null;
  
  try {
    const stored = localStorage.getItem(DEVICE_KEY_STORAGE_KEY);
    if (!stored) return null;
    
    const parsed: StoredDeviceKeys = JSON.parse(stored);
    
    // Import the private key
    const privateKey = await crypto.subtle.importKey(
      'jwk',
      parsed.privateKeyJwk,
      { name: 'RSA-PSS', hash: 'SHA-256' },
      true,
      ['sign']
    );
    
    return {
      id: parsed.id,
      publicKey: parsed.publicKey,
      privateKey,
      createdAt: parsed.createdAt,
    };
  } catch (err) {
    debugLog('Failed to load device keys:', err);
    return null;
  }
}

// Get or create device keypair
async function getDeviceKeyPair(): Promise<DeviceKeyPair | null> {
  try {
    // Try to load existing keys
    let keyPair = await loadDeviceKeys();
    if (keyPair) {
      debugLog('Loaded existing device keypair');
      return keyPair;
    }
    
    // Generate new keys
    debugLog('Generating new device keypair...');
    keyPair = await generateDeviceKeyPair();
    await saveDeviceKeys(keyPair);
    debugLog('Device keypair generated and saved');
    return keyPair;
  } catch (err) {
    debugLog('Crypto not available, falling back to no device auth:', err);
    return null;
  }
}

// Sign a challenge nonce with the device private key
async function signChallenge(privateKey: CryptoKey, nonce: string): Promise<string | null> {
  try {
    const encoder = new TextEncoder();
    const data = encoder.encode(nonce);
    
    const signature = await crypto.subtle.sign(
      {
        name: 'RSA-PSS',
        saltLength: 32,
      },
      privateKey,
      data
    );
    
    return arrayBufferToBase64(signature);
  } catch (err) {
    debugLog('Failed to sign challenge:', err);
    return null;
  }
}

// Store device token for future reconnects
function storeDeviceToken(token: string): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(DEVICE_TOKEN_STORAGE_KEY, token);
  }
}

// Get stored device token
function getStoredDeviceToken(): string | null {
  if (typeof window !== 'undefined') {
    return localStorage.getItem(DEVICE_TOKEN_STORAGE_KEY);
  }
  return null;
}

// Clear device token (on auth failure)
function clearDeviceToken(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(DEVICE_TOKEN_STORAGE_KEY);
  }
}

// Test full connection including auth (Protocol v3 with device identity)
async function testFullConnection(
  url: string, 
  password: string
): Promise<{ 
  success: boolean; 
  stage: 'connect' | 'auth' | 'success';
  error?: string;
  details?: string;
}> {
  return new Promise(async (resolve) => {
    let stage: 'connect' | 'auth' | 'success' = 'connect';
    let ws: WebSocket | null = null;
    let connectReqId: string | null = null;
    let challengeNonce: string | null = null;
    
    const timeout = setTimeout(() => {
      if (ws) ws.close();
      resolve({ 
        success: false, 
        stage, 
        error: `Timeout at stage: ${stage}`,
        details: stage === 'connect' 
          ? 'WebSocket failed to open within 5 seconds' 
          : 'No auth response received'
      });
    }, 10000);

    try {
      ws = new WebSocket(url);
      
      ws.onopen = () => {
        stage = 'connect';
        // Wait for connect.challenge event
      };

      ws.onmessage = async (event) => {
        try {
          const data = JSON.parse(event.data);
          
          // Handle connect challenge
          if (data.type === 'event' && data.event === 'connect.challenge') {
            stage = 'auth';
            challengeNonce = data.payload.nonce;
            connectReqId = generateReqId();
            
            // Get device keypair for signing
            const deviceKeyPair = await getDeviceKeyPair();
            
            // Sign the challenge if we have keys
            let signature: string | undefined;
            let publicKey: string | undefined;
            let signedAt: number | undefined;
            
            if (deviceKeyPair && challengeNonce) {
              const sig = await signChallenge(deviceKeyPair.privateKey, challengeNonce);
              if (sig) {
                signature = sig;
                publicKey = deviceKeyPair.publicKey;
                signedAt = Date.now();
              }
            }
            
            // Build device object
            const device: {
              id: string;
              nonce: string | null;
              publicKey?: string;
              signature?: string;
              signedAt?: number;
            } = {
              id: deviceKeyPair?.id || getDeviceId(),
              nonce: challengeNonce,
            };
            
            if (publicKey) device.publicKey = publicKey;
            if (signature) device.signature = signature;
            if (signedAt) device.signedAt = signedAt;
            
            // Send connect request with protocol v3
            const connectMessage = {
              type: 'req',
              id: connectReqId,
              method: 'connect',
              params: {
                minProtocol: PROTOCOL_VERSION,
                maxProtocol: PROTOCOL_VERSION,
                client: {
                  id: 'clawbrain-test',
                  version: '1.0.0',
                  platform: 'web',
                  mode: 'operator',
                },
                role: 'operator',
                scopes: ['operator.read', 'operator.write'],
                caps: [],
                commands: [],
                permissions: {},
                auth: { 
                  token: password,
                  deviceToken: getStoredDeviceToken(),
                },
                locale: 'en-US',
                userAgent: 'clawbrain/1.0.0',
                device,
              },
            };
            ws?.send(JSON.stringify(connectMessage));
          }
          
          // Handle connect response
          else if (data.type === 'res' && data.id === connectReqId) {
            clearTimeout(timeout);
            ws?.close();
            
            if (data.ok) {
              // Store device token if provided
              const payload = data.payload as {auth?: {deviceToken?: string}} | undefined;
              if (payload?.auth?.deviceToken) {
                storeDeviceToken(payload.auth.deviceToken);
              }
              resolve({ success: true, stage: 'success' });
            } else {
              // Clear device token on auth failure
              clearDeviceToken();
              resolve({ 
                success: false, 
                stage: 'auth', 
                error: `Auth failed: ${data.error?.message || 'Unknown error'}`,
                details: 'The gateway rejected the authentication. Check your password in settings.'
              });
            }
          }
          
          // Handle hello-ok event (alternative auth success)
          else if (data.type === 'event' && data.event === 'hello-ok') {
            const payload = data.payload as {auth?: {deviceToken?: string}} | undefined;
            if (payload?.auth?.deviceToken) {
              storeDeviceToken(payload.auth.deviceToken);
            }
          }
          
          // Legacy auth handling (for backward compatibility)
          else if (data.type === 'auth_success') {
            clearTimeout(timeout);
            ws?.close();
            resolve({ success: true, stage: 'success' });
          } else if (data.type === 'auth_error') {
            clearTimeout(timeout);
            ws?.close();
            resolve({ 
              success: false, 
              stage: 'auth', 
              error: `Auth failed: ${data.error}`,
              details: 'The gateway rejected the password. Check your password in settings.'
            });
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

// Message types from Gateway protocol (v3)
// Request: {type:"req", id, method, params}
// Response: {type:"res", id, ok, payload|error}
// Event: {type:"event", event, payload}

type GatewayMessage =
  | { type: 'req'; id: string; method: string; params: Record<string, unknown> }
  | { type: 'message'; text: string; replyToCurrent?: boolean };

type GatewayResponse =
  | { type: 'res'; id: string; ok: boolean; payload?: unknown; error?: { message: string } }
  | { type: 'event'; event: string; payload: Record<string, unknown> }
  // Legacy message types for chat streaming
  | { type: 'chunk'; content: string; sessionKey?: string }
  | { type: 'done'; sessionKey?: string }
  | { type: 'error'; error: string; sessionKey?: string }
  // Legacy auth responses (for backward compat)
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
  deviceKeyPair: DeviceKeyPair | null;
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
    deviceKeyPair: null,
  };

  private password: string | null = null;
  private connectReqId: string | null = null;
  private challengeNonce: string | null = null;
  private listeners: Set<(connected: boolean) => void> = new Set();
  private stateListeners: Set<(state: ConnectionState) => void> = new Set();
  private messageListeners: Set<(data: GatewayResponse) => void> = new Set();
  private errorListeners: Set<(error: string) => void> = new Set();

  // Initialize device keys on first use
  private async initDeviceKeys(): Promise<void> {
    if (!this.state.deviceKeyPair) {
      this.state.deviceKeyPair = await getDeviceKeyPair();
    }
  }

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
    this.challengeNonce = null;
    this.setConnectionState('connecting');
    this.notifyListeners();
    
    // Initialize device keys
    this.initDeviceKeys();

    const url = getGatewayUrl();
    debugLog(`Connecting to ${url}...`);

    try {
      const ws = new WebSocket(url);

      ws.onopen = () => {
        debugLog('WebSocket opened, waiting for challenge...');
        // Don't send anything yet - wait for connect.challenge event
      };

      ws.onmessage = (event) => {
        try {
          const data: GatewayResponse = JSON.parse(event.data);
          debugLog('Received message:', (data as {type: string}).type);
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

  // Send connect request after receiving challenge
  private async sendConnectRequest(): Promise<void> {
    if (!this.state.ws || this.state.ws.readyState !== WebSocket.OPEN) {
      debugLog('Cannot send connect - WebSocket not open');
      return;
    }

    this.connectReqId = generateReqId();
    const password = this.getPassword();
    
    // Ensure device keys are initialized
    await this.initDeviceKeys();
    
    // Build device identity with challenge signing
    const deviceKeyPair = this.state.deviceKeyPair;
    
    // Sign the challenge if we have keys and a nonce
    let signature: string | undefined;
    let publicKey: string | undefined;
    let signedAt: number | undefined;
    
    if (deviceKeyPair && this.challengeNonce) {
      const sig = await signChallenge(deviceKeyPair.privateKey, this.challengeNonce);
      if (sig) {
        signature = sig;
        publicKey = deviceKeyPair.publicKey;
        signedAt = Date.now();
      }
    }
    
    // Build device object
    const device: {
      id: string;
      nonce: string | null;
      publicKey?: string;
      signature?: string;
      signedAt?: number;
    } = {
      id: deviceKeyPair?.id || getDeviceId(),
      nonce: this.challengeNonce,
    };
    
    // Add optional fields only if present
    if (publicKey) device.publicKey = publicKey;
    if (signature) device.signature = signature;
    if (signedAt) device.signedAt = signedAt;
    
    const connectMessage: GatewayMessage = {
      type: 'req',
      id: this.connectReqId,
      method: 'connect',
      params: {
        minProtocol: PROTOCOL_VERSION,
        maxProtocol: PROTOCOL_VERSION,
        client: {
          id: 'clawbrain',
          version: '1.0.0',
          platform: 'web',
          mode: 'operator',
        },
        role: 'operator',
        scopes: ['operator.read', 'operator.write'],
        caps: [],
        commands: [],
        permissions: {},
        auth: { 
          token: password,
          deviceToken: getStoredDeviceToken(),
        },
        locale: 'en-US',
        userAgent: 'clawbrain/1.0.0',
        device,
      },
    };

    try {
      this.state.ws.send(JSON.stringify(connectMessage));
      debugLog('Connect request sent:', this.connectReqId);
      this.setConnectionState('authenticating');
    } catch (err) {
      debugLog('Failed to send connect request:', err);
      this.handleError('Failed to send connect request');
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
    const msgType = (data as {type: string}).type;
    
    switch (msgType) {
      case 'event':
        this.handleEvent(data as {type: 'event'; event: string; payload: Record<string, unknown>});
        break;

      case 'res':
        this.handleResponse(data as {type: 'res'; id: string; ok: boolean; payload?: unknown; error?: { message: string }});
        break;

      // Legacy message handling (for backward compatibility)
      case 'auth_success':
        debugLog('Auth successful (legacy), joining session...');
        this.state.isAuthenticated = true;
        this.sendLegacyJoin();
        break;

      case 'auth_error':
        debugLog('Auth failed (legacy):', (data as {error: string}).error);
        this.state.isAuthenticated = false;
        this.handleError(`Authentication failed: ${(data as {error: string}).error}`);
        this.disconnect();
        break;

      case 'joined':
        debugLog(`Joined session (legacy): ${(data as {sessionKey: string}).sessionKey}`);
        this.state.isConnecting = false;
        this.state.reconnectAttempts = 0;
        this.setConnectionState('connected');
        this.notifyListeners();
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

  // Handle event messages
  private handleEvent(data: {type: 'event'; event: string; payload: Record<string, unknown>}): void {
    switch (data.event) {
      case 'connect.challenge':
        debugLog('Received connect challenge');
        this.challengeNonce = data.payload.nonce as string;
        this.sendConnectRequest();
        break;

      case 'hello-ok':
        debugLog('Received hello-ok event');
        // Store device token if provided
        const payload = data.payload as {auth?: {deviceToken?: string}} | undefined;
        if (payload?.auth?.deviceToken) {
          storeDeviceToken(payload.auth.deviceToken);
          debugLog('Device token stored from hello-ok');
        }
        break;

      default:
        debugLog('Received event:', data.event);
        // Forward to message listeners for potential handling
        this.messageListeners.forEach((listener) => listener(data as unknown as GatewayResponse));
    }
  }

  // Handle response messages
  private handleResponse(data: {type: 'res'; id: string; ok: boolean; payload?: unknown; error?: { message: string }}): void {
    // Check if this is the connect response
    if (data.id === this.connectReqId) {
      if (data.ok) {
        debugLog('Connect successful, authenticated!');
        this.state.isAuthenticated = true;
        this.state.isConnecting = false;
        this.state.reconnectAttempts = 0;
        this.setConnectionState('connected');
        this.notifyListeners();
        this.flushMessageQueue();
        
        // Store device token if provided
        const payload = data.payload as {auth?: {deviceToken?: string}} | undefined;
        if (payload?.auth?.deviceToken) {
          storeDeviceToken(payload.auth.deviceToken);
          debugLog('Device token stored from connect response');
        }
      } else {
        debugLog('Connect failed:', data.error);
        this.state.isAuthenticated = false;
        
        // Clear device token on auth failure
        clearDeviceToken();
        
        // Check if it's a device auth failure
        const errorMsg = data.error?.message || 'Unknown error';
        if (errorMsg.includes('device') || errorMsg.includes('signature')) {
          debugLog('Device auth failed, clearing keys for regeneration');
          // Clear device keys so they'll be regenerated
          if (typeof window !== 'undefined') {
            localStorage.removeItem(DEVICE_KEY_STORAGE_KEY);
          }
          this.state.deviceKeyPair = null;
        }
        
        this.handleError(`Authentication failed: ${errorMsg}`);
        // Don't reconnect on auth error
        this.disconnect();
      }
      return;
    }

    // Forward other responses to listeners
    this.messageListeners.forEach((listener) => listener(data as unknown as GatewayResponse));
  }

  // Send legacy join message (for backward compatibility)
  private sendLegacyJoin(): void {
    if (!this.state.ws || this.state.ws.readyState !== WebSocket.OPEN) return;
    
    const joinMessage = {
      type: 'join',
      sessionKey: SESSION_KEY,
      label: 'main',
    };
    
    try {
      this.state.ws.send(JSON.stringify(joinMessage));
      debugLog('Legacy join message sent');
    } catch (err) {
      debugLog('Failed to send legacy join:', err);
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

  // Send a chat message (legacy format - can be updated to use req/res protocol)
  sendMessage(text: string, replyToCurrent: boolean = true): boolean {
    // Use legacy message format for chat
    const message = {
      type: 'message',
      text,
      replyToCurrent,
    };
    
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
