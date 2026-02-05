// Server-only file - do not import in client components
import { watch } from 'chokidar';

// Debounce utility
function debounce<T extends (...args: unknown[]) => void>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  
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

export interface FileWatcherOptions {
  path: string;
  onChange: () => void;
  onAdd?: () => void;
  onDelete?: () => void;
  debounceMs?: number;
}

// Server-side file watcher (for use in Node.js environment only)
export async function createFileWatcher(options: FileWatcherOptions) {
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
