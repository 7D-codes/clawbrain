"use client";

import { useState, useEffect } from "react";
import { Header } from "@/components/layout/Header";
import { Sidebar } from "@/components/layout/Sidebar";
import { OfflineIndicator } from "@/components/ui/OfflineIndicator";
import { ErrorBoundary } from "@/components/ui/ErrorBoundary";
import { Toaster } from "@/components/ui/Toaster";
import { runOnboarding } from "@/lib/onboarding";

// Placeholder components until other agents complete their work
const KanbanBoard = () => (
  <div className="flex h-full items-center justify-center border border-dashed border-border p-8">
    <div className="text-center">
      <p className="text-muted-foreground font-mono text-sm">Kanban Board</p>
      <p className="text-muted-foreground mt-2 text-xs">Agent D implementation pending</p>
    </div>
  </div>
);

const ChatPanel = () => (
  <div className="flex h-full items-center justify-center border border-dashed border-border p-8">
    <div className="text-center">
      <p className="text-muted-foreground font-mono text-sm">Chat Panel</p>
      <p className="text-muted-foreground mt-2 text-xs">Agent C implementation pending</p>
    </div>
  </div>
);

export default function Home() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [onboardingComplete, setOnboardingComplete] = useState(false);

  // Handle responsive sidebar
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 1024;
      setIsMobile(mobile);
      if (mobile) {
        setSidebarOpen(false);
      } else {
        setSidebarOpen(true);
      }
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Run onboarding on first load
  useEffect(() => {
    const init = async () => {
      await runOnboarding();
      setOnboardingComplete(true);
    };
    init();
  }, []);

  return (
    <div className="flex h-screen flex-col bg-background">
      {/* Header */}
      <Header 
        onMenuClick={() => setSidebarOpen(!sidebarOpen)} 
        sidebarOpen={sidebarOpen}
      />

      {/* Main content area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <Sidebar 
          isOpen={sidebarOpen} 
          onClose={() => setSidebarOpen(false)}
          isMobile={isMobile}
        />

        {/* Three-column layout */}
        <main className="flex flex-1 overflow-hidden">
          {/* Kanban Area - flexible width */}
          <div className="flex flex-1 flex-col border-r border-border min-w-0">
            <ErrorBoundary 
              fallback={
                <div className="flex h-full items-center justify-center p-8">
                  <div className="text-center">
                    <p className="text-destructive font-mono text-sm">Kanban Error</p>
                    <p className="text-muted-foreground mt-2 text-xs">Something went wrong loading the board</p>
                  </div>
                </div>
              }
            >
              <KanbanBoard />
            </ErrorBoundary>
          </div>

          {/* Chat Panel - fixed 400px width */}
          <div className="w-[400px] flex-shrink-0 hidden lg:flex flex-col bg-background">
            <ErrorBoundary
              fallback={
                <div className="flex h-full items-center justify-center p-8">
                  <div className="text-center">
                    <p className="text-destructive font-mono text-sm">Chat Error</p>
                    <p className="text-muted-foreground mt-2 text-xs">Something went wrong loading chat</p>
                  </div>
                </div>
              }
            >
              <ChatPanel />
            </ErrorBoundary>
          </div>
        </main>
      </div>

      {/* Global UI elements */}
      <OfflineIndicator />
      <Toaster />
    </div>
  );
}
