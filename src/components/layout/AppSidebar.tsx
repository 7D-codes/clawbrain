/**
 * AppSidebar - Main application sidebar
 * 
 * Contains:
 * - Navigation (Kanban, Chat toggle)
 * - Settings (Gateway configuration)
 * - Theme controls (Dark mode toggle)
 * - Project selector
 */

'use client';

import { useState } from 'react';
import { 
  X, 
  FolderKanban, 
  LayoutGrid, 
  MessageSquare, 
  HelpCircle, 
  Settings,
  ChevronDown,
  ChevronRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ThemeSelector } from '@/components/theme';
import { GatewaySettings } from '@/components/chat/GatewaySettings';
import { cn } from '@/lib/utils';

interface AppSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  isMobile: boolean;
  chatOpen: boolean;
  onToggleChat: () => void;
}

interface NavItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  action?: () => void;
  active?: boolean;
}

const projects = [
  { id: 'clawbrain', name: 'clawbrain', taskCount: 12 },
  { id: 'demo', name: 'demo-project', taskCount: 3 },
];

export function AppSidebar({ 
  isOpen, 
  onClose, 
  isMobile, 
  chatOpen, 
  onToggleChat 
}: AppSidebarProps) {
  const [selectedProject, setSelectedProject] = useState('clawbrain');
  const [showSettings, setShowSettings] = useState(false);

  const navItems: NavItem[] = [
    { 
      id: 'kanban', 
      label: 'Board', 
      icon: <LayoutGrid className="h-4 w-4" />, 
      active: true 
    },
    { 
      id: 'chat', 
      label: chatOpen ? 'Hide Chat' : 'Show Chat', 
      icon: <MessageSquare className="h-4 w-4" />,
      action: onToggleChat,
      active: chatOpen
    },
  ];

  // Don't render if closed
  if (!isOpen) {
    return null;
  }

  return (
    <>
      {/* Mobile overlay */}
      {isMobile && (
        <div 
          className="fixed inset-0 z-40 bg-black/50"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside 
        className={cn(
          isMobile ? 'fixed left-0 top-14 z-50 h-[calc(100vh-3.5rem)]' : 'relative h-full',
          'w-[260px] flex-shrink-0 border-r border-border bg-sidebar flex flex-col'
        )}
      >
        {/* Mobile close button */}
        {isMobile && (
          <div className="flex items-center justify-end border-b border-border p-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="h-7 w-7 border border-border hover:bg-sidebar-accent"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        )}

        {/* Navigation */}
        <nav className="border-b border-border p-2">
          <ul className="space-y-1">
            {navItems.map((item) => (
              <li key={item.id}>
                <button
                  onClick={item.action}
                  className={cn(
                    'flex w-full items-center gap-3 px-3 py-2 text-sm font-mono',
                    'border border-transparent transition-colors',
                    item.active 
                      ? 'bg-sidebar-accent border-border text-sidebar-accent-foreground' 
                      : 'text-sidebar-foreground hover:bg-sidebar-accent hover:border-border'
                  )}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </button>
              </li>
            ))}
          </ul>
        </nav>

        {/* Projects section */}
        <div className="flex-1 overflow-auto p-2">
          <div className="mb-2 flex items-center justify-between px-3">
            <span className="font-mono text-xs text-muted-foreground uppercase tracking-wider">
              Projects
            </span>
            <FolderKanban className="h-3 w-3 text-muted-foreground" />
          </div>
          
          <ul className="space-y-1">
            {projects.map((project) => (
              <li key={project.id}>
                <button
                  onClick={() => setSelectedProject(project.id)}
                  className={cn(
                    'flex w-full items-center justify-between px-3 py-2 text-sm font-mono',
                    'border border-transparent transition-colors',
                    selectedProject === project.id
                      ? 'bg-sidebar-accent border-border text-sidebar-accent-foreground' 
                      : 'text-sidebar-foreground hover:bg-sidebar-accent hover:border-border'
                  )}
                >
                  <span className="truncate">{project.name}</span>
                  <span className="font-mono text-xs text-muted-foreground">
                    {project.taskCount}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </div>

        {/* Settings Section */}
        <div className="border-t border-border">
          {/* Settings Toggle */}
          <button
            onClick={() => setShowSettings(!showSettings)}
            className={cn(
              'flex w-full items-center justify-between px-3 py-2 text-sm font-mono',
              'border-b border-border',
              showSettings 
                ? 'bg-sidebar-accent text-sidebar-accent-foreground' 
                : 'text-sidebar-foreground hover:bg-sidebar-accent'
            )}
          >
            <div className="flex items-center gap-3">
              <Settings className="h-4 w-4" />
              <span>Settings</span>
            </div>
            {showSettings ? (
              <ChevronDown className="h-3 w-3" />
            ) : (
              <ChevronRight className="h-3 w-3" />
            )}
          </button>

          {/* Expandable Settings Panel */}
          {showSettings && (
            <div className="p-3 space-y-4 border-b border-border bg-background/50">
              {/* Theme Selector */}
              <ThemeSelector />

              {/* Gateway Settings */}
              <div className="space-y-2">
                <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider">
                  Gateway
                </span>
                <GatewaySettings 
                  onSave={() => {
                    // Reload page to apply new settings
                    window.location.reload();
                  }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-border p-2">
          <button
            className="flex w-full items-center gap-3 px-3 py-2 text-sm font-mono text-sidebar-foreground hover:bg-sidebar-accent border border-transparent hover:border-border transition-colors"
          >
            <HelpCircle className="h-4 w-4" />
            <span>Help & Support</span>
          </button>
        </div>
      </aside>
    </>
  );
}
