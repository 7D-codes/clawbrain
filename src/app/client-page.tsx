"use client";

import { useState, useEffect } from "react";
import { Header } from "@/components/layout/Header";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { ChatWindow } from "@/components/chat";
import { OfflineIndicator } from "@/components/ui/OfflineIndicator";
import { ErrorBoundary } from "@/components/ui/ErrorBoundary";
import { Toaster } from "@/components/ui/Toaster";
import type { OnboardingResult } from "@/lib/onboarding";

// Real components from agents C & D
import { KanbanBoard } from "@/components/kanban";

interface ClientPageProps {
  onboardingResult: OnboardingResult;
}

export default function ClientPage({ onboardingResult }: ClientPageProps) {
  // Layout state
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [chatOpen, setChatOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  // Handle responsive behavior
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 1024;
      const smallScreen = window.innerWidth < 1280;
      setIsMobile(mobile);
      
      // Auto-close panels on smaller screens
      if (mobile) {
        setSidebarOpen(false);
        setChatOpen(false);
      } else if (smallScreen) {
        // On medium screens, keep one panel open
        setChatOpen(false);
        setSidebarOpen(true);
      } else {
        // Large screens - both open
        setSidebarOpen(true);
        setChatOpen(true);
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
    <div className="flex h-screen flex-col bg-background overflow-hidden">
      {/* Header */}
      <Header 
        onMenuClick={() => setSidebarOpen(!sidebarOpen)} 
        sidebarOpen={sidebarOpen}
        onChatClick={() => setChatOpen(!chatOpen)}
        chatOpen={chatOpen}
      />

      {/* Main content area */}
      <div className="flex flex-1 overflow-hidden">
        {/* App Sidebar - Navigation, Settings, Theme */}
        <AppSidebar 
          isOpen={sidebarOpen} 
          onClose={() => setSidebarOpen(false)}
          isMobile={isMobile}
          chatOpen={chatOpen}
          onToggleChat={() => setChatOpen(!chatOpen)}
        />

        {/* Content area with Chat Window + Kanban */}
        <main className="flex flex-1 overflow-hidden">
          {/* Chat Window - Collapsible panel on the left */}
          {chatOpen && (
            <div className="flex-shrink-0 h-full">
              <ErrorBoundary
                fallback={
                  <div className="flex h-full w-[300px] items-center justify-center p-8 border-r border-border bg-background">
                    <div className="text-center">
                      <p className="text-destructive font-mono text-sm">Chat Error</p>
                      <p className="text-muted-foreground mt-2 text-xs">Something went wrong loading chat</p>
                    </div>
                  </div>
                }
              >
                <ChatWindow 
                  isOpen={chatOpen} 
                  onToggle={() => setChatOpen(!chatOpen)}
                />
              </ErrorBoundary>
            </div>
          )}

          {/* Mobile: Chat overlay */}
          {!chatOpen && !isMobile && (
            <div className="flex-shrink-0 h-full">
              <ChatWindow 
                isOpen={false} 
                onToggle={() => setChatOpen(true)}
              />
            </div>
          )}

          {/* Mobile Chat Overlay */}
          {isMobile && chatOpen && (
            <div className="fixed inset-0 z-40 flex">
              <div 
                className="flex-1 bg-black/50"
                onClick={() => setChatOpen(false)}
              />
              <div className="w-[90vw] max-w-[400px] h-full bg-background shadow-xl">
                <ChatWindow 
                  isOpen={true} 
                  onToggle={() => setChatOpen(false)}
                />
              </div>
            </div>
          )}

          {/* Kanban Board - Main content */}
          <div className="flex flex-1 flex-col min-w-0 bg-background">
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
        </main>
      </div>

      {/* Global UI elements */}
      <OfflineIndicator />
      <Toaster />
    </div>
  );
}
