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

// Store state interface
interface TaskState {
  // Tasks
  tasks: Task[];
  loadingTasks: boolean;
  tasksError: string | null;
  
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
      selectedTaskId: null,
      lastRefresh: 0,
      
      // Load all tasks from API
      loadTasks: async () => {
        set({ loadingTasks: true, tasksError: null });
        try {
          const response = await fetch('/api/tasks');
          if (!response.ok) throw new Error('Failed to load tasks');
          const data = await response.json();
          set({ tasks: data.tasks, loadingTasks: false, lastRefresh: Date.now() });
        } catch (error) {
          set({ 
            tasksError: error instanceof Error ? error.message : 'Unknown error', 
            loadingTasks: false 
          });
        }
      },
      
      // Update a task (PATCH to API)
      updateTask: async (id: string, updates: Partial<Task>) => {
        try {
          const response = await fetch(`/api/tasks/${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updates),
          });
          
          if (!response.ok) throw new Error('Failed to update task');
          
          const { task: updatedTask } = await response.json();
          
          // Update local state
          set(state => ({
            tasks: state.tasks.map(t => t.id === id ? updatedTask : t),
          }));
        } catch (error) {
          console.error('Failed to update task:', error);
          throw error;
        }
      },
      
      // Create a new task
      createTask: async (taskData) => {
        const response = await fetch('/api/tasks', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(taskData),
        });
        
        if (!response.ok) throw new Error('Failed to create task');
        
        const { task } = await response.json();
        set(state => ({ tasks: [...state.tasks, task] }));
        return task;
      },
      
      // Delete a task
      deleteTask: async (id: string) => {
        const response = await fetch(`/api/tasks/${id}`, {
          method: 'DELETE',
        });
        
        if (!response.ok) throw new Error('Failed to delete task');
        
        set(state => ({
          tasks: state.tasks.filter(t => t.id !== id),
        }));
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
        // Prevent rapid successive refreshes
        const now = Date.now();
        const lastRefresh = get().lastRefresh;
        if (now - lastRefresh < 300) return;
        
        await get().loadTasks();
      },
    }),
    {
      name: 'clawbrain-tasks',
      partialize: (state) => ({ selectedTaskId: state.selectedTaskId }),
    }
  )
);
