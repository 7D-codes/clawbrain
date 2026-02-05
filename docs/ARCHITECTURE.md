# ClawBrain Architecture

## Overview

ClawBrain connects to OpenClaw Gateway via WebSocket to provide a unified chat + task management interface. Files are the source of truth, enabling seamless bidirectional sync.

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     ClawBrain Dashboard                     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐  │
│  │   Sidebar    │  │    Kanban    │  │   Chat Panel     │  │
│  │  (Projects)  │  │   (Tasks)    │  │  (OpenClaw WS)   │  │
│  └──────────────┘  └──────────────┘  └──────────────────┘  │
└─────────────────────────────────────────────────────────────┘
           │                    │                    │
           │                    │                    │
           ▼                    ▼                    │
    ┌──────────────┐    ┌──────────────┐            │
    │   Zustand    │◄──►│  File Watch  │            │
    │    Store     │    │   (chokidar) │            │
    └──────────────┘    └──────────────┘            │
           │                    │                    │
           │                    │                    │
           ▼                    ▼                    ▼
    ┌──────────────────────────────────────────────────────┐
    │              Next.js API Routes                      │
    │  ┌─────────┐  ┌─────────┐  ┌─────────┐              │
    │  │/api/    │  │/api/    │  │/api/    │              │
    │  │  tasks  │  │  files  │  │  config │              │
    │  └─────────┘  └─────────┘  └─────────┘              │
    └──────────────────────────────────────────────────────┘
           │
           │ File I/O (sandboxed to ~/clawdbrain/)
           ▼
    ┌──────────────────────────────────────────────────────┐
    │                   ~/clawdbrain/                      │
    │  ┌──────────┐  ┌──────────┐  ┌──────────┐           │
    │  │  tasks/  │  │ projects/│  │sessions/ │           │
    │  │ *.md     │  │    /     │  │*.jsonl   │           │
    │  └──────────┘  └──────────┘  └──────────┘           │
    └──────────────────────────────────────────────────────┘
           ▲                                            │
           │                                            │
           │         WebSocket (ws://localhost:18789)   │
           │                                            ▼
           │         ┌──────────────────────────┐
           └─────────┤    OpenClaw Gateway      │
                     │  (session management)    │
                     └──────────────────────────┘
                                  │
                                  │ Skill calls
                                  ▼
                     ┌──────────────────────────┐
                     │    OpenClaw Agent        │
                     │  (reasoning + tools)     │
                     └──────────────────────────┘
```

## Data Flow

### 1. Chat Creates Task

```
User types in Chat Panel
    ↓
Dashboard → WebSocket → OpenClaw Gateway
    ↓
OpenClaw processes message, calls task-manager skill
    ↓
Skill writes task-{uuid}.md to ~/clawdbrain/tasks/
    ↓
File watcher detects change
    ↓
Zustand store updates
    ↓
Kanban re-renders with new task
```

### 2. Kanban Updates Task

```
User drags card to "Done"
    ↓
Kanban calls PATCH /api/tasks/{id}
    ↓
API updates task file (status: done)
    ↓
File watcher detects change (debounced)
    ↓
Zustand store updates
    ↓
Kanban shows updated status
    ↓
User asks in chat "what did I finish?"
    ↓
OpenClaw reads files, responds with completed tasks
```

## Gateway WebSocket Protocol

### Connection

```javascript
const ws = new WebSocket('ws://localhost:18789');

// Auth message on connect
ws.send(JSON.stringify({
  type: 'auth',
  params: {
    auth: {
      password: 'gateway-password-from-config'
    }
  }
}));
```

### Session Management

```javascript
// Join or create session
ws.send(JSON.stringify({
  type: 'join',
  sessionKey: 'clawbrain:main:main',
  label: 'main'
}));

// Send message
ws.send(JSON.stringify({
  type: 'message',
  text: 'create task: research competitors',
  replyToCurrent: true
}));

// Receive streaming response
ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  // data.type: 'chunk' | 'done' | 'error'
  // data.content: message text
};
```

## File Format

### Task File (`~/clawdbrain/tasks/task-{uuid}.md`)

```markdown
---
id: "550e8400-e29b-41d4-a716-446655440000"
slug: research-competitors
title: "Research competitors"
status: todo | in-progress | done
project: clawbrain
created: "2026-02-05T12:00:00Z"
updated: "2026-02-05T12:00:00Z"
---

# Research competitors

## Description
Analyze top 3 competitors in the AI workspace market.

## Acceptance Criteria
- [ ] Identify competitors
- [ ] Feature comparison matrix
- [ ] Pricing analysis
```

### Schema (Zod)

```typescript
const TaskSchema = z.object({
  id: z.string().uuid(),
  slug: z.string(),
  title: z.string(),
  status: z.enum(['todo', 'in-progress', 'done']),
  project: z.string(),
  created: z.string().datetime(),
  updated: z.string().datetime(),
  content: z.string() // markdown body
});
```

## Security

### Path Sandboxing

All file operations are sandboxed to `~/clawdbrain/`:

```typescript
const SANDBOX_ROOT = path.resolve(os.homedir(), 'clawdbrain');

function sanitizePath(inputPath: string): string {
  const safePath = path.normalize(inputPath).replace(/^(\.\.[\/\\])+/, '');
  const fullPath = path.join(SANDBOX_ROOT, safePath);
  
  if (!fullPath.startsWith(SANDBOX_ROOT)) {
    throw new Error('Path traversal detected');
  }
  
  return fullPath;
}
```

### Input Validation

- Task IDs must be valid UUIDs
- No path characters (`/`, `\`, `..`) in IDs
- Content sanitized for XSS prevention
- Rate limiting on file operations

## State Management

### Zustand Store Structure

```typescript
interface AppState {
  // Tasks
  tasks: Task[];
  loadingTasks: boolean;
  
  // Chat
  messages: Message[];
  wsConnected: boolean;
  sendingMessage: boolean;
  
  // UI
  selectedProject: string;
  view: 'kanban' | 'list';
  
  // Actions
  loadTasks: () => Promise<void>;
  updateTask: (id: string, updates: Partial<Task>) => Promise<void>;
  sendMessage: (text: string) => Promise<void>;
  connectWebSocket: () => void;
}
```

## File Watching

```typescript
import chokidar from 'chokidar';

const watcher = chokidar.watch('~/clawdbrain/tasks/*.md', {
  ignoreInitial: true,
  awaitWriteFinish: {
    stabilityThreshold: 300,
    pollInterval: 100
  }
});

watcher.on('change', debounce(() => {
  // Reload tasks from disk
  useStore.getState().loadTasks();
}, 300));
```

## Error Handling

### WebSocket Errors

- Auto-reconnect with exponential backoff
- Show offline indicator after 3 failed attempts
- Queue messages while offline, send on reconnect

### File Operation Errors

- Atomic writes (temp file + rename)
- Conflict detection via timestamp
- Last-write-wins for MVP

### API Errors

- 400: Bad request (invalid input)
- 403: Path traversal attempt
- 404: Task not found
- 500: Internal server error

## Performance Considerations

### MVP (Demo)

- Load all tasks on mount (< 100 expected)
- No pagination needed
- Simple re-renders acceptable

### Scale (Post-MVP)

- Virtual scrolling for > 100 tasks
- Pagination: 50 tasks per page
- Debounced file watcher: 300ms
- Memoized selectors for task filtering

## Deployment

### Requirements

- Node.js 18+
- OpenClaw Gateway running
- AI provider API key (Kimi, OpenAI, etc.)

### Environment Variables

```bash
# .env.local
OPENCLAW_GATEWAY_URL=ws://localhost:18789
OPENCLAW_GATEWAY_PASSWORD=your-gateway-password
NEXT_PUBLIC_APP_URL=http://localhost:3000
```
