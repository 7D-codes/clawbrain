/**
 * Sidebar - Combined navigation and chat
 * 
 * Contains:
 * - Chat panel (primary)
 * - Quick navigation
 * - Settings (compact)
 */

'use client';

import { useState } from 'react';
import { 
  X, 
  Settings,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ChatWindow } from '@/components/chat/ChatWindow';
import { ThemeSelector } from '@/components/theme';
import { GatewaySettings } from '@/components/chat/GatewaySettings';
import { cn } from '@/lib/utils';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  isMobile: boolean;
}

const projects = [
  { id: 'clawbrain', name: 'clawbrain', taskCount: 12 },
  { id: 'demo', name: 'demo-project', taskCount: 3 },
];

export function Sidebar({ isOpen, onClose, isMobile }: SidebarProps) {
  const [selectedProject, setSelectedProject] = useState('clawbrain');
  const [showSettings, setShowSettings] = useState(false);

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
        id="sidebar"
        className={cn(
          isMobile 
            ? 'fixed left-0 top-12 z-50 h-[calc(100vh-3rem)] w-[90vw] max-w-[400px]' 
            : 'relative h-full w-[380px]',
          'flex-shrink-0 border-r border-border bg-background flex flex-col'
        )}
        role="complementary"
        aria-label="Chat and settings sidebar"
      >
        {/* Mobile close button */}
        {isMobile && (
          <div className="flex items-center justify-end border-b border-border p-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="h-7 w-7"
              aria-label="Close sidebar"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </Button>
          </div>
        )}

        {/* Chat - Primary content */}
        <div className="flex-1 overflow-hidden flex flex-col">
          <ChatWindow />
        </div>

        {/* Bottom section - Project selector + Settings */}
        <nav className="border-t border-border" aria-label="Settings and project navigation">
          {/* Project selector */}
          <div className="p-3 border-b border-border">
            <label 
              htmlFor="project-select"
              className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider mb-2 block"
            >
              Project
            </label>
            <select 
              id="project-select"
              value={selectedProject}
              onChange={(e) => setSelectedProject(e.target.value)}
              className="w-full bg-secondary border border-border px-2 py-1.5 text-sm font-mono focus:outline-none focus:ring-1 focus:ring-foreground"
              aria-label="Select project"
            >
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.taskCount})
                </option>
              ))}
            </select>
          </div>

          {/* Collapsible Settings */}
          <button
            onClick={() => setShowSettings(!showSettings)}
            className={cn(
              'flex w-full items-center justify-between px-3 py-2 text-sm font-mono',
              'hover:bg-secondary transition-colors',
              showSettings && 'bg-secondary'
            )}
            aria-expanded={showSettings}
            aria-controls="settings-panel"
          >
            <div className="flex items-center gap-2">
              <Settings className="h-4 w-4" aria-hidden="true" />
              <span>Settings</span>
            </div>
            {showSettings ? (
              <ChevronDown className="h-3 w-3" aria-hidden="true" />
            ) : (
              <ChevronRight className="h-3 w-3" aria-hidden="true" />
            )}
          </button>

          {showSettings && (
            <div 
              id="settings-panel"
              className="p-3 space-y-4 border-t border-border bg-secondary/30"
            >
              <ThemeSelector />
              <div className="pt-2 border-t border-border">
                <p className="text-[10px] font-mono text-muted-foreground uppercase mb-2">
                  Gateway
                </p>
                <GatewaySettings />
              </div>
            </div>
          )}
        </nav>
      </aside>
    </>
  );
}
