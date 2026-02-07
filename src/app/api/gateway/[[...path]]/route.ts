import { NextRequest, NextResponse } from 'next/server';

/**
 * Gateway Proxy Route
 * 
 * Proxies requests to the OpenClaw Gateway to avoid CORS issues.
 * All paths under /api/gateway/* are forwarded to the gateway.
 * 
 * Example:
 *   /api/gateway/v1/responses -> http://localhost:18789/v1/responses
 */

// CORS headers for all responses
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-openclaw-agent-id',
  'Access-Control-Max-Age': '86400',
};

/**
 * Handle OPTIONS requests for CORS preflight
 */
export async function OPTIONS(): Promise<NextResponse> {
  return new NextResponse(null, {
    status: 204,
    headers: corsHeaders,
  });
}

/**
 * Handle POST requests - proxy to gateway
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ path?: string[] }> }
): Promise<NextResponse> {
  const { path } = await params;
  const pathString = path?.join('/') || '';
  
  try {
    // Get gateway URL from query param, header, or default
    const searchParams = request.nextUrl.searchParams;
    const gatewayUrl = searchParams.get('gatewayUrl') || 
                       request.headers.get('x-gateway-url') ||
                       'http://localhost:18789';
    
    // Construct target URL
    const targetUrl = `${gatewayUrl}/${pathString}`;
    
    // Get headers from request
    const authHeader = request.headers.get('authorization');
    const agentId = request.headers.get('x-openclaw-agent-id') || 'main';
    const contentType = request.headers.get('content-type') || 'application/json';
    
    // Set up timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
    
    try {
      // Forward the request
      const response = await fetch(targetUrl, {
        method: 'POST',
        headers: {
          'Authorization': authHeader || '',
          'Content-Type': contentType,
          'x-openclaw-agent-id': agentId,
          'Accept': request.headers.get('accept') || '*/*',
        },
        body: await request.text(),
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      
      // Get response headers
      const responseHeaders: Record<string, string> = {
        ...corsHeaders,
        'Content-Type': response.headers.get('content-type') || 'application/json',
      };
      
      // Handle streaming responses (SSE)
      const contentType_header = response.headers.get('content-type') || '';
      if (contentType_header.includes('text/event-stream')) {
        responseHeaders['Content-Type'] = 'text/event-stream';
        responseHeaders['Cache-Control'] = 'no-cache';
        responseHeaders['Connection'] = 'keep-alive';
      }
      
      // Create response with proper status and headers
      const responseBody = await response.text();
      
      return new NextResponse(responseBody, {
        status: response.status,
        statusText: response.statusText,
        headers: responseHeaders,
      });
      
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
    
  } catch (error) {
    console.error('Gateway proxy error:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const isTimeout = error instanceof Error && error.name === 'AbortError';
    
    return NextResponse.json(
      {
        error: isTimeout ? 'Gateway request timed out' : 'Gateway proxy error',
        code: isTimeout ? 'GATEWAY_TIMEOUT' : 'GATEWAY_PROXY_ERROR',
        details: errorMessage,
        path: pathString,
      },
      {
        status: isTimeout ? 504 : 502,
        headers: corsHeaders,
      }
    );
  }
}

/**
 * Handle GET requests - proxy to gateway
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path?: string[] }> }
): Promise<NextResponse> {
  const { path } = await params;
  const pathString = path?.join('/') || '';
  
  try {
    // Get gateway URL
    const searchParams = request.nextUrl.searchParams;
    const gatewayUrl = searchParams.get('gatewayUrl') || 
                       request.headers.get('x-gateway-url') ||
                       'http://localhost:18789';
    
    const targetUrl = `${gatewayUrl}/${pathString}${request.nextUrl.search}`;
    
    const authHeader = request.headers.get('authorization');
    const agentId = request.headers.get('x-openclaw-agent-id') || 'main';
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);
    
    try {
      const response = await fetch(targetUrl, {
        method: 'GET',
        headers: {
          'Authorization': authHeader || '',
          'x-openclaw-agent-id': agentId,
          'Accept': request.headers.get('accept') || '*/*',
        },
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      
      const responseBody = await response.text();
      
      return new NextResponse(responseBody, {
        status: response.status,
        statusText: response.statusText,
        headers: {
          ...corsHeaders,
          'Content-Type': response.headers.get('content-type') || 'application/json',
        },
      });
      
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
    
  } catch (error) {
    console.error('Gateway proxy GET error:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const isTimeout = error instanceof Error && error.name === 'AbortError';
    
    return NextResponse.json(
      {
        error: isTimeout ? 'Gateway request timed out' : 'Gateway proxy error',
        code: isTimeout ? 'GATEWAY_TIMEOUT' : 'GATEWAY_PROXY_ERROR',
        details: errorMessage,
      },
      {
        status: isTimeout ? 504 : 502,
        headers: corsHeaders,
      }
    );
  }
}
