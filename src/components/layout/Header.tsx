"use client";

import { Menu, Plus, Settings, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";

interface HeaderProps {
  onMenuClick: () => void;
  sidebarOpen: boolean;
}

export function Header({ onMenuClick, sidebarOpen }: HeaderProps) {
  return (
    <header className="flex h-14 items-center justify-between border-b border-border bg-background px-4">
      {/* Left section */}
      <div className="flex items-center gap-4">
        {/* Menu toggle - hidden on large screens when sidebar is open */}
        <Button
          variant="ghost"
          size="icon"
          onClick={onMenuClick}
          className="h-8 w-8 border border-border hover:bg-secondary"
          aria-label={sidebarOpen ? "Close sidebar" : "Open sidebar"}
        >
          <Menu className="h-4 w-4" />
        </Button>

        {/* Logo */}
        <div className="flex items-center gap-2">
          <div className="flex h-6 w-6 items-center justify-center border border-border bg-primary">
            <span className="text-primary-foreground font-mono text-xs font-bold">C</span>
          </div>
          <span className="font-mono text-sm font-medium tracking-tight">CLAWBRAIN</span>
        </div>
      </div>

      {/* Center section - Current project selector */}
      <div className="hidden md:flex items-center">
        <Button 
          variant="ghost" 
          className="h-8 gap-2 border border-border font-mono text-sm hover:bg-secondary"
        >
          <span className="text-muted-foreground">PROJECT:</span>
          <span>clawbrain</span>
          <ChevronDown className="h-3 w-3 text-muted-foreground" />
        </Button>
      </div>

      {/* Right section */}
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 border border-border hover:bg-secondary"
          aria-label="New task"
        >
          <Plus className="h-4 w-4" />
        </Button>
        
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 border border-border hover:bg-secondary"
          aria-label="Settings"
        >
          <Settings className="h-4 w-4" />
        </Button>
      </div>
    </header>
  );
}
