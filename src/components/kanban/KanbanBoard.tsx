'use client';

import { useState, useCallback, useMemo } from 'react';
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
  // Store state - use individual selectors to prevent unnecessary re-renders
  const tasks = useTaskStore(state => state.tasks);
  const loadingTasks = useTaskStore(state => state.loadingTasks);
  const tasksError = useTaskStore(state => state.tasksError);
  const updateTask = useTaskStore(state => state.updateTask);
  const loadTasks = useTaskStore(state => state.loadTasks);
  const pendingOperations = useTaskStore(state => state.pendingOperations);
  
  // Local state for drag operations ONLY (optimistic updates during drag)
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [dragOverStatus, setDragOverStatus] = useState<TaskStatus | null>(null);
  
  // Initialize file watcher (now with longer intervals)
  useInitializeFileWatcher();
  
  // Memoized task counts by status - only recalculates when tasks change
  const taskCounts = useMemo(() => ({
    todo: tasks.filter(task => task.status === 'todo').length,
    'in-progress': tasks.filter(task => task.status === 'in-progress').length,
    done: tasks.filter(task => task.status === 'done').length,
  }), [tasks]);

  // Get tasks by status - memoized to prevent recalculation
  const tasksByStatus = useMemo(() => {
    const byStatus: Record<TaskStatus, Task[]> = {
      todo: [],
      'in-progress': [],
      done: []
    };
    
    for (const task of tasks) {
      // Skip tasks being deleted
      if (pendingOperations.get(task.id) === 'delete') continue;
      
      // Apply optimistic status updates during drag
      if (dragOverStatus && activeTask?.id === task.id) {
        byStatus[dragOverStatus].push({ ...task, status: dragOverStatus });
      } else {
        byStatus[task.status].push(task);
      }
    }
    
    return byStatus;
  }, [tasks, pendingOperations, dragOverStatus, activeTask]);
  
  // Configure sensors for drag detection
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );
  
  // Handle drag start
  const handleDragStart = useCallback((event: DragStartEvent) => {
    const { active } = event;
    const taskId = active.id as string;
    const task = tasks.find(t => t.id === taskId);
    if (task) {
      setActiveTask(task);
    }
  }, [tasks]);
  
  // Handle drag over (for visual feedback during drag)
  const handleDragOver = useCallback((event: DragOverEvent) => {
    const { over } = event;
    if (!over) {
      setDragOverStatus(null);
      return;
    }
    
    const overId = over.id as string;
    
    // Check if dragging over a column
    const overColumn = COLUMNS.find(col => col.id === overId);
    if (overColumn) {
      setDragOverStatus(overColumn.id);
      return;
    }
    
    // Check if dragging over another task
    const targetTask = tasks.find(t => t.id === overId);
    if (targetTask) {
      setDragOverStatus(targetTask.status);
    }
  }, [tasks]);
  
  // Handle drag end (commit changes)
  const handleDragEnd = useCallback(async (event: DragEndEvent) => {
    const { active, over } = event;
    
    setActiveTask(null);
    setDragOverStatus(null);
    
    if (!over) return;
    
    const activeId = active.id as string;
    
    // Find the target status
    let targetStatus: TaskStatus | null = null;
    const overId = over.id as string;
    
    // Check if dropped on a column
    const targetColumn = COLUMNS.find(col => col.id === overId);
    if (targetColumn) {
      targetStatus = targetColumn.id;
    } else {
      // Check if dropped on another task
      const targetTask = tasks.find(t => t.id === overId);
      if (targetTask) {
        targetStatus = targetTask.status;
      }
    }
    
    if (!targetStatus) return;
    
    // Find the dragged task
    const draggedTask = tasks.find(t => t.id === activeId);
    if (!draggedTask) return;
    
    // Only update if status changed
    if (draggedTask.status !== targetStatus) {
      try {
        await updateTask(activeId, { status: targetStatus });
      } catch (error) {
        console.error('Failed to update task status:', error);
      }
    }
  }, [tasks, updateTask]);
  
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
  if (loadingTasks && tasks.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="flex flex-col items-center gap-4">
          <div className="flex gap-1">
            {[0, 1, 2].map(i => (
              <div
                key={i}
                className={cn(
                  'w-2 h-8 bg-muted',
                  'animate-pulse'
                )}
                style={{ animationDelay: `${i * 150}ms` }}
              />
            ))}
          </div>
          <span className="text-xs font-mono text-muted-foreground uppercase tracking-wider">
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
        <div className="flex flex-col items-center gap-4 max-w-md text-center p-6 border border-border bg-card">
          <div className="w-8 h-8 border border-foreground flex items-center justify-center">
            <span className="text-lg text-foreground">!</span>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground mb-1">
              Error Loading Tasks
            </h3>
            <p className="text-xs text-muted-foreground font-mono">
              {tasksError}
            </p>
          </div>
          <button
            onClick={() => loadTasks()}
            className={cn(
              'px-4 py-2 text-xs font-medium',
              'border border-foreground text-foreground',
              'hover:bg-foreground hover:text-background',
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
      <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-secondary/30">
        <div className="flex items-center gap-4">
          <h1 className="text-lg font-semibold text-foreground">
            Tasks
          </h1>
          <span className="text-xs font-mono text-muted-foreground">
            {tasks.length} total
          </span>
        </div>
        
        {/* Board actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => loadTasks()}
            className={cn(
              'px-3 py-1.5 text-xs font-medium',
              'border border-border text-muted-foreground',
              'hover:border-foreground hover:text-foreground',
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
                tasks={tasksByStatus[column.id]}
                isActive={dragOverStatus === column.id}
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
      <div className="flex items-center justify-between px-4 py-2 border-t border-border bg-secondary/20">
        <div className="flex items-center gap-4 text-xs font-mono text-muted-foreground">
          <span>TODO: {taskCounts.todo}</span>
          <span>IN PROGRESS: {taskCounts['in-progress']}</span>
          <span>DONE: {taskCounts.done}</span>
        </div>
        
        {loadingTasks && (
          <span className="text-xs font-mono text-muted-foreground">
            Syncing...
          </span>
        )}
      </div>
    </div>
  );
}
