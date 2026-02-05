# ClawBrain Phase 2 - Advanced Features

## Overview

Phase 2 transforms ClawBrain from a task dashboard into a complete AI-native workspace. This phase focuses on: agent management, calendar integration, plugin ecosystem, and enterprise-ready features.

## Goals

1. **Agent Control Center** - Manage, assign, and monitor sub-agents with full transparency
2. **Calendar Integration** - Time-based task management with scheduling
3. **Plugin Ecosystem** - Extend functionality through plugins
4. **One-Click Deploy** - ClawDeploy integration for easy self-hosting
5. **AI Repair Bot** - Self-healing infrastructure

## Features

### 1. Agent Assignment & Control (CB-016 to CB-018)

**Problem:** Users can chat with OpenClaw but can't delegate tasks to specialized agents with visibility into their work.

**Solution:**
- Assign tasks to specific agents from the Kanban board
- Right-click task → "Assign to Agent" → Select agent type
- Real-time log streaming in a panel
- Agent configuration UI (model selection, prompts)

**User Flow:**
```
1. User drags task to "In Progress"
2. Right-clicks → "Assign to Research Agent"
3. Agent spawns, starts working
4. User sees live logs updating
5. Agent completes, task moves to "Done"
```

### 2. Calendar View (CB-019, CB-020)

**Problem:** Tasks have no time dimension - can't schedule or see deadlines.

**Solution:**
- Calendar view alongside Kanban
- Drag tasks to dates to schedule
- Due date reminders
- Integration with external calendars (optional)

### 3. Plugin Store (CB-021, CB-022)

**Problem:** Every user has different needs - can't build everything.

**Solution:**
- Plugin discovery and installation UI
- Plugin API for third-party extensions
- Core plugins: GitHub integration, Notion sync, Slack notifications

### 4. One-Click Deploy (CB-023, CB-024)

**Problem:** Self-hosting requires technical setup.

**Solution:**
- ClawDeploy integration
- "Deploy" button in settings
- Automatic server provisioning
- Environment variable management

### 5. AI Repair Bot (CB-025)

**Problem:** When OpenClaw breaks, users are stuck.

**Solution:**
- High-level AI (Claude Code-style) monitors the system
- Auto-detects issues (Gateway down, skill errors, etc.)
- One-click repair with explanation
- Preventive maintenance suggestions

### 6. Generative AI Features (CB-026, CB-027)

**Problem:** Editing task descriptions manually is tedious.

**Solution:**
- AI-enhanced task editing (expand, summarize, clarify)
- Task generation from vague descriptions
- Project proposal generation

## Technical Architecture Changes

### New Components

```
src/
├── components/
│   ├── agents/              # NEW: Agent management
│   │   ├── AgentPanel.tsx
│   │   ├── AgentLogStream.tsx
│   │   └── AgentAssignmentMenu.tsx
│   ├── calendar/            # NEW: Calendar view
│   │   ├── CalendarView.tsx
│   │   └── TaskScheduler.tsx
│   └── plugins/             # NEW: Plugin system
│       ├── PluginStore.tsx
│       └── PluginSettings.tsx
├── lib/
│   ├── agents/              # NEW: Agent orchestration
│   │   ├── agent-manager.ts
│   │   └── log-streamer.ts
│   └── plugins/             # NEW: Plugin API
│       ├── plugin-loader.ts
│       └── plugin-api.ts
```

### API Extensions

```typescript
// New endpoints
POST   /api/agents/spawn      // Spawn sub-agent
GET    /api/agents/logs/:id   // Stream agent logs
POST   /api/tasks/:id/assign  // Assign task to agent
GET    /api/plugins           // List installed plugins
POST   /api/plugins/install   // Install plugin
```

## Design System Updates

- **Agent Status Indicators:** Animated pulse for active agents
- **Log Panel:** Monospace streaming text, collapsible
- **Calendar:** Month/week/day views, drag-to-schedule
- **Plugin Cards:** Install/uninstall buttons, ratings

## Dependencies to Add

```bash
# Calendar
bun add @fullcalendar/react @fullcalendar/core @fullcalendar/daygrid

# Agent streaming
bun add eventsource-parser

# Plugin system (optional - can be custom)
bun add esm-hook  # For dynamic imports
```

## Success Criteria

1. User can assign task to agent and watch it work in real-time
2. Calendar view shows tasks scheduled by date
3. Plugin can be installed without code changes
4. Deploy to production in < 5 minutes via ClawDeploy
5. AI Repair Bot fixes common issues automatically

## Out of Scope (Phase 3)

- Multi-user collaboration
- Mobile app
- Desktop app (Electron)
- Advanced permissions/roles
- Billing/subscription management
