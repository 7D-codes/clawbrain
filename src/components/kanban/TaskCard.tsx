'use client';

import { memo } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Task, TaskStatus } from '@/stores/task-store';
import { cn } from '@/lib/utils';

interface TaskCardProps {
  task: Task;
  onClick?: (task: Task) => void;
}

// Status indicator colors - using semantic colors for dark mode support
const statusStyles: Record<TaskStatus, string> = {
  'todo': 'bg-muted-foreground/40',
  'in-progress': 'bg-muted-foreground/70',
  'done': 'bg-foreground',
};

// Memoized component to prevent unnecessary re-renders
export const TaskCard = memo(function TaskCard({ task, onClick }: TaskCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ 
    id: task.id,
    data: {
      type: 'Task',
      task,
    },
  });
  
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };
  
  // Format date for display
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  };
  
  // Truncate description to 2 lines
  const truncateDescription = (desc?: string) => {
    if (!desc) return null;
    const maxLength = 80;
    return desc.length > maxLength ? desc.slice(0, maxLength) + '...' : desc;
  };
  
  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={() => onClick?.(task)}
      className={cn(
        // Base styles - wireframe box
        'group relative bg-card border border-border',
        'p-4 cursor-grab active:cursor-grabbing',
        'transition-all duration-150 ease-out',
        'hover:border-border-strong hover:bg-accent',
        
        // Dragging state
        isDragging && [
          'scale-[1.02] z-50',
          'border-foreground shadow-none',
          'bg-card',
        ]
      )}
    >
      {/* Status indicator bar - top */}
      <div 
        className={cn(
          'absolute top-0 left-0 right-0 h-[2px]',
          statusStyles[task.status]
        )} 
      />
      
      {/* Card content */}
      <div className="flex flex-col gap-2">
        {/* Header with status dot and title */}
        <div className="flex items-start gap-2">
          {/* Status dot */}
          <div className={cn(
            'w-2 h-2 mt-1.5 flex-shrink-0',
            statusStyles[task.status]
          )} />
          
          {/* Title */}
          <h3 className="text-sm font-medium text-foreground leading-tight flex-1">
            {task.title}
          </h3>
        </div>
        
        {/* Description */}
        {task.description && (
          <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed ml-4">
            {truncateDescription(task.description)}
          </p>
        )}
        
        {/* Footer - metadata */}
        <div className="flex items-center justify-between mt-1 pt-2 border-t border-border">
          {/* Project tag */}
          <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider">
            {task.project}
          </span>
          
          {/* Date */}
          <span className="text-[10px] font-mono text-muted-foreground">
            {formatDate(task.updated)}
          </span>
        </div>
      </div>
      
      {/* Drag handle indicator (visible on hover) */}
      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <svg 
          width="12" 
          height="12" 
          viewBox="0 0 12 12" 
          fill="none"
          className="text-muted-foreground"
        >
          <circle cx="2" cy="2" r="1" fill="currentColor" />
          <circle cx="6" cy="2" r="1" fill="currentColor" />
          <circle cx="10" cy="2" r="1" fill="currentColor" />
          <circle cx="2" cy="6" r="1" fill="currentColor" />
          <circle cx="6" cy="6" r="1" fill="currentColor" />
          <circle cx="10" cy="6" r="1" fill="currentColor" />
          <circle cx="2" cy="10" r="1" fill="currentColor" />
          <circle cx="6" cy="10" r="1" fill="currentColor" />
          <circle cx="10" cy="10" r="1" fill="currentColor" />
        </svg>
      </div>
    </div>
  );
});
