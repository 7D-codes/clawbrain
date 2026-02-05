"use client";

import { useState, useEffect } from "react";
import { Header } from "@/components/layout/Header";
import { Sidebar } from "@/components/layout/Sidebar";
import { OfflineIndicator } from "@/components/ui/OfflineIndicator";
import { ErrorBoundary } from "@/components/ui/ErrorBoundary";
import { Toaster } from "@/components/ui/Toaster";
import type { OnboardingResult } from "@/lib/onboarding";

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

interface ClientPageProps {
  onboardingResult: OnboardingResult;
}

export default function ClientPage({ onboardingResult }: ClientPageProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

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

  // Log onboarding result
  useEffect(() => {
    if (onboardingResult.created) {
      console.log("Onboarding: Created ~/clawdbrain/ directory");
    }
    if (onboardingResult.hasSampleTasks) {
      console.log("Onboarding: Sample tasks created/available");
    }
    if (onboardingResult.error) {
      console.error("Onboarding error:", onboardingResult.error);
    }
  }, [onboardingResult]);

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
