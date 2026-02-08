# ClawBrain - PRD

## Vision

An AI-native workspace for **compound engineers** — individuals who leverage AI agents as teammates to ship faster and think bigger.

**Phase 1:** Personal AI workspace (Chat + Kanban)  
**Phase 2:** Multi-agent missions (War Room) — coordinate teams of specialized agents working in parallel  
**Phase 3:** Full agency mode — autonomous agent teams with client handoffs

**The Core Idea:** ClawBrain is the **OS for AI-assisted work**. One interface for you, your AI assistant, and eventually your entire AI team. When you need more firepower, spawn specialists. When you need focus, work solo. All visible, all coordinated, all in one place.

## Philosophy

**OpenClaw is the brain. ClawBrain is the body. You are the conductor.**

The dashboard doesn't replace OpenClaw — it surfaces and orchestrates it. Files remain the source of truth, but the experience scales from personal productivity to team-level missions.

---

## Core Features

### Phase 1: Personal Workspace (Complete)

#### 1. Integrated Chat Panel (The Brain)
- Direct WebSocket connection to OpenClaw Gateway
- **Zero-config setup** — auto-discovers local OpenClaw, one-time password entry
- Persistent session — your AI remembers context
- Task-manager skill pre-loaded
- Ask about tasks: "what's due today?" → AI reads from files

#### 2. Kanban Dashboard (The Body)
- Real-time task visualization from `~/clawdbrain/tasks/`
- Drag-and-drop between columns (dnd-kit)
- Status changes sync back to files
- Clean, minimal mono-wireframe aesthetic

#### 3. Bidirectional Sync
- Chat creates task → appears in Kanban instantly
- Drag task in Kanban → OpenClaw knows on next interaction
- File-based source of truth

---

### Phase 2: War Room (In Design)

**The Multi-Agent Mission Control**

A dedicated space for coordinating teams of specialized AI agents working in parallel on complex missions.

#### Core Concept: "The Situation Room"
Hybrid of Mission Control's clarity, Trading Floor's energy, and Orchestra's coordination.

> "Command without chaos, visibility without noise"

#### Key Features

**1. Agent Spawning**
- From chat: `/spawn scout research competitors`
- Visual confirmation: Agent card appears in grid
- Auto-configured with role, task, and identity

**2. Live Agent Grid**
- Cards show: Avatar, name, status, progress, current action
- 8 built-in agent types: Scout, Architect, Coder, Writer, Analyst, Designer, Guardian, Coordinator
- Auto-grouping when >6 agents
- Status states: Spawning → Working → Waiting → Complete → Kill

**3. Activity River**
- Real-time feed of agent communications
- Visibility modes: Quiet / Normal / Verbose
- Agent-to-agent handoffs with visual animations
- Cost tracking per agent

**4. Focus Mode**
- Click any agent → Full-screen view
- Live output stream
- Direct chat with that agent
- Progress history and artifacts

**5. The Intern Pattern**
```
User: /spawn scout "research competitors"
     ✨ Scout-7 spawning...
     [Works in background]
     📊 "Found 3 competitors, analysis attached"
     State: Complete
User: /kill scout-7
     💀 Scout-7 archived to mission log
```

**6. Mission Templates**
Pre-configured agent teams:
- **Competitor Analysis:** Scout + Analyst + Writer
- **Feature Design:** Architect + Designer + Coder
- **Bug Hunt:** Coder + Guardian + Scout
- **Launch Prep:** Full coordinated team

#### UI Layout

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ ⚡ WAR ROOM: "Competitor Analysis Mission"                      [Exit ↗]  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌──────────── AGENT GRID ───────────────────────────────────────────────┐ │
│  │ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐                   │ │
│  │ │ 🕵️ Scout │ │ 🎨 Design│ │ 💻 Coder │ │ 📊 Analyst│  [+ Spawn New]  │ │
│  │ │ [Working]│ │ [Waiting]│ │ [Complete│ │ [Working]│                   │ │
│  │ │ ████████░│ │ ⏸ Paused │ │ ✅ Done  │ │ ██████░░░│                   │ │
│  │ └──────────┘ └──────────┘ └──────────┘ └──────────┘                   │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
│                                                                             │
│  ┌───────────────────── ACTIVITY RIVER ──────────────────────────────────┐ │
│  │ 09:41:23  🕵️ Scout → 📊 Analyst: "Found pricing data, sending..."      │ │
│  │ 09:41:20  💻 Coder: "PR #247 ready for review"                        │ │
│  │ 09:41:15  🎨 Designer → You: "Need hero copy for this section"        │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
│                                                                             │
│  [Command Bar]: /spawn [role] [task] | @agent | /pause all | /focus [agent] │
└─────────────────────────────────────────────────────────────────────────────┘
```

#### Entry Points
| Trigger | Action |
|---------|--------|
| `/warroom` | Opens empty War Room |
| `/spawn [agent]` | Opens War Room + spawns agent |
| "Create a team to..." | Natural language mission start |
| Mission template | One-click pre-configured team |

---

### Phase 3: Agency Mode (Future)

**Autonomous Agent Teams with Client Handoffs**

- Persistent agent teams with memory across missions
- Client portal for reviewing deliverables
- Automatic reporting and status updates
- Multi-client workspace isolation

---

## Technical Architecture

### Integration: Gateway WebSocket

```
┌─────────────────┐      WebSocket       ┌──────────────────┐
│   ClawBrain     │ ◄──────────────────► │  OpenClaw        │
│   Dashboard     │   ws://localhost:18789  │  Gateway         │
│   (Next.js)     │                      │  (session mgmt)  │
└─────────────────┘                      └──────────────────┘
         │                                         │
         │ File I/O (via API routes)               │ Agent spawning
         ▼                                         ▼
┌─────────────────┐                      ┌──────────────────┐
│  ~/clawdbrain/  │ ◄──────────────────► │  OpenClaw Agent  │
│  tasks/*.md     │   (source of truth)     │  (reasoning)     │
└─────────────────┘                      └──────────────────┘
```

### Multi-Agent Coordination

```
War Room Mode:
┌─────────────┐
│   You       │ (Conductor)
└──────┬──────┘
       │ Spawns
       ▼
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  Coordinator│────▶│   Scout     │────▶│  Analyst    │
│   (Hero)    │     │  (research) │     │  (analyze)  │
└─────────────┘     └─────────────┘     └─────────────┘
       │                                      │
       │◄─────────────────────────────────────┘
       │         Reports back
       ▼
┌─────────────┐
│   Output    │
└─────────────┘
```

### Data Model

```
~/clawdbrain/
├── tasks/           # Personal tasks
├── missions/        # War Room missions
│   └── {mission-id}/
│       ├── mission.yaml
│       ├── agents/
│       │   └── {agent-id}.yaml
│       └── outputs/
├── projects/
├── sessions/
└── agents/          # Agent identity templates
    ├── scout.yaml
    ├── coder.yaml
    └── ...
```

### Stack

- **Framework:** Next.js 16 (App Router), TypeScript
- **UI:** shadcn/ui + Tailwind CSS
- **State:** Zustand
- **Drag & Drop:** dnd-kit
- **Gateway:** WebSocket v3 protocol
- **Multi-Agent:** sessions_spawn for sub-agents

---

## Design Direction

**Aesthetic:** Clean mono wireframe grid — architectural blueprint meets command center.

- **Personal Mode:** Minimal, focused, calm
- **War Room Mode:** Energetic, visible, powerful
- **Transitions:** Smooth 400ms animations between modes

---

## User Flows

### Personal Mode Flow
```
1. Open ClawBrain → Auto-detects OpenClaw
2. Enter password once → Connected forever
3. Chat: "create task: research competitors"
4. Task appears in Kanban
5. Drag to "In Progress" when ready
```

### War Room Flow
```
1. Chat: "/spawn scout research competitors"
2. War Room opens with Scout card
3. Scout finds data → Hands off to Analyst
4. Analyst processes → Writer compiles
5. You review final output
6. /kill all → Mission archived
```

---

## User Stories

See `prd.json` for detailed stories.

### War Room Stories (New)

| ID | Story | Priority |
|----|-------|----------|
| WR-001 | As a user, I want to spawn a specialized agent from chat so I can delegate parallel work | P0 |
| WR-002 | As a user, I want to see all active agents in a grid so I can monitor their progress | P0 |
| WR-003 | As a user, I want to click an agent to focus on it so I can see detailed output | P0 |
| WR-004 | As a user, I want to see agent-to-agent handoffs so I understand coordination | P1 |
| WR-005 | As a user, I want mission templates so I can spawn pre-configured teams quickly | P1 |
| WR-006 | As a user, I want to kill agents when done so I can control costs | P0 |

---

## Success Criteria

### Phase 1 (Complete)
- ✅ Zero-config OpenClaw connection
- ✅ Chat creates tasks → Kanban updates
- ✅ Drag tasks → Status syncs

### Phase 2 (War Room)
- Spawn agent in <5 seconds
- Track 5+ agents without overwhelm
- Redirect any agent in <3 seconds
- Complex missions feel faster than solo work

### Phase 3 (Agency)
- Persistent teams remember your preferences
- Client handoff workflow
- Autonomous reporting

---

## Brand

- **Name:** ClawBrain
- **Tagline:** Your AI team, visualized
- **Positioning:** The OS for compound engineering
- **License:** MIT

---

*Last Updated: 2026-02-09*  
*Status: Phase 1 Complete, Phase 2 In Design*
