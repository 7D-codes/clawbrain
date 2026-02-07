'use client';

import { useEffect, useRef, useCallback } from 'react';
import { useTaskStore } from '@/stores/task-store';

// Polling intervals
const VISIBLE_POLL_INTERVAL = 5000; // 5 seconds when visible
const HIDDEN_POLL_INTERVAL = 30000; // 30 seconds when hidden

// Client-side polling-based file watcher
export function useFileWatcher() {
  // Use individual selector for stable reference
  const refreshFromWatcher = useTaskStore(useCallback((state) => state.refreshFromWatcher, []));
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const visibilityRef = useRef<boolean>(true);
  
  // Debounced refresh function (300ms as per requirements)
  // Use ref for the refresh function to avoid recreating the debounced function
  const refreshRef = useRef(refreshFromWatcher);
  refreshRef.current = refreshFromWatcher;
  
  const debouncedRefresh = useCallback(async () => {
    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    // Set new timeout
    timeoutRef.current = setTimeout(async () => {
      await refreshRef.current();
    }, 300);
  }, []); // No dependencies - uses ref for the actual function
  
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
    // Use longer interval when tab is hidden to save resources
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
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
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
  const retryCountRef = useRef(0);
  const MAX_RETRIES = 3;
  
  useEffect(() => {
    // Load tasks on mount - prevent double-loading in Strict Mode
    if (!hasLoadedRef.current) {
      hasLoadedRef.current = true;
      
      const loadWithRetry = async () => {
        try {
          await loadTasks();
          retryCountRef.current = 0; // Reset on success
        } catch (error) {
          console.error('Failed to load tasks:', error);
          
          // Retry with exponential backoff
          if (retryCountRef.current < MAX_RETRIES) {
            retryCountRef.current++;
            const delay = 1000 * Math.pow(2, retryCountRef.current - 1);
            console.log(`Retrying loadTasks in ${delay}ms (attempt ${retryCountRef.current})`);
            
            setTimeout(() => {
              hasLoadedRef.current = false; // Allow retry
            }, delay);
          }
        }
      };
      
      loadWithRetry();
    }
  }, [loadTasks]);
  
  // Return the polling-based watcher
  return useFileWatcher();
}
