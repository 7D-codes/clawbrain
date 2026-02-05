"use server";

import { existsSync, mkdirSync, writeFileSync, readdirSync } from "fs";
import { join } from "path";
import { homedir } from "os";
import { randomUUID } from "crypto";

const CLAWDBRAIN_DIR = join(homedir(), "clawdbrain");
const TASKS_DIR = join(CLAWDBRAIN_DIR, "tasks");
const PROJECTS_DIR = join(CLAWDBRAIN_DIR, "projects");
const SESSIONS_DIR = join(CLAWDBRAIN_DIR, "sessions");

export interface OnboardingResult {
  success: boolean;
  created: boolean;
  hasSampleTasks: boolean;
  error?: string;
}

/**
 * Check if Gateway is running by attempting to connect to WebSocket
 */
async function checkGatewayConnection(): Promise<boolean> {
  try {
    // Try to connect to Gateway WebSocket
    const ws = new WebSocket("ws://localhost:18789");
    
    return new Promise((resolve) => {
      ws.onopen = () => {
        ws.close();
        resolve(true);
      };
      ws.onerror = () => resolve(false);
      ws.onclose = () => resolve(false);
      
      // Timeout after 2 seconds
      setTimeout(() => {
        ws.close();
        resolve(false);
      }, 2000);
    });
  } catch {
    return false;
  }
}

/**
 * Create sample tasks for demo purposes
 */
function createSampleTasks(): void {
  const sampleTasks = [
    {
      id: randomUUID(),
      slug: "explore-clawbrain",
      title: "Explore ClawBrain",
      status: "in-progress",
      content: `# Explore ClawBrain

## Description
Get familiar with the ClawBrain interface and features.

## Acceptance Criteria
- [x] Open the dashboard
- [ ] Try dragging a task
- [ ] Send a message in chat
`,
    },
    {
      id: randomUUID(),
      slug: "create-first-task",
      title: "Create your first task",
      status: "todo",
      content: `# Create your first task

## Description
Use the chat to create a new task using natural language.

## Acceptance Criteria
- [ ] Open chat panel
- [ ] Type "create task: review documentation"
- [ ] See task appear in Kanban
`,
    },
    {
      id: randomUUID(),
      slug: "connect-gateway",
      title: "Connect to OpenClaw Gateway",
      status: "todo",
      content: `# Connect to OpenClaw Gateway

## Description
Ensure OpenClaw Gateway is running for full functionality.

## Acceptance Criteria
- [ ] Gateway running on port 18789
- [ ] Chat messages are sent/received
- [ ] Tasks sync in real-time
`,
    },
  ];

  for (const task of sampleTasks) {
    const taskPath = join(TASKS_DIR, `task-${task.id}.md`);
    const taskContent = `---
id: "${task.id}"
slug: "${task.slug}"
title: "${task.title}"
status: ${task.status}
project: clawbrain
created: "${new Date().toISOString()}"
updated: "${new Date().toISOString()}"
---

${task.content}`;

    writeFileSync(taskPath, taskContent, "utf-8");
  }
}

/**
 * Run onboarding process:
 * 1. Check if ~/clawdbrain/ exists
 * 2. Create directory structure if needed
 * 3. Check Gateway connectivity
 * 4. Create sample tasks for demo
 */
export async function runOnboarding(): Promise<OnboardingResult> {
  const result: OnboardingResult = {
    success: true,
    created: false,
    hasSampleTasks: false,
  };

  try {
    // Check if directory exists
    const dirExists = existsSync(CLAWDBRAIN_DIR);

    if (!dirExists) {
      // Create directory structure
      mkdirSync(CLAWDBRAIN_DIR, { recursive: true });
      mkdirSync(TASKS_DIR, { recursive: true });
      mkdirSync(PROJECTS_DIR, { recursive: true });
      mkdirSync(SESSIONS_DIR, { recursive: true });

      result.created = true;

      // Create sample tasks
      createSampleTasks();
      result.hasSampleTasks = true;
    } else {
      // Directory exists, check if it has sample tasks
      try {
        const tasksExist = existsSync(TASKS_DIR) && readdirSync(TASKS_DIR).length > 0;
        result.hasSampleTasks = tasksExist;
      } catch {
        result.hasSampleTasks = false;
      }
    }

    // Check Gateway connectivity (non-blocking)
    // We don't fail onboarding if Gateway isn't running
    const gatewayConnected = await checkGatewayConnection();
    console.log("Gateway connection:", gatewayConnected ? "connected" : "disconnected");

    return result;
  } catch (error) {
    console.error("Onboarding error:", error);
    return {
      success: false,
      created: false,
      hasSampleTasks: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Get onboarding status without running setup
 */
export async function getOnboardingStatus(): Promise<{
  directoryExists: boolean;
  tasksDirExists: boolean;
}> {
  return {
    directoryExists: existsSync(CLAWDBRAIN_DIR),
    tasksDirExists: existsSync(TASKS_DIR),
  };
}
