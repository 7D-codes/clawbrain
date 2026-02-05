'use client';

import { useEffect, useRef, useCallback } from 'react';
import { useTaskStore } from '@/stores/task-store';

// Client-side polling-based file watcher
export function useFileWatcher() {
  const refreshFromWatcher = useTaskStore(state => state.refreshFromWatcher);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  
  // Debounced refresh function (300ms as per requirements)
  const debouncedRefresh = useCallback(async () => {
    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    // Set new timeout
    timeoutRef.current = setTimeout(async () => {
      console.log('[FileWatcher] Detected file change, refreshing tasks...');
      await refreshFromWatcher();
    }, 300);
  }, [refreshFromWatcher]);
  
  useEffect(() => {
    // Only run in browser environment
    if (typeof window === 'undefined') return;
    
    // Set up polling via API
    // In a real implementation, we might use SSE or WebSocket from server
    const pollInterval = setInterval(() => {
      debouncedRefresh();
    }, 5000); // Poll every 5 seconds as fallback
    
    intervalRef.current = pollInterval;
    
    // Cleanup on unmount
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [debouncedRefresh]);
  
  return {
    refresh: debouncedRefresh,
  };
}

// Hook to initialize file watching on component mount
export function useInitializeFileWatcher() {
  const loadTasks = useTaskStore(state => state.loadTasks);
  
  useEffect(() => {
    // Load tasks on mount
    loadTasks();
  }, [loadTasks]);
  
  // Return the polling-based watcher
  return useFileWatcher();
}
