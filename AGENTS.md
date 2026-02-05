# ClawBrain Development Team

## Package Manager

**ALWAYS USE BUN** — This project uses bun exclusively.

```bash
# Install dependencies
bun install

# Add new packages
bun add <package>

# Run dev server
bun run dev

# Build
bun run build
```

---

## Team Assignments

### Agent A: Task Manager Skill (CB-002)
**Skill:** None (OpenClaw skill development)

Build an OpenClaw skill that manages tasks as markdown files.

**Deliverables:**
- `skill/task-manager/SKILL.md`
- `skill/task-manager/index.js` (skill implementation)
- Install instructions for `~/.openclaw/skills/`

**Key Requirements:**
- Write to `~/clawdbrain/tasks/task-{uuid}.md`
- YAML frontmatter format (see ARCHITECTURE.md)
- Commands: `create task`, `list tasks`, `update task`, `delete task`

---

### Agent B: Backend API (CB-003, CB-008)
**Skill:** None (Next.js API routes)

Build secure file system API for task operations.

**Deliverables:**
- `src/app/api/tasks/route.ts` (GET, POST)
- `src/app/api/tasks/[id]/route.ts` (GET, PATCH, DELETE)
- `src/lib/file-store.ts` (atomic writes, sandboxing)

**Key Requirements:**
- Path traversal protection
- UUID-only task IDs
- Atomic file writes (temp → rename)
- Sandboxed to `~/clawdbrain/`

---

### Agent C: Frontend - Chat & WebSocket (CB-005, CB-006)
**Skill:** frontend-design (REQUIRED)

Build the chat interface with Gateway WebSocket integration.

**Deliverables:**
- `src/components/chat/ChatPanel.tsx`
- `src/components/chat/MessageList.tsx`
- `src/components/chat/MessageInput.tsx`
- `src/lib/websocket.ts` (Gateway WebSocket client)
- `src/stores/chat-store.ts` (Zustand)

**Key Requirements:**
- **MUST USE frontend-design skill** — Follow mono wireframe grid aesthetic
- WebSocket to `ws://localhost:18789`
- Session key: `clawbrain:main:main`
- Auto-reconnect logic
- Use AI Elements components with wireframe styling

---

### Agent D: Frontend - Kanban & File Sync (CB-004, CB-007)
**Skill:** frontend-design (REQUIRED)

Build the Kanban board with file watching.

**Deliverables:**
- `src/components/kanban/KanbanBoard.tsx`
- `src/components/kanban/KanbanColumn.tsx`
- `src/components/kanban/TaskCard.tsx`
- `src/lib/file-watcher.ts` (chokidar wrapper)
- `src/stores/task-store.ts` (Zustand)

**Key Requirements:**
- **MUST USE frontend-design skill** — Mono wireframe grid aesthetic
- dnd-kit for drag and drop
- Real-time updates from file watcher
- API integration for status updates

---

### Agent E: Layout & Integration (CB-009, CB-010, CB-011)
**Skill:** frontend-design (REQUIRED)

Main layout, onboarding, and error handling. Wires everything together.

**Deliverables:**
- `src/app/layout.tsx` (root layout)
- `src/app/page.tsx` (main page)
- `src/components/layout/Sidebar.tsx`
- `src/components/layout/Header.tsx`
- `src/lib/onboarding.ts` (first-run setup)
- `src/components/ui/ErrorBoundary.tsx`

**Key Requirements:**
- **MUST USE frontend-design skill**
- 3-column layout: sidebar | kanban | chat
- Responsive (collapsible sidebar)
- Onboarding: create `~/clawdbrain/` structure
- Error boundaries around Kanban and Chat

---

## Skill Locations

If you need to read skill files:
- `~/.openclaw/skills/` — System skills
- `~/Projects/.agents/skills/` — Project-specific skills
- `~/Projects/.claude/skills/` — Claude-specific skills
- `~/Projects/skills/` — Other project skills

**For frontend work:** Always use `frontend-design` skill from `~/.openclaw/skills/`

---

## Workflow

1. Read your assigned stories in `docs/prd.json`
2. Read `docs/ARCHITECTURE.md` for technical specs
3. Read `docs/DESIGN.md` for design system details
4. **Update story status to "in_progress"**
5. Implement your components
6. **Commit frequently** with clear messages
7. **Update story status to "completed"**
8. Log what you did in `docs/progress.txt`

---

## Design Requirements (ALL AGENTS)

### Mono Wireframe Grid Aesthetic
- **Colors:** Pure black, white, grays only
- **Borders:** 1px solid, define all structure
- **Corners:** Sharp (0 radius)
- **Shadows:** NONE
- **Fonts:** Space Grotesk (UI), JetBrains Mono (data)
- **Grid:** 8px base unit, visible grid lines

See `docs/DESIGN.md` for complete system.

---

## Dependencies Already Installed

- next, react, react-dom
- typescript, tailwindcss
- shadcn/ui components
- AI Elements (conversation, message)
- zustand, chokidar, js-yaml
- @dnd-kit/core, @dnd-kit/sortable

**Use bun to add more if needed.**
