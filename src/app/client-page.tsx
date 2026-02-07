"use client";

import { useState, useEffect, useCallback } from "react";
import { Header } from "@/components/layout/Header";
import { Sidebar } from "@/components/layout/Sidebar";
import { OfflineIndicator } from "@/components/ui/OfflineIndicator";
import { ErrorBoundary } from "@/components/ui/ErrorBoundary";
import type { OnboardingResult } from "@/lib/onboarding";

// Real components from agents C & D
import { KanbanBoard } from "@/components/kanban";

interface ClientPageProps {
  onboardingResult: OnboardingResult;
}

export default function ClientPage({ onboardingResult }: ClientPageProps) {
  // Layout state - simplified: just sidebar and main content
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Handle responsive behavior
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      // Close sidebar on mobile by default
      if (mobile) {
        setSidebarOpen(false);
      }
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Log onboarding result once
  useEffect(() => {
    if (onboardingResult.created) {
      console.log("Onboarding: Created ~/clawdbrain/ directory");
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const toggleSidebar = useCallback(() => {
    setSidebarOpen(prev => !prev);
  }, []);

  return (
    <div className="flex h-screen flex-col bg-background overflow-hidden">
      {/* Clean Header */}
      <Header 
        onMenuClick={toggleSidebar}
        sidebarOpen={sidebarOpen}
      />

      {/* Main content area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar - Navigation + Chat combined */}
        <Sidebar 
          isOpen={sidebarOpen} 
          onClose={() => setSidebarOpen(false)}
          isMobile={isMobile}
        />

        {/* Mobile overlay */}
        {isMobile && sidebarOpen && (
          <div 
            className="fixed inset-0 bg-black/50 z-40"
            onClick={() => setSidebarOpen(false)}
            aria-hidden="true"
          />
        )}

        {/* Main content - Kanban Board */}
        <main 
          className="flex-1 overflow-hidden bg-background"
          role="main"
          aria-label="Task board"
        >
          <ErrorBoundary 
            fallback={
              <div className="flex h-full items-center justify-center p-8">
                <div className="text-center">
                  <p className="text-destructive font-mono text-sm">Board Error</p>
                  <p className="text-muted-foreground mt-2 text-xs">Something went wrong</p>
                </div>
              </div>
            }
          >
            <KanbanBoard />
          </ErrorBoundary>
        </main>
      </div>

      {/* Global UI elements */}
      <OfflineIndicator />
    </div>
  );
}
