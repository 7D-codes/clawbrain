'use client';

import { useState, useCallback, useEffect } from 'react';
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragOverEvent,
  DragEndEvent,
  defaultDropAnimationSideEffects,
  DropAnimation,
} from '@dnd-kit/core';
import { arrayMove, sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { Task, TaskStatus, useTaskStore } from '@/stores/task-store';
import { KanbanColumn } from './KanbanColumn';
import { TaskCard } from './TaskCard';
import { useInitializeFileWatcher } from '@/lib/file-watcher';
import { cn } from '@/lib/utils';

// Column definitions
const COLUMNS: { id: TaskStatus; title: string }[] = [
  { id: 'todo', title: 'To Do' },
  { id: 'in-progress', title: 'In Progress' },
  { id: 'done', title: 'Done' },
];

export function KanbanBoard() {
  // Store state
  const tasks = useTaskStore(state => state.tasks);
  const loadingTasks = useTaskStore(state => state.loadingTasks);
  const tasksError = useTaskStore(state => state.tasksError);
  const updateTask = useTaskStore(state => state.updateTask);
  const loadTasks = useTaskStore(state => state.loadTasks);
  
  // Local state for drag operations
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [localTasks, setLocalTasks] = useState<Task[]>([]);
  
  // Initialize file watcher
  useInitializeFileWatcher();
  
  // Sync local tasks with store
  useEffect(() => {
    setLocalTasks(tasks);
  }, [tasks]);
  
  // Configure sensors for drag detection
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5, // Minimum drag distance before activation
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );
  
  // Get tasks by status
  const getTasksByStatus = useCallback((status: TaskStatus) => {
    return localTasks.filter(task => task.status === status);
  }, [localTasks]);
  
  // Handle drag start
  const handleDragStart = useCallback((event: DragStartEvent) => {
    const { active } = event;
    const taskId = active.id as string;
    const task = localTasks.find(t => t.id === taskId);
    if (task) {
      setActiveTask(task);
    }
  }, [localTasks]);
  
  // Handle drag over (for visual feedback during drag)
  const handleDragOver = useCallback((event: DragOverEvent) => {
    const { active, over } = event;
    
    if (!over) return;
    
    const activeId = active.id as string;
    const overId = over.id as string;
    
    if (activeId === overId) return;
    
    // Check if dragging over a column
    const overColumn = COLUMNS.find(col => col.id === overId);
    
    if (overColumn) {
      // Update task status optimistically
      setLocalTasks(prev => {
        const taskIndex = prev.findIndex(t => t.id === activeId);
        if (taskIndex === -1) return prev;
        
        const newTasks = [...prev];
        newTasks[taskIndex] = {
          ...newTasks[taskIndex],
          status: overColumn.id,
        };
        return newTasks;
      });
    }
  }, []);
  
  // Handle drag end (commit changes)
  const handleDragEnd = useCallback(async (event: DragEndEvent) => {
    const { active, over } = event;
    
    setActiveTask(null);
    
    if (!over) return;
    
    const activeId = active.id as string;
    const overId = over.id as string;
    
    // Find the target status
    let targetStatus: TaskStatus | null = null;
    
    // Check if dropped on a column
    const targetColumn = COLUMNS.find(col => col.id === overId);
    if (targetColumn) {
      targetStatus = targetColumn.id;
    } else {
      // Check if dropped on another task
      const targetTask = localTasks.find(t => t.id === overId);
      if (targetTask) {
        targetStatus = targetTask.status;
      }
    }
    
    if (!targetStatus) return;
    
    // Find the dragged task
    const draggedTask = localTasks.find(t => t.id === activeId);
    if (!draggedTask) return;
    
    // Only update if status changed
    if (draggedTask.status !== targetStatus) {
      try {
        // Optimistic update already done in handleDragOver
        // Now commit to server
        await updateTask(activeId, { status: targetStatus });
      } catch (error) {
        console.error('Failed to update task status:', error);
        // Revert on error
        await loadTasks();
      }
    }
  }, [localTasks, updateTask, loadTasks]);
  
  // Drop animation configuration
  const dropAnimation: DropAnimation = {
    sideEffects: defaultDropAnimationSideEffects({
      styles: {
        active: {
          opacity: '0.5',
        },
      },
    }),
  };
  
  // Loading state
  if (loadingTasks && localTasks.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="flex flex-col items-center gap-4">
          {/* Wireframe loading indicator */}
          <div className="flex gap-1">
            {[0, 1, 2].map(i => (
              <div
                key={i}
                className={cn(
                  'w-2 h-8 bg-neutral-300',
                  'animate-pulse'
                )}
                style={{ animationDelay: `${i * 150}ms` }}
              />
            ))}
          </div>
          <span className="text-xs font-mono text-neutral-400 uppercase tracking-wider">
            Loading tasks...
          </span>
        </div>
      </div>
    );
  }
  
  // Error state
  if (tasksError) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="flex flex-col items-center gap-4 max-w-md text-center p-6 border border-neutral-300">
          <div className="w-8 h-8 border border-neutral-900 flex items-center justify-center">
            <span className="text-lg">!</span>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-neutral-900 mb-1">
              Error Loading Tasks
            </h3>
            <p className="text-xs text-neutral-500 font-mono">
              {tasksError}
            </p>
          </div>
          <button
            onClick={() => loadTasks()}
            className={cn(
              'px-4 py-2 text-xs font-medium',
              'border border-neutral-900 text-neutral-900',
              'hover:bg-neutral-900 hover:text-white',
              'transition-colors duration-150',
              'rounded-none'
            )}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="h-full flex flex-col">
      {/* Board header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-200">
        <div className="flex items-center gap-4">
          <h1 className="text-lg font-semibold text-neutral-900">
            Tasks
          </h1>
          <span className="text-xs font-mono text-neutral-400">
            {localTasks.length} total
          </span>
        </div>
        
        {/* Board actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => loadTasks()}
            className={cn(
              'px-3 py-1.5 text-xs font-medium',
              'border border-neutral-300 text-neutral-600',
              'hover:border-neutral-500 hover:text-neutral-900',
              'transition-colors duration-150',
              'rounded-none'
            )}
          >
            Refresh
          </button>
        </div>
      </div>
      
      {/* Kanban board */}
      <div className="flex-1 overflow-x-auto overflow-y-hidden">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
        >
          <div className="flex h-full min-w-max">
            {COLUMNS.map(column => (
              <KanbanColumn
                key={column.id}
                id={column.id}
                title={column.title}
                tasks={getTasksByStatus(column.id)}
              />
            ))}
          </div>
          
          {/* Drag overlay for smooth dragging */}
          <DragOverlay dropAnimation={dropAnimation}>
            {activeTask ? (
              <TaskCard 
                task={activeTask} 
                onClick={() => {}}
              />
            ) : null}
          </DragOverlay>
        </DndContext>
      </div>
      
      {/* Status bar */}
      <div className="flex items-center justify-between px-4 py-2 border-t border-neutral-200 bg-neutral-50/50">
        <div className="flex items-center gap-4 text-xs font-mono text-neutral-400">
          <span>TODO: {getTasksByStatus('todo').length}</span>
          <span>IN PROGRESS: {getTasksByStatus('in-progress').length}</span>
          <span>DONE: {getTasksByStatus('done').length}</span>
        </div>
        
        {loadingTasks && (
          <span className="text-xs font-mono text-neutral-400">
            Syncing...
          </span>
        )}
      </div>
    </div>
  );
}
