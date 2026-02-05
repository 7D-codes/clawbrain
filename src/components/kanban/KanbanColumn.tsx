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

// Column configuration for mono wireframe aesthetic
const columnConfig: Record<TaskStatus, { label: string; borderColor: string }> = {
  'todo': {
    label: 'To Do',
    borderColor: 'border-neutral-300',
  },
  'in-progress': {
    label: 'In Progress',
    borderColor: 'border-neutral-500',
  },
  'done': {
    label: 'Done',
    borderColor: 'border-neutral-900',
  },
};

// Status indicator for column header
const statusIndicator: Record<TaskStatus, string> = {
  'todo': 'bg-neutral-300',
  'in-progress': 'bg-neutral-500',
  'done': 'bg-neutral-900',
};

export function KanbanColumn({ id, title, tasks, onTaskClick }: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id,
    data: {
      type: 'Column',
      status: id,
    },
  });
  
  const config = columnConfig[id];
  const taskIds = tasks.map(t => t.id);
  
  return (
    <div 
      className={cn(
        // Column container - wireframe aesthetic
        'flex flex-col h-full min-w-[280px] max-w-[320px]',
        'border-r border-neutral-200 last:border-r-0',
        'bg-transparent',
      )}
    >
      {/* Column Header */}
      <div 
        className={cn(
          'flex items-center justify-between px-4 py-3',
          'border-b border-neutral-200',
          'bg-neutral-50/50'
        )}
      >
        <div className="flex items-center gap-2">
          {/* Status indicator square */}
          <div className={cn(
            'w-3 h-3',
            statusIndicator[id]
          )} />
          
          {/* Column title */}
          <h2 className="text-sm font-semibold text-neutral-900 uppercase tracking-wide">
            {title || config.label}
          </h2>
          
          {/* Task count */}
          <span className="text-xs font-mono text-neutral-400 ml-1">
            {tasks.length}
          </span>
        </div>
        
        {/* Add task button (wireframe style) */}
        <button 
          className={cn(
            'w-6 h-6 flex items-center justify-center',
            'border border-neutral-300 hover:border-neutral-500',
            'text-neutral-400 hover:text-neutral-700',
            'transition-colors duration-150',
            'rounded-none'
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
            'bg-neutral-100/50',
            'outline outline-1 outline-neutral-400 outline-offset-[-1px]',
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
              'py-8 px-4 border border-dashed border-neutral-300',
              'text-neutral-400'
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
