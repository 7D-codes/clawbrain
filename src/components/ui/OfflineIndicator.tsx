"use client";

import { useState, useEffect } from "react";
import { Wifi, WifiOff } from "lucide-react";

/**
 * Offline indicator component that shows connection status to Gateway
 * Displays a banner when disconnected from the WebSocket
 */
export function OfflineIndicator() {
  const [isOnline, setIsOnline] = useState(true);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    let ws: WebSocket | null = null;
    let checkInterval: NodeJS.Timeout | null = null;

    const checkConnection = () => {
      try {
        ws = new WebSocket("ws://localhost:18789");
        
        ws.onopen = () => {
          setIsOnline(true);
          setIsVisible(false);
          ws?.close();
        };

        ws.onerror = () => {
          setIsOnline(false);
          setIsVisible(true);
        };

        ws.onclose = () => {
          setIsOnline(false);
          setIsVisible(true);
        };
      } catch {
        setIsOnline(false);
        setIsVisible(true);
      }
    };

    // Initial check
    checkConnection();

    // Periodic checks every 10 seconds
    checkInterval = setInterval(checkConnection, 10000);

    return () => {
      if (checkInterval) clearInterval(checkInterval);
      if (ws) ws.close();
    };
  }, []);

  if (!isVisible) {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-1/2 z-50 -translate-x-1/2">
      <div 
        className={`
          flex items-center gap-3 border px-4 py-2 font-mono text-xs
          ${isOnline 
            ? 'border-border-strong bg-background text-foreground' 
            : 'border-destructive bg-destructive/10 text-destructive'
          }
        `}
      >
        {isOnline ? (
          <>
            <Wifi className="h-4 w-4" />
            <span>Connected to Gateway</span>
          </>
        ) : (
          <>
            <WifiOff className="h-4 w-4" />
            <span>Gateway Offline</span>
          </>
        )}
      </div>
    </div>
  );
}
