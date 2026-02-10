import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Task types
export type TaskStatus = 'todo' | 'in-progress' | 'done';

export interface Task {
  id: string;
  slug: string;
  title: string;
  status: TaskStatus;
  project: string;
  created: string;
  updated: string;
  content: string;
  description?: string;
}

// Retry configuration
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // Start with 1 second

// Helper for fetch with timeout and retry
async function fetchWithRetry(
  url: string, 
  options: RequestInit,
  retries = MAX_RETRIES
): Promise<Response> {
  const timeoutMs = 10000; // 10 second timeout
  
  for (let attempt = 0; attempt <= retries; attempt++) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
    
    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      
      // Don't retry on user abort
      if (error instanceof Error && error.name === 'AbortError') {
        throw error;
      }
      
      // Last attempt - throw error
      if (attempt === retries) {
        throw error;
      }
      
      // Wait before retry with exponential backoff
      await new Promise(resolve => 
        setTimeout(resolve, RETRY_DELAY * Math.pow(2, attempt))
      );
    }
  }
  
  throw new Error('Max retries exceeded');
}

// Store state interface
interface TaskState {
  // Tasks
  tasks: Task[];
  loadingTasks: boolean;
  tasksError: string | null;
  
  // Pending operations for optimistic updates
  pendingOperations: Map<string, 'create' | 'update' | 'delete'>;
  
  // UI State
  selectedTaskId: string | null;
  lastRefresh: number;
  
  // Actions
  loadTasks: () => Promise<void>;
  updateTask: (id: string, updates: Partial<Task>) => Promise<void>;
  createTask: (task: Omit<Task, 'id' | 'created' | 'updated'>) => Promise<Task>;
  deleteTask: (id: string) => Promise<void>;
  selectTask: (id: string | null) => void;
  getTasksByStatus: (status: TaskStatus) => Task[];
  refreshFromWatcher: () => Promise<void>;
  clearError: () => void;
}

// Helper to parse task from markdown content
export function parseTaskFile(content: string, filename: string): Task | null {
  try {
    // Extract frontmatter
    const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
    if (!frontmatterMatch) return null;
    
    const [, frontmatter, body] = frontmatterMatch;
    
    // Parse YAML frontmatter
    const meta: Record<string, string> = {};
    frontmatter.split('\n').forEach(line => {
      const match = line.match(/^([^:]+):\s*(.*)$/);
      if (match) {
        meta[match[1].trim()] = match[2].trim().replace(/^["']|["']$/g, '');
      }
    });
    
    // Extract description from body
    const descriptionMatch = body.match(/## Description\n+([^\n#]+)/);
    
    return {
      id: meta.id || filename.replace('.md', ''),
      slug: meta.slug || '',
      title: meta.title || 'Untitled',
      status: (meta.status as TaskStatus) || 'todo',
      project: meta.project || 'default',
      created: meta.created || new Date().toISOString(),
      updated: meta.updated || new Date().toISOString(),
      content: body,
      description: descriptionMatch?.[1]?.trim() || undefined,
    };
  } catch (error) {
    console.error('Failed to parse task file:', error);
    return null;
  }
}

// Create the store
export const useTaskStore = create<TaskState>()(
  persist(
    (set, get) => ({
      // Initial state
      tasks: [],
      loadingTasks: false,
      tasksError: null,
      pendingOperations: new Map(),
      selectedTaskId: null,
      lastRefresh: 0,
      
      // Clear error
      clearError: () => set({ tasksError: null }),
      
      // Load all tasks from API - with intelligent diff updating
      loadTasks: async () => {
        // Don't show loading state if we already have tasks (prevents flicker)
        const hasExistingTasks = get().tasks.length > 0;
        if (!hasExistingTasks) {
          set({ loadingTasks: true });
        }
        set({ tasksError: null });
        
        try {
          const response = await fetchWithRetry('/api/tasks', { method: 'GET' });
          
          if (!response.ok) {
            throw new Error(`Failed to load tasks: ${response.status}`);
          }
          
          const data = await response.json();
          const newTasks = data.tasks;
          
          // Intelligent merge: only update changed tasks
          const currentTasks = get().tasks;
          const pendingOps = get().pendingOperations;
          
          // Create a map of current tasks for quick lookup
          const currentTaskMap = new Map(currentTasks.map(t => [t.id, t]));
          
          // Merge new tasks with current, preserving optimistic updates
          const mergedTasks = newTasks.map((newTask: Task) => {
            const current = currentTaskMap.get(newTask.id);
            
            // If there's a pending operation on this task, keep the optimistic version
            if (pendingOps.has(newTask.id)) {
              return currentTasks.find(t => t.id === newTask.id) || newTask;
            }
            
            // If task hasn't changed, keep current reference (prevents re-render)
            if (current && 
                current.status === newTask.status &&
                current.title === newTask.title &&
                current.updated === newTask.updated) {
              return current;
            }
            
            return newTask;
          });
          
          // Add any tasks that are being created (not yet in server response)
          const creatingTasks = currentTasks.filter(t => 
            pendingOps.get(t.id) === 'create' && 
            !newTasks.find((nt: Task) => nt.id === t.id)
          );
          
          set({ 
            tasks: [...mergedTasks, ...creatingTasks], 
            loadingTasks: false, 
            lastRefresh: Date.now() 
          });
        } catch (error) {
          const errorMsg = error instanceof Error ? error.message : 'Unknown error';
          console.error('Failed to load tasks:', error);
          set({ 
            tasksError: errorMsg, 
            loadingTasks: false 
          });
          
          // Auto-retry after 10 seconds on error (increased from 5)
          setTimeout(() => {
            if (get().tasksError) {
              get().loadTasks();
            }
          }, 10000);
        }
      },
      
      // Update a task (PATCH to API) with optimistic update
      updateTask: async (id: string, updates: Partial<Task>) => {
        const currentTasks = get().tasks;
        const taskIndex = currentTasks.findIndex(t => t.id === id);
        
        if (taskIndex === -1) {
          throw new Error('Task not found');
        }
        
        const originalTask = currentTasks[taskIndex];
        const optimisticTask = { ...originalTask, ...updates, updated: new Date().toISOString() };
        
        // Optimistic update
        set(state => ({
          tasks: state.tasks.map(t => t.id === id ? optimisticTask : t),
          pendingOperations: new Map(state.pendingOperations).set(id, 'update'),
        }));
        
        try {
          const response = await fetchWithRetry(`/api/tasks/${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updates),
          });
          
          if (!response.ok) {
            throw new Error(`Failed to update task: ${response.status}`);
          }
          
          const { task: updatedTask } = await response.json();
          
          // Update with server response
          set(state => ({
            tasks: state.tasks.map(t => t.id === id ? updatedTask : t),
            pendingOperations: (() => {
              const newOps = new Map(state.pendingOperations);
              newOps.delete(id);
              return newOps;
            })(),
          }));
        } catch (error) {
          // Revert optimistic update on error
          set(state => ({
            tasks: state.tasks.map(t => t.id === id ? originalTask : t),
            pendingOperations: (() => {
              const newOps = new Map(state.pendingOperations);
              newOps.delete(id);
              return newOps;
            })(),
          }));
          
          console.error('Failed to update task:', error);
          throw error;
        }
      },
      
      // Create a new task with optimistic update
      createTask: async (taskData) => {
        // Generate temporary ID for optimistic update
        const tempId = `temp-${Date.now()}`;
        const optimisticTask: Task = {
          id: tempId,
          ...taskData,
          created: new Date().toISOString(),
          updated: new Date().toISOString(),
        };
        
        // Optimistic update
        set(state => ({
          tasks: [...state.tasks, optimisticTask],
          pendingOperations: new Map(state.pendingOperations).set(tempId, 'create'),
        }));
        
        try {
          const response = await fetchWithRetry('/api/tasks', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(taskData),
          });
          
          if (!response.ok) {
            throw new Error(`Failed to create task: ${response.status}`);
          }
          
          const { task } = await response.json();
          
          // Replace optimistic task with real task
          set(state => ({
            tasks: state.tasks.map(t => t.id === tempId ? task : t),
            pendingOperations: (() => {
              const newOps = new Map(state.pendingOperations);
              newOps.delete(tempId);
              return newOps;
            })(),
          }));
          
          return task;
        } catch (error) {
          // Remove optimistic task on error
          set(state => ({
            tasks: state.tasks.filter(t => t.id !== tempId),
            pendingOperations: (() => {
              const newOps = new Map(state.pendingOperations);
              newOps.delete(tempId);
              return newOps;
            })(),
          }));
          
          console.error('Failed to create task:', error);
          throw error;
        }
      },
      
      // Delete a task with optimistic update
      deleteTask: async (id: string) => {
        const currentTasks = get().tasks;
        const taskToDelete = currentTasks.find(t => t.id === id);
        
        if (!taskToDelete) {
          throw new Error('Task not found');
        }
        
        // Optimistic delete
        set(state => ({
          tasks: state.tasks.filter(t => t.id !== id),
          pendingOperations: new Map(state.pendingOperations).set(id, 'delete'),
        }));
        
        try {
          const response = await fetchWithRetry(`/api/tasks/${id}`, {
            method: 'DELETE',
          });
          
          if (!response.ok) {
            throw new Error(`Failed to delete task: ${response.status}`);
          }
          
          // Remove from pending
          set(state => ({
            pendingOperations: (() => {
              const newOps = new Map(state.pendingOperations);
              newOps.delete(id);
              return newOps;
            })(),
          }));
        } catch (error) {
          // Restore task on error
          set(state => ({
            tasks: [...state.tasks, taskToDelete],
            pendingOperations: (() => {
              const newOps = new Map(state.pendingOperations);
              newOps.delete(id);
              return newOps;
            })(),
          }));
          
          console.error('Failed to delete task:', error);
          throw error;
        }
      },
      
      // Select a task for detail view
      selectTask: (id: string | null) => {
        set({ selectedTaskId: id });
      },
      
      // Get tasks filtered by status
      getTasksByStatus: (status: TaskStatus) => {
        return get().tasks.filter(t => t.status === status);
      },
      
      // Refresh triggered by file watcher (debounced)
      refreshFromWatcher: async () => {
        // Prevent rapid successive refreshes - increased from 300ms to 2000ms
        const now = Date.now();
        const lastRefresh = get().lastRefresh;
        if (now - lastRefresh < 2000) return;
        
        // Don't refresh if there are pending operations
        if (get().pendingOperations.size > 0) {
          return;
        }
        
        await get().loadTasks();
      },
    }),
    {
      name: 'clawbrain-tasks',
      partialize: (state) => ({ selectedTaskId: state.selectedTaskId }),
    }
  )
);
