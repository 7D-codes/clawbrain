'use client';

import { useEffect, useRef, useCallback } from 'react';
import { useTaskStore } from '@/stores/task-store';

// Debounce utility
function debounce<T extends (...args: unknown[]) => void>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout | null = null;
  
  return (...args: Parameters<T>) => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    timeoutId = setTimeout(() => {
      fn(...args);
      timeoutId = null;
    }, delay);
  };
}

// File watcher hook
export function useFileWatcher() {
  const refreshFromWatcher = useTaskStore(state => state.refreshFromWatcher);
  const watcherRef = useRef<AbortController | null>(null);
  
  // Debounced refresh function (300ms as per requirements)
  const debouncedRefresh = useCallback(
    debounce(async () => {
      console.log('[FileWatcher] Detected file change, refreshing tasks...');
      await refreshFromWatcher();
    }, 300),
    [refreshFromWatcher]
  );
  
  useEffect(() => {
    // Only run in browser environment
    if (typeof window === 'undefined') return;
    
    // Check if we should use native File System Access API
    // or fallback to polling via API
    const setupWatcher = async () => {
      try {
        // Try to use the File System Access API for real-time watching
        // This requires the user to have granted permission
        if ('showDirectoryPicker' in window) {
          // For now, we'll use polling via the API endpoint
          // The File System Access API requires user interaction to pick a directory
          console.log('[FileWatcher] Using polling-based file watching');
        }
        
        // Set up polling via API
        // In a real implementation, we might use SSE or WebSocket from server
        const pollInterval = setInterval(() => {
          debouncedRefresh();
        }, 5000); // Poll every 5 seconds as fallback
        
        watcherRef.current = {
          abort: () => clearInterval(pollInterval),
        } as AbortController;
        
      } catch (error) {
        console.error('[FileWatcher] Failed to set up file watcher:', error);
      }
    };
    
    setupWatcher();
    
    // Cleanup on unmount
    return () => {
      if (watcherRef.current) {
        watcherRef.current.abort();
      }
    };
  }, [debouncedRefresh]);
  
  return {
    refresh: debouncedRefresh,
  };
}

// Server-side file watcher (for use in Node.js environment)
// This would be used in a server component or API route
export interface FileWatcherOptions {
  path: string;
  onChange: () => void;
  onAdd?: () => void;
  onDelete?: () => void;
  debounceMs?: number;
}

// This function is for server-side usage only
export async function createFileWatcher(options: FileWatcherOptions) {
  // Dynamic import to avoid bundling chokidar in client
  const { watch } = await import('chokidar');
  
  const debouncedOnChange = debounce(options.onChange, options.debounceMs || 300);
  const debouncedOnAdd = options.onAdd ? debounce(options.onAdd, options.debounceMs || 300) : null;
  const debouncedOnDelete = options.onDelete ? debounce(options.onDelete, options.debounceMs || 300) : null;
  
  const watcher = watch(options.path, {
    ignoreInitial: true,
    awaitWriteFinish: {
      stabilityThreshold: 300,
      pollInterval: 100,
    },
  });
  
  watcher.on('change', debouncedOnChange);
  
  if (debouncedOnAdd) {
    watcher.on('add', debouncedOnAdd);
  }
  
  if (debouncedOnDelete) {
    watcher.on('unlink', debouncedOnDelete);
  }
  
  return {
    close: () => watcher.close(),
    isReady: () => new Promise<void>((resolve) => {
      watcher.on('ready', resolve);
    }),
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
