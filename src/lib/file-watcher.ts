import { useEffect, useRef, useCallback } from 'react';
import { useTaskStore } from '@/stores/task-store';

// Polling intervals - INCREASED to reduce flickering
const VISIBLE_POLL_INTERVAL = 30000; // 30 seconds when visible (was 5 seconds)
const HIDDEN_POLL_INTERVAL = 120000; // 2 minutes when hidden (was 30 seconds)

// Client-side polling-based file watcher
export function useFileWatcher() {
  // Use individual selector for stable reference
  const refreshFromWatcher = useTaskStore(useCallback((state) => state.refreshFromWatcher, []));
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const visibilityRef = useRef<boolean>(true);
  const lastRefreshRef = useRef<number>(0);
  
  // Debounced refresh function - only refresh if enough time has passed
  const debouncedRefresh = useCallback(async () => {
    const now = Date.now();
    const timeSinceLastRefresh = now - lastRefreshRef.current;
    const minInterval = 5000; // Minimum 5 seconds between refreshes
    
    if (timeSinceLastRefresh < minInterval) {
      return; // Skip if we just refreshed
    }
    
    lastRefreshRef.current = now;
    await refreshFromWatcher();
  }, [refreshFromWatcher]);
  
  // Handle visibility change
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const handleVisibilityChange = () => {
      const isVisible = !document.hidden;
      visibilityRef.current = isVisible;
      
      // Update polling interval based on visibility
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        
        const interval = isVisible ? VISIBLE_POLL_INTERVAL : HIDDEN_POLL_INTERVAL;
        intervalRef.current = setInterval(() => {
          debouncedRefresh();
        }, interval);
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [debouncedRefresh]);
  
  useEffect(() => {
    // Only run in browser environment
    if (typeof window === 'undefined') return;
    
    // Set up polling via API
    const interval = visibilityRef.current ? VISIBLE_POLL_INTERVAL : HIDDEN_POLL_INTERVAL;
    
    const pollInterval = setInterval(() => {
      debouncedRefresh();
    }, interval);
    
    intervalRef.current = pollInterval;
    
    // Cleanup on unmount
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [debouncedRefresh]);
  
  return {
    refresh: debouncedRefresh,
  };
}

// Hook to initialize file watching on component mount
export function useInitializeFileWatcher() {
  // Use stable selector with useCallback
  const loadTasks = useTaskStore(useCallback((state) => state.loadTasks, []));
  const hasLoadedRef = useRef(false);
  
  useEffect(() => {
    // Load tasks on mount - prevent double-loading in Strict Mode
    if (!hasLoadedRef.current) {
      hasLoadedRef.current = true;
      loadTasks();
    }
  }, [loadTasks]);
  
  // Return the polling-based watcher
  return useFileWatcher();
}
