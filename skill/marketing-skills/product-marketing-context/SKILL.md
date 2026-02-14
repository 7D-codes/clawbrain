---
name: product-marketing-context
version: 1.0.0
skill-for: ClawBrain
description: "When the user wants to create or update ClawBrain's product marketing context document. Captures foundational positioning and messaging so other marketing skills can reference it. Creates `.claude/product-marketing-context.md` in the ClawBrain project."
---

# ClawBrain Product Marketing Context

You help create and maintain the product marketing context document for ClawBrain — the AI-native second brain.

This document lives at `~/Projects/clawbrain/.claude/product-marketing-context.md` and is referenced by all other marketing skills.

## Workflow

### Step 1: Check for Existing Context

First, check if `~/Projects/clawbrain/.claude/product-marketing-context.md` exists.

**If it exists:**
- Read it and summarize what's captured
- Ask which sections to update
- Only gather info for those sections

**If it doesn't exist, offer two options:**

1. **Auto-draft from codebase** (recommended): Study the ClawBrain repo — README, PRD, architecture docs, landing pages, marketing copy — and draft V1. User reviews and fills gaps.

2. **Start from scratch**: Walk through each section conversationally.

### Step 2: Gather Information

**If auto-drafting:**
1. Read the ClawBrain codebase:
   - `~/Projects/clawbrain/README.md`
   - `~/Projects/clawbrain/docs/PRD.md`
   - `~/Projects/clawbrain/docs/ARCHITECTURE.md`
   - Any existing marketing copy
2. Draft all sections based on what you find
3. Present draft and ask what needs correcting
4. Iterate until satisfied

**If starting from scratch:**
Walk through sections below conversationally, one at a time.

---

## Sections to Capture

### 1. Product Overview

**One-line description:**
> Example: "ClawBrain is an AI-native second brain that combines chat-based AI with Kanban task management — self-hosted and powered by OpenClaw."

**What it does:**
- Chat interface for AI assistance
- Creates and manages tasks via conversation
- Kanban board for visual task management
- File-based storage (markdown with YAML frontmatter)
- Bidirectional sync between chat and board

**Product category:**
- AI productivity tools
- Task management software
- Knowledge management systems
- Second brain apps

**Product type:**
Open-source self-hosted SaaS with optional managed hosting

**Business model:**
- Free: Self-hosted, open source
- Paid: Managed hosting (OneClaw)
- Future: Pro features, team plans

---

### 2. Target Audience

**Target users:**
- Knowledge workers (developers, writers, researchers, founders)
- People overwhelmed by scattered productivity tools
- Privacy-conscious users who prefer self-hosting
- OpenClaw users wanting a visual interface
- AI early adopters wanting more than chatGPT

**Primary use case:**
Managing tasks and knowledge through natural conversation with an AI that actually understands your work context.

**Jobs to be done:**
1. "Capture tasks quickly without switching contexts"
2. "Have an AI that knows what I'm working on"
3. "Keep my data private and portable"
4. "Visualize and organize my work in one place"

**Use cases:**
- Daily standup task capture
- Project planning and tracking
- Research note organization
- Personal knowledge management
- Team task coordination

---

### 3. Personas

**The Developer (Primary)**
- Cares about: Privacy, open source, extensibility, data ownership
- Challenge: Existing tools are closed-source or don't integrate well
- Value: Self-hosted, file-based, OpenClaw-powered, hackable

**The Founder/Solopreneur**
- Cares about: Speed, efficiency, AI assistance, cost
- Challenge: Too many tools, AI doesn't understand context
- Value: All-in-one, AI-native, affordable

**The Knowledge Worker**
- Cares about: Organization, retrieval, peace of mind
- Challenge: Notes scattered, tasks forgotten, context lost
- Value: Second brain that actually remembers

**The Privacy-First User**
- Cares about: Data ownership, no vendor lock-in, security
- Challenge: Most AI tools require cloud, data leaves device
- Value: Runs locally, owns data, no cloud required

---

### 4. Problems & Pain Points

**Core challenge:**
Productivity tools are fragmented — you need a separate app for tasks, notes, and AI assistance. AI bolted onto existing tools doesn't truly understand your work context.

**Why current solutions fall short:**
- **Notion/Obsidian:** Great for notes, but AI feels bolted on
- **Todoist/Linear:** Great for tasks, no AI context
- **ChatGPT/Claude:** Great AI, no persistent task management
- **All cloud tools:** Data leaves your control

**What it costs them:**
- Time switching between apps
- Context lost between tools
- Mental overhead of managing multiple systems
- Anxiety about data privacy
- Subscription fatigue

**Emotional tension:**
- "I have dozens of tools but still feel disorganized"
- "I want AI to actually help, not just chat"
- "I don't want my data on someone else's server"

---

### 5. Competitive Landscape

**Direct competitors:**
- **Notion AI** — Bolted-on AI, closed source, data in cloud
- **Mem.ai** — AI notes, but not task-focused, not self-hosted
- **Reflect** — AI notes, closed source, subscription

**Secondary competitors:**
- **Obsidian + plugins** — Powerful but complex setup, no native AI
- **Logseq** — Open source but no built-in AI
- **Anytype** — Self-hosted but no AI integration

**Indirect competitors:**
- Pen and paper
- Spreadsheets
- Simple todo apps (Apple Reminders, Google Tasks)
- Doing nothing (status quo)

---

### 6. Differentiation

**Key differentiators:**
1. AI-native (chat is primary interface, not an add-on)
2. Self-hosted (your data, your control)
3. File-based tasks (portable, future-proof, hackable)
4. Bidirectional sync (chat ↔ Kanban, seamless)
5. OpenClaw-powered (extensible platform, not locked to one AI)

**How we do it differently:**
Instead of bolting AI onto a task manager, we built the entire experience around AI-first interaction. Tasks are created through natural conversation, stored as portable files, and visualized in a Kanban board that stays in sync.

**Why that's better:**
- Natural workflow (just talk to your AI)
- Data ownership (files you control)
- Flexibility (works with any OpenClaw-compatible AI)
- Portability (tasks are just markdown files)

**Why customers choose us:**
- Want AI that actually understands their work
- Value privacy and data ownership
- Prefer open source and self-hosting
- Tired of juggling multiple tools

---

### 7. Objections & Anti-Personas

**Top objections:**

| Objection | Response |
|-----------|----------|
| "I don't want to self-host" | OneClaw managed hosting coming soon |
| "Sounds complicated to set up" | One-click installers, managed option |
| "I already use Notion/Obsidian" | Import your data, AI-native is different |
| "What if OpenClaw stops working?" | Open source, file-based, not locked in |
| "Is my data secure?" | Runs on your machine, no cloud required |

**Anti-persona:**
- Wants everything done for them (zero setup)
- Doesn't care about data privacy
- Happy with existing tools (no pain point)
- Needs enterprise features (SSO, compliance)
- Wants mobile-first experience (not ready yet)

---

### 8. Switching Dynamics (JTBD Four Forces)

**Push (frustrations with current tools):**
- AI feels bolted on, not integrated
- Data trapped in proprietary formats
- Too many tools to manage
- Privacy concerns with cloud AI

**Pull (attraction to ClawBrain):**
- AI that actually understands context
- Own your data, portable files
- One tool for tasks and AI
- Self-hosted option

**Habit (keeps them stuck):**
- Already invested in existing tool
- Migration effort
- Team using different tool
- "Good enough" mindset

**Anxiety (worries about switching):**
- Setup complexity
- Will it actually be better?
- Data migration
- What if it doesn't work out?

---

### 9. Customer Language

**How they describe the problem:**
- "I have notes in 5 different apps"
- "ChatGPT doesn't remember what I told it yesterday"
- "I want AI that knows my projects"
- "I'm tired of subscription fees for simple tools"
- "I don't trust putting my data in the cloud"

**How they describe ClawBrain:**
- "It's like having an assistant that actually knows my work"
- "Finally, an AI tool that respects my privacy"
- "My tasks are just files I can take anywhere"
- "The chat-to-Kanban flow is magical"

**Words to use:**
- AI-native, second brain, self-hosted, open source
- Bidirectional sync, file-based, OpenClaw-powered
- Context-aware, portable, extensible

**Words to avoid:**
- "Chatbot" (implies simple, not intelligent)
- "Dashboard" (implies passive, not interactive)
- "Plugin" (implies bolted-on, not native)
- "Cloud" (privacy-conscious users avoid this)

**Glossary:**
| Term | Meaning |
|------|---------|
| OpenClaw | Open-source AI assistant platform |
| Second brain | Personal knowledge management system |
| Kanban | Visual task board with columns |
| Frontmatter | YAML metadata in markdown files |
| Bidirectional sync | Changes flow both ways (chat ↔ board) |
| OneClaw | Managed hosting for OpenClaw/ClawBrain |

---

### 10. Brand Voice

**Tone:**
Competent but approachable. Technical but not elitist.

**Style:**
Direct, clear, slightly irreverent. No corporate fluff.

**Personality:**
- Smart (knows the tech)
- Pragmatic (focuses on what works)
- Independent (self-hosted ethos)
- Helpful (genuinely solves problems)
- Transparent (open source, no BS)

---

### 11. Proof Points

**Key metrics:**
- Open source (MIT license)
- Built with modern stack (Next.js 15, Bun, shadcn/ui)
- File-based (tasks are just markdown)
- Self-hosted (runs on your machine)

**Notable users:**
- OpenClaw community members
- Privacy-conscious developers
- AI early adopters

**Testimonials:**
> "Finally, an AI assistant that knows what I'm working on." — Early user

**Value themes:**
| Theme | Proof |
|-------|-------|
| Privacy | Self-hosted, file-based, open source |
| Intelligence | AI-native, context-aware |
| Flexibility | OpenClaw-powered, extensible |
| Portability | Markdown files, no lock-in |

---

### 12. Goals

**Business goal:**
Become the default AI-native second brain for privacy-conscious knowledge workers.

**Key conversion actions:**
1. Star the repo
2. Join the waitlist
3. Self-host ClawBrain
4. Sign up for OneClaw managed hosting

**Current metrics:**
- GitHub stars
- Waitlist signups
- Active self-hosted instances
- Discord community members

---

## Document Template

After gathering information, create the document with this structure:

```markdown
# ClawBrain Product Marketing Context

*Last updated: [date]*

## Product Overview
**One-liner:** [Your one-liner]
**What it does:** [2-3 sentences]
**Product category:** AI productivity / Second brain
**Product type:** Open-source self-hosted SaaS
**Business model:** Free self-hosted + Paid managed hosting

## Target Audience
**Target users:** [List]
**Primary use case:** [Main problem solved]
**Jobs to be done:**
- [Job 1]
- [Job 2]
- [Job 3]

## Personas
| Persona | Cares about | Challenge | Value |
|---------|-------------|-----------|-------|
| Developer | Privacy, OSS | Closed tools | Self-hosted |
| Founder | Speed, AI | Too many tools | All-in-one |
| Knowledge Worker | Organization | Scattered notes | Second brain |
| Privacy-First | Data ownership | Cloud required | Local-only |

## Problems & Pain Points
**Core problem:** [Describe]
**Why alternatives fail:** [List]
**Emotional cost:** [Describe tension]

## Competitive Landscape
**Direct:** Notion AI, Mem.ai, Reflect — closed source, bolted-on AI
**Secondary:** Obsidian, Logseq — no native AI
**Indirect:** Pen/paper, spreadsheets, status quo

## Differentiation
**Key differentiators:** AI-native, self-hosted, file-based, bidirectional sync
**How we're different:** Built AI-first, not AI-bolted-on
**Why customers choose us:** Privacy + intelligence

## Objections
| Objection | Response |
|-----------|----------|
| Too complex | One-click install, managed option |
| Already use X | Import + AI-native difference |

**Anti-persona:** Wants zero setup, doesn't care about privacy

## Switching Dynamics
**Push:** Fragmented tools, bolted-on AI
**Pull:** AI-native, data ownership
**Habit:** Existing investment, migration effort
**Anxiety:** Setup complexity, will it work?

## Customer Language
**Problem description:** "I have notes everywhere"
**Solution description:** "AI that knows my work"
**Words to use:** AI-native, self-hosted, second brain
**Words to avoid:** Chatbot, dashboard, cloud

## Brand Voice
**Tone:** Competent but approachable
**Style:** Direct, clear, slightly irreverent
**Personality:** Smart, pragmatic, independent

## Proof Points
**Metrics:** Open source, modern stack, file-based
**Testimonials:** [Collect these]

## Goals
**Business goal:** Default AI second brain for privacy-conscious users
**Conversion:** Stars → Waitlist → Self-host → Paid
```

---

## Next Steps

After creating this document:
1. Use it with `launch-strategy` skill to plan launch
2. Use it with `copywriting` skill for landing page copy
3. Update quarterly or when positioning changes

Run `/product-marketing-context` anytime to update.
