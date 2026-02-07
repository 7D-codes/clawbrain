"use client";

import { Menu, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface HeaderProps {
  onMenuClick: () => void;
  sidebarOpen: boolean;
}

export function Header({ onMenuClick, sidebarOpen }: HeaderProps) {
  return (
    <header 
      className="flex h-12 items-center justify-between border-b border-border bg-background px-4 flex-shrink-0"
      role="banner"
    >
      {/* Left section - just menu + logo */}
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={onMenuClick}
          className={cn(
            "h-8 w-8 transition-colors",
            sidebarOpen 
              ? "bg-secondary text-foreground" 
              : "text-muted-foreground hover:text-foreground hover:bg-secondary"
          )}
          aria-label={sidebarOpen ? "Close sidebar" : "Open sidebar"}
          aria-expanded={sidebarOpen}
          aria-controls="sidebar"
        >
          <Menu className="h-4 w-4" aria-hidden="true" />
        </Button>

        {/* Logo */}
        <div className="flex items-center gap-2">
          <div 
            className="flex h-6 w-6 items-center justify-center bg-foreground"
            aria-hidden="true"
          >
            <span className="text-background font-mono text-xs font-bold">C</span>
          </div>
          <span className="font-mono text-sm font-medium tracking-tight hidden sm:inline">
            CLAWBRAIN
          </span>
        </div>
      </div>

      {/* Right section - just new task button */}
      <div className="flex items-center">
        <Button
          variant="ghost"
          size="sm"
          className="h-8 gap-2 text-xs font-mono"
          aria-label="Create new task"
        >
          <Plus className="h-3.5 w-3.5" aria-hidden="true" />
          <span className="hidden sm:inline">New Task</span>
        </Button>
      </div>
    </header>
  );
}
