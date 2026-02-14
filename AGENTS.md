# ClawBrain Development Team - Phase 2

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

## Phase 2 Overview

Phase 2 transforms ClawBrain from a task dashboard into a complete AI-native workspace:

- **Agent Control** — Assign tasks to agents, watch them work in real-time
- **Calendar** — Time-based task management with scheduling
- **Plugin Ecosystem** — Extend functionality through plugins
- **One-Click Deploy** — ClawDeploy integration
- **AI Repair Bot** — Self-healing infrastructure

See `docs/PHASE2.md` for full specifications.

---

## Team Assignments

### Agent A: Agent System (CB-016, CB-017)
**Skill:** None (mostly backend/API work)

Build the agent assignment and control system.

**Deliverables:**
1. `src/components/agents/AgentAssignmentMenu.tsx` — Right-click assign
2. `src/components/agents/AgentControlPanel.tsx` — Agent management UI
3. `src/lib/agents/agent-manager.ts` — Agent orchestration logic
4. `src/app/api/tasks/[id]/assign/route.ts` — Assignment API
5. Update task file format to include `assignedTo` and `agentType` fields

**Key Requirements:**
- Right-click on task card shows context menu
- Agent types: Research, Code, Writing, Analysis, Custom
- Visual indicator on cards showing assigned agent
- Agent config: model selection, temperature, system prompt

---

### Agent B: Log Streaming (CB-018)
**Skill:** None (WebSocket/SSE work)

Build real-time log streaming for agents.

**Deliverables:**
1. `src/components/agents/AgentLogPanel.tsx` — Collapsible log viewer
2. `src/lib/agents/log-streamer.ts` — SSE/WebSocket log streaming
3. `src/stores/log-store.ts` — Zustand store for logs
4. `src/app/api/agents/logs/route.ts` — Log streaming endpoint
5. `src/app/api/agents/spawn/route.ts` — Agent spawn API

**Key Requirements:**
- Real-time log updates via Server-Sent Events (SSE)
- Filter logs by agent ID and log level
- Auto-scroll to bottom with pause on scroll up
- Export logs to text file
- Mono font for logs (JetBrains Mono)

---

### Agent C: Calendar (CB-019, CB-020)
**Skill:** frontend-design (REQUIRED)

Build calendar view and due date features.

**Deliverables:**
1. `src/components/calendar/CalendarView.tsx` — Main calendar component
2. `src/components/calendar/TaskScheduler.tsx` — Drag-to-schedule
3. `src/components/calendar/DueDatePicker.tsx` — Due date input
4. `src/stores/calendar-store.ts` — Calendar state management
5. Update task schema to include `dueDate` field

**Key Requirements:**
- **MUST USE frontend-design skill**
- Month/week/day view toggle
- Drag task from Kanban to calendar date
- Overdue tasks highlighted in red
- Due dates shown on task cards
- FullCalendar library or custom implementation

---

### Agent D: Plugins (CB-021, CB-022)
**Skill:** frontend-design (REQUIRED)

Build plugin store and plugin system.

**Deliverables:**
1. `src/components/plugins/PluginStore.tsx` — Plugin discovery
2. `src/components/plugins/PluginCard.tsx` — Plugin display
3. `src/components/plugins/PluginSettings.tsx` — Plugin config
4. `src/lib/plugins/plugin-loader.ts` — Dynamic plugin loading
5. `src/lib/plugins/plugin-api.ts` — Plugin API surface
6. `src/app/api/plugins/route.ts` — Plugin management API

**Key Requirements:**
- **MUST USE frontend-design skill**
- Plugin manifest: name, version, description, entry point
- Sandboxed plugin execution
- UI extension points (sidebar, task menu, settings)
- Install/uninstall without restart

---

### Agent E: Deploy & Repair Bot (CB-023, CB-024, CB-025)
**Skill:** frontend-design (REQUIRED for UI parts)

Build ClawDeploy integration and AI repair bot.

**Deliverables:**
1. `src/components/deploy/DeployPanel.tsx` — Deployment UI
2. `src/components/deploy/DeployStatus.tsx` — Status monitoring
3. `src/components/repair/RepairBot.tsx` — Repair interface
4. `src/components/repair/HealthCheck.tsx` — System health
5. `src/lib/deploy/clawdeploy-client.ts` — ClawDeploy API client
6. `src/lib/repair/health-monitor.ts` — Health check system
7. `src/app/api/deploy/route.ts` — Deploy proxy API
8. `src/app/api/health/route.ts` — Health check API

**Key Requirements:**
- **MUST USE frontend-design skill** for UI components
- Deploy button with environment config
- Health checks: Gateway, skills, disk space, memory
- Repair suggestions with one-click fix
- Repair history stored in files

---

### Agent F: Navigation & Polish (CB-027, CB-026, CB-013, CB-014)
**Skill:** frontend-design (REQUIRED)

Build view switcher, AI enhancements, and finish deferred Phase 1 features.

**Deliverables:**
1. `src/components/layout/ViewSwitcher.tsx` — Navigation between views
2. `src/components/ai/TaskEnhancer.tsx` — AI task editing buttons
3. `src/components/views/ListView.tsx` — List view implementation
4. `src/components/kanban/VirtualKanban.tsx` — Virtual scrolling
5. Update `src/app/client-page.tsx` with view routing

**Key Requirements:**
- **MUST USE frontend-design skill**
- View switcher: Kanban | Calendar | List | Agents
- AI buttons on tasks: Expand, Summarize, Clarify
- List view: sortable columns, search, filters
- Virtual scrolling for 1000+ tasks

---

## Skill Locations

- `~/.openclaw/skills/` — System skills
- `~/Projects/.agents/skills/` — Project-specific skills
- `~/Projects/.claude/skills/` — Claude-specific skills

**For frontend work:** Always use `frontend-design` skill from `~/.openclaw/skills/`

---

## Workflow

1. Read your assigned stories in `docs/prd.json`
2. Read `docs/PHASE2.md` for context
3. **Update story status to "in_progress"**
4. Implement your components
5. **Commit frequently** with clear messages (`feat: agent assignment menu`, `fix: log streaming`)
6. **Update story status to "completed"**
7. Log what you did in `docs/progress.txt`

---

## Design Requirements (ALL AGENTS)

### Mono Wireframe Grid Aesthetic
- **Colors:** Pure black, white, grays only
- **Borders:** 1px solid, define all structure
- **Corners:** Sharp (0 radius)
- **Shadows:** NONE
- **Fonts:** Space Grotesk (UI), JetBrains Mono (data/code)
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

**New for Phase 2:**
```bash
# Calendar
bun add @fullcalendar/react @fullcalendar/core @fullcalendar/daygrid @fullcalendar/timegrid

# Icons (if needed)
bun add lucide-react
```

**Use bun to add more if needed.**
