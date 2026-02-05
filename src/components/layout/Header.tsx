"use client";

import { Menu, Plus, MessageSquare, PanelLeft, PanelRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface HeaderProps {
  onMenuClick: () => void;
  sidebarOpen: boolean;
  onChatClick: () => void;
  chatOpen: boolean;
}

export function Header({ onMenuClick, sidebarOpen, onChatClick, chatOpen }: HeaderProps) {
  return (
    <header className="flex h-14 items-center justify-between border-b border-border bg-background px-4 flex-shrink-0">
      {/* Left section */}
      <div className="flex items-center gap-3">
        {/* Menu toggle */}
        <Button
          variant="ghost"
          size="icon"
          onClick={onMenuClick}
          className={cn(
            "h-8 w-8 border hover:bg-secondary transition-colors",
            sidebarOpen ? "border-border bg-secondary" : "border-border"
          )}
          aria-label={sidebarOpen ? "Close sidebar" : "Open sidebar"}
        >
          <Menu className="h-4 w-4" />
        </Button>

        {/* Chat toggle - visible when chat is closed */}
        {!chatOpen && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onChatClick}
            className="h-8 w-8 border border-border hover:bg-secondary transition-colors"
            aria-label="Open chat"
          >
            <PanelRight className="h-4 w-4" />
          </Button>
        )}

        {/* Logo */}
        <div className="flex items-center gap-2 ml-1">
          <div className="flex h-6 w-6 items-center justify-center border border-border bg-foreground">
            <span className="text-background font-mono text-xs font-bold">C</span>
          </div>
          <span className="font-mono text-sm font-medium tracking-tight hidden sm:inline">CLAWBRAIN</span>
        </div>
      </div>

      {/* Center section - View indicators */}
      <div className="hidden md:flex items-center gap-4">
        <div className="flex items-center gap-2 text-xs font-mono text-muted-foreground">
          <span className={cn(
            "transition-opacity",
            sidebarOpen ? "opacity-100" : "opacity-40"
          )}>
            SIDEBAR
          </span>
          <span className="text-border">|</span>
          <span className={cn(
            "transition-opacity",
            chatOpen ? "opacity-100" : "opacity-40"
          )}>
            CHAT
          </span>
        </div>
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
      </div>
    </header>
  );
}
