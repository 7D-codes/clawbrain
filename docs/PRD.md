# ClawBrain - PRD

## Vision

An AI-native second brain interface powered by OpenClaw. Chat with your AI assistant, manage tasks in Kanban views, and maintain full context — all in one unified dashboard.

**The Core Idea:** When you host ClawBrain, you get a complete AI-powered workspace. Your OpenClaw instance lives inside this interface. Every task you create, every project you manage, your AI knows about it instantly. Ask "what's on my plate?" and it answers from your actual task data.

## Philosophy

**OpenClaw is the brain. ClawBrain is the body.**

The dashboard doesn't replace OpenClaw — it surfaces it. Files remain the source of truth, but the experience is unified: chat, tasks, and context in one place.

---

## Core Features (MVP)

### 1. Integrated Chat Panel (The Brain)
- Direct WebSocket connection to OpenClaw Gateway
- Persistent session — your AI remembers context
- Task-manager skill pre-loaded
- Ask about tasks: "what's due today?" → AI reads from files
- Full OpenClaw capabilities (browser, code execution, sub-agents)

### 2. Kanban Dashboard (The Body)
- Real-time task visualization from `~/clawdbrain/tasks/`
- Drag-and-drop between columns (dnd-kit)
- Views: Kanban, List
- Status changes sync back to files (OpenClaw sees updates)

### 3. Bidirectional Sync
- Chat creates task → appears in Kanban instantly
- Drag task in Kanban → OpenClaw knows on next interaction
- File-based source of truth with real-time UI updates

### 4. Self-Hosted, AI-Native
- One install = OpenClaw + Dashboard + Task system
- Your data, your files, your control
- No external services required (except AI provider keys)

---

## User Flow

```
1. User opens ClawBrain dashboard
2. Sees Kanban with existing tasks
3. Types in chat: "create task: research competitors"
4. OpenClaw creates task-{uuid}.md in ~/clawdbrain/tasks/
5. File watcher detects change → Kanban updates instantly
6. User drags task to "In Progress"
7. File updates → OpenClaw sees new status on next message
8. User asks: "what am I working on?"
9. OpenClaw reads files, responds with current tasks
```

---

## Technical Architecture

### Integration: Gateway WebSocket

**How the Dashboard connects to OpenClaw:**

```
┌─────────────────┐      WebSocket       ┌──────────────────┐
│   ClawBrain     │ ◄──────────────────► │  OpenClaw        │
│   Dashboard     │   ws://localhost:18789  │  Gateway         │
│   (Next.js)     │                      │  (session mgmt)  │
└─────────────────┘                      └──────────────────┘
         │                                         │
         │ File I/O (via API routes)               │ Skill calls
         ▼                                         ▼
┌─────────────────┐                      ┌──────────────────┐
│  ~/clawdbrain/  │ ◄──────────────────► │  OpenClaw Agent  │
│  tasks/*.md     │   (source of truth)     │  (reasoning)     │
└─────────────────┘                      └──────────────────┘
```

**Key Design Decisions:**
1. **Gateway WebSocket** for chat — sessions persist, auto-reconnect, built-in auth
2. **File watching** for sync — dashboard polls/watches files, not the Gateway
3. **Next.js API routes** for file operations — security sandbox, path validation
4. **Files as source of truth** — both sides read/write same format

### Data Model

```
~/clawdbrain/
├── tasks/
│   └── task-{uuid}.md
├── projects/
│   └── {project-slug}/
│       ├── README.md
│       └── tasks/
├── sessions/
│   └── chat-history.jsonl
└── config.yaml
```

### Task File Format

```markdown
---
id: task-uuid
slug: research-competitors
title: "Research competitors"
status: todo | in-progress | done
project: clawbrain
created: 2026-02-05T00:00:00Z
updated: 2026-02-05T00:00:00Z
---

# Research competitors

## Description
Analyze top 3 competitors in the AI workspace market.

## Acceptance Criteria
- [ ] Identify competitors
- [ ] Feature comparison matrix
- [ ] Pricing analysis
```

### Stack

- **Framework:** Next.js 14 (App Router), TypeScript
- **UI Foundation:** shadcn/ui + AI Elements (vercel/ai-elements)
- **Styling:** Tailwind CSS with CSS Variables mode
- **State:** Zustand
- **Drag & Drop:** dnd-kit
- **Gateway:** WebSocket connection to OpenClaw Gateway
- **File Watching:** chokidar with debouncing
- **Backend:** Next.js API routes (file operations with sandboxing)

### Design Direction

**Aesthetic:** Clean mono wireframe grid — architectural blueprint meets digital workspace.

- **Color Palette:** Pure monochrome. Black, white, grays only.
- **Grid System:** Visible 1px grid lines define structure
- **Typography:** Geometric sans (Space Grotesk) + monospace (JetBrains Mono)
- **Visual Language:** Wireframe minimalism. Borders, not shadows. Purposeful density.
- **Motion:** Mechanical precision. Linear movements, no bounce.

---

## User Stories

See `prd.json` for detailed stories with acceptance criteria and priorities.

---

## Out of Scope (Post-MVP)

- Calendar view
- Agent assignment UI with live logs
- Plugin store
- One-click deploy service (ClawDeploy integration)
- AI repair bot
- Generative AI record editing
- Multi-user collaboration
- Mobile app

---

## Success Criteria

1. User sends message in chat → OpenClaw responds with context
2. User creates task via chat → appears in Kanban within 1 second
3. User drags task to "Done" → OpenClaw knows status on next message
4. User asks "what are my pending tasks?" → AI responds accurately from files
5. Self-hostable with just Node.js + OpenClaw + AI provider keys

---

## Brand

- **Name:** ClawBrain
- **Tagline:** Your OpenClaw, visualized
- **Positioning:** AI-native workspace for power users
- **License:** MIT (open source)
