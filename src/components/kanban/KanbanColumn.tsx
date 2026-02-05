'use client';

import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Task, TaskStatus } from '@/stores/task-store';
import { TaskCard } from './TaskCard';
import { cn } from '@/lib/utils';

interface KanbanColumnProps {
  id: TaskStatus;
  title: string;
  tasks: Task[];
  onTaskClick?: (task: Task) => void;
}

// Status indicator for column header - using semantic colors
const statusIndicator: Record<TaskStatus, string> = {
  'todo': 'bg-muted-foreground/30',
  'in-progress': 'bg-muted-foreground/60',
  'done': 'bg-foreground',
};

export function KanbanColumn({ id, title, tasks, onTaskClick }: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id,
    data: {
      type: 'Column',
      status: id,
    },
  });
  
  const taskIds = tasks.map(t => t.id);
  
  return (
    <div 
      className={cn(
        // Column container - wireframe aesthetic
        'flex flex-col h-full min-w-[280px] max-w-[320px]',
        'border-r border-border last:border-r-0',
        'bg-transparent',
      )}
    >
      {/* Column Header */}
      <div 
        className={cn(
          'flex items-center justify-between px-4 py-3',
          'border-b border-border',
          'bg-secondary/30'
        )}
      >
        <div className="flex items-center gap-2">
          {/* Status indicator square */}
          <div className={cn(
            'w-3 h-3',
            statusIndicator[id]
          )} />
          
          {/* Column title */}
          <h2 className="text-sm font-semibold text-foreground uppercase tracking-wide">
            {title}
          </h2>
          
          {/* Task count */}
          <span className="text-xs font-mono text-muted-foreground ml-1">
            {tasks.length}
          </span>
        </div>
        
        {/* Add task button (wireframe style) */}
        <button 
          className={cn(
            'w-6 h-6 flex items-center justify-center',
            'border border-border hover:border-foreground',
            'text-muted-foreground hover:text-foreground',
            'transition-colors duration-150'
          )}
          aria-label="Add task"
        >
          <svg 
            width="12" 
            height="12" 
            viewBox="0 0 12 12" 
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
          >
            <path d="M6 2V10M2 6H10" />
          </svg>
        </button>
      </div>
      
      {/* Column Content - Droppable area */}
      <div
        ref={setNodeRef}
        className={cn(
          // Content area
          'flex-1 p-3 overflow-y-auto',
          'flex flex-col gap-3',
          
          // Drop target styling
          isOver && [
            'bg-accent/50',
            'outline outline-1 outline-border-strong outline-offset-[-1px]',
          ]
        )}
      >
        <SortableContext 
          items={taskIds}
          strategy={verticalListSortingStrategy}
        >
          {tasks.map(task => (
            <TaskCard 
              key={task.id} 
              task={task} 
              onClick={onTaskClick}
            />
          ))}
        </SortableContext>
        
        {/* Empty state */}
        {tasks.length === 0 && (
          <div 
            className={cn(
              'flex flex-col items-center justify-center',
              'py-8 px-4 border border-dashed border-border',
              'text-muted-foreground'
            )}
          >
            <span className="text-xs font-mono uppercase tracking-wider">
              No tasks
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
