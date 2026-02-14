# ClawBrain Product Marketing Context

*Last updated: 2026-02-11*

## Product Overview

**One-liner:**  
ClawBrain is an AI-native second brain that combines chat-based AI with Kanban task management — self-hosted, file-based, and powered by OpenClaw.

**What it does:**  
ClawBrain lets you chat with your AI assistant to create and manage tasks. Tasks appear instantly in a Kanban board, stored as portable markdown files. Everything stays in sync bidirectionally — chat creates tasks, board updates reflect in chat context.

**Product category:**  
AI Productivity / Second Brain / Knowledge Management

**Product type:**  
Open-source self-hosted application with optional managed hosting (OneClaw)

**Business model:**  
- Free: Self-hosted, full features, open source (MIT)
- Paid: OneClaw managed hosting ($29-49/month tiers)
- Future: Team plans, enterprise features

---

## Target Audience

**Target users:**
- Developers who want AI that understands their projects
- Founders/solopreneurs overwhelmed by scattered tools
- Knowledge workers (writers, researchers, consultants)
- Privacy-conscious users who prefer self-hosting
- AI early adopters frustrated by cloud-only solutions

**Primary use case:**
Managing tasks and knowledge through natural conversation with an AI that actually remembers your work context.

**Jobs to be done:**
1. "Capture tasks quickly without switching contexts"
2. "Have an AI that knows what I'm working on"
3. "Keep my data private and portable"
4. "Visualize and organize my work in one place"
5. "Stop paying for 5 different productivity subscriptions"

**Specific use cases:**
- Daily standup task capture ("What did I do yesterday?")
- Project planning and milestone tracking
- Research note organization
- Personal knowledge management
- Team task coordination
- Meeting follow-up automation

---

## Personas

| Persona | Cares about | Challenge | Value we promise |
|---------|-------------|-----------|------------------|
| **The Developer** | Privacy, open source, extensibility, data ownership | Existing tools are closed-source or don't integrate well | Self-hosted, file-based, OpenClaw-powered, fully hackable |
| **The Founder** | Speed, efficiency, AI assistance, cost | Too many tools, AI doesn't understand context | All-in-one, AI-native, affordable, scales with business |
| **The Knowledge Worker** | Organization, retrieval, peace of mind | Notes scattered, tasks forgotten, context lost | Second brain that actually remembers and connects ideas |
| **The Privacy-First User** | Data ownership, no vendor lock-in, security | Most AI tools require cloud, data leaves device | Runs locally, owns data, no cloud required, auditable code |

---

## Problems & Pain Points

**Core challenge:**
Productivity tools are fragmented — you need separate apps for tasks, notes, and AI assistance. AI bolted onto existing tools doesn't truly understand your work context. You're constantly switching contexts and losing information between tools.

**Why current solutions fall short:**
- **Notion/Obsidian:** Great for notes, but AI feels bolted on, expensive at scale
- **Todoist/Linear:** Great for tasks, no AI context or knowledge management
- **ChatGPT/Claude:** Great AI, no persistent task management or knowledge storage
- **Mem.ai/Reflect:** Closed source, data in cloud, subscription lock-in
- **All cloud tools:** Data leaves your control, privacy concerns, recurring costs

**What it costs them:**
- Time switching between apps (context switching tax)
- Context lost between tools ("where did I put that?")
- Mental overhead of managing multiple systems
- Anxiety about data privacy and vendor lock-in
- Subscription fatigue ($50-100/month for productivity stack)

**Emotional tension:**
- "I have dozens of tools but still feel disorganized"
- "I want AI to actually help, not just chat"
- "I don't want my data on someone else's server"
- "I'm tired of paying for tools that don't talk to each other"
- "I spend more time organizing than doing"

---

## Competitive Landscape

**Direct competitors:** Same solution, same problem
- **Notion AI** — Bolted-on AI, closed source, data in cloud, expensive at scale
- **Mem.ai** — AI notes but not task-focused, not self-hosted, subscription model
- **Reflect** — AI notes, closed source, no Kanban/task management
- **Saner.ai** — AI workspace, cloud-only, limited customization

**Secondary competitors:** Different solution, same problem
- **Obsidian + plugins** — Powerful but complex setup, no native AI, plugin dependency hell
- **Logseq** — Open source but no built-in AI, steep learning curve
- **Anytype** — Self-hosted but no AI integration, early stage
- **Capacities** — Object-based notes, AI features limited

**Indirect competitors:** Conflicting approach
- Pen and paper — No search, no sync, no AI
- Spreadsheets — Flexible but no intelligence, becomes messy
- Simple todo apps (Apple Reminders, Google Tasks) — Too simple for knowledge work
- Status quo (doing nothing) — Accepting the pain

**How each falls short:**
All either lack AI integration, require cloud/data sacrifice, or are too complex to set up. None offer the combination of AI-native interface + self-hosting + file-based portability.

---

## Differentiation

**Key differentiators:**
1. **AI-native** — Chat is the primary interface, not an add-on feature
2. **Self-hosted** — Your data, your control, runs on your machine
3. **File-based** — Tasks stored as markdown files, portable and future-proof
4. **Bidirectional sync** — Chat creates tasks, Kanban manages them, both stay synced
5. **OpenClaw-powered** — Extensible platform, works with multiple AI models, not locked to one provider

**How we do it differently:**
Instead of bolting AI onto a task manager, we built the entire experience around AI-first interaction. You create tasks through natural conversation — "Remind me to review the Q4 report Friday" — and they appear in your Kanban board with full context. Everything is stored as simple markdown files you own.

**Why that's better:**
- Natural workflow (just talk to your AI like a colleague)
- Data ownership (files you control, can edit anywhere)
- Flexibility (works with any OpenClaw-compatible AI model)
- Portability (tasks are just markdown files, no vendor lock-in)
- Privacy (runs locally, data never leaves your machine unless you want it to)

**Why customers choose us:**
- Want AI that actually understands their work context
- Value privacy and data ownership over convenience
- Prefer open source and self-hosting for control
- Tired of juggling multiple tools that don't integrate
- Frustrated with cloud-only AI that requires data sacrifice

---

## Objections & Anti-Personas

**Top objections:**

| Objection | Response |
|-----------|----------|
| "I don't want to self-host, too complex" | OneClaw managed hosting available — we handle setup, you get the benefits |
| "Sounds complicated to set up" | One-click installers, Docker compose, detailed docs, managed option available |
| "I already use Notion/Obsidian" | Import your data, AI-native is fundamentally different experience, file-based means you can leave anytime |
| "What if OpenClaw stops working?" | Open source, file-based storage, no lock-in — your data is always accessible |
| "Is my data secure?" | Runs on your machine, no cloud required, auditable open-source code |
| "I need mobile access" | Mobile app on roadmap, web access works on mobile, files sync to any device |
| "What about team features?" | Coming in Q2 — shared workspaces, permissions, team billing |

**Anti-persona (who we're NOT for):**
- Wants everything done for them with zero setup effort
- Doesn't care about data privacy or ownership
- Happy with existing tools (no real pain point)
- Needs enterprise features now (SSO, compliance, audit logs)
- Wants mobile-first experience (not ready yet)
- Looking for consumer/consumer-grade simplicity

---

## Switching Dynamics (JTBD Four Forces)

**Push:** What frustrations drive them away from current solution
- AI feels bolted on, not truly integrated
- Data trapped in proprietary formats, can't export
- Too many tools to manage, subscription fatigue
- Privacy concerns with cloud AI services
- Context lost between different apps

**Pull:** What attracts them to ClawBrain
- AI that actually understands work context
- Own your data, portable file format
- One tool for tasks, notes, and AI assistance
- Self-hosted option for privacy
- Open source means no vendor lock-in

**Habit:** What keeps them stuck with current approach
- Already invested time in existing tool setup
- Migration effort seems daunting
- Team using different tool (coordination cost)
- "Good enough" mindset
- Fear of change and learning new system

**Anxiety:** What worries them about switching
- Setup complexity and time investment
- Will it actually be better than current solution?
- Data migration concerns
- What if it doesn't work out? (wasted effort)
- Support and community size

**How we address switching friction:**
- Clear migration guides from Notion/Obsidian
- Import tools for common formats
- Managed hosting option removes setup barrier
- Active Discord community for support
- File-based means you can leave anytime (no lock-in)

---

## Customer Language

**How they describe the problem:**
- "I have notes in 5 different apps and can't find anything"
- "ChatGPT doesn't remember what I told it yesterday"
- "I want AI that knows my projects, not generic responses"
- "I'm tired of subscription fees for simple tools"
- "I don't trust putting my data in the cloud"
- "I spend more time organizing than doing actual work"
- "My AI assistant should know what I'm working on"

**How they describe ClawBrain:**
- "It's like having an assistant that actually knows my work"
- "Finally, an AI tool that respects my privacy"
- "My tasks are just files I can take anywhere"
- "The chat-to-Kanban flow is magical"
- "I own my data again"
- "One tool does it all"

**Words to use:**
- AI-native, second brain, self-hosted, open source
- Bidirectional sync, file-based, OpenClaw-powered
- Context-aware, portable, extensible, privacy-first
- Chat-first, knowledge management, task automation

**Words to avoid:**
- "Chatbot" (implies simple, not intelligent)
- "Dashboard" (implies passive, not interactive)
- "Plugin" (implies bolted-on, not native)
- "Cloud" (privacy-conscious users avoid this)
- "Feature" (focus on benefits, not features)
- "Solution" (vague corporate speak)

**Glossary:**
| Term | Meaning |
|------|---------|
| OpenClaw | Open-source AI assistant platform that powers ClawBrain |
| Second brain | Personal knowledge management system that extends your memory |
| Kanban | Visual task board with columns (To Do, In Progress, Done) |
| Frontmatter | YAML metadata at top of markdown files |
| Bidirectional sync | Changes flow both ways (chat ↔ board automatically) |
| OneClaw | Managed hosting service for OpenClaw/ClawBrain |
| Markdown | Plain text format with simple formatting |

---

## Brand Voice

**Tone:**
Competent but approachable. Technical but not elitist. Confident but not arrogant.

**Style:**
Direct, clear, slightly irreverent. No corporate fluff. Say what we mean.

**Personality:**
- **Smart** — Knows the tech, speaks with authority
- **Pragmatic** — Focuses on what works, not what's trendy
- **Independent** — Self-hosted ethos, anti-lock-in
- **Helpful** — Genuinely solves problems, not selling snake oil
- **Transparent** — Open source, no BS, shows the code

**Writing principles:**
- Lead with outcomes, not features
- Use customer language, not marketing speak
- Be specific, not vague
- Address objections head-on
- One idea per section

**Examples:**
❌ "ClawBrain leverages cutting-edge AI to optimize your productivity workflow"
✅ "Chat with your AI. Watch tasks appear. Get work done."

❌ "Our solution provides seamless integration between chat and task management"
✅ "Say 'remind me Friday' — it appears in your board. That's it."

---

## Proof Points

**Key metrics to cite:**
- Open source (MIT license)
- Built with modern stack (Next.js 15, Bun, shadcn/ui)
- File-based (tasks are just markdown files)
- Self-hosted (runs on your machine)
- Powered by OpenClaw (extensible AI platform)

**Notable users:**
- OpenClaw community early adopters
- Privacy-conscious developers
- AI tooling enthusiasts
- Founder community (Indie Hackers, etc.)

**Testimonials to collect:**
- "Finally, an AI assistant that knows what I'm working on." — Early user
- "I switched from Notion and my data is actually mine now." — Beta user
- "The chat-to-Kanban workflow saves me 30 minutes every morning." — Founder

**Value themes and proof:**
| Theme | Proof |
|-------|-------|
| Privacy | Self-hosted, file-based, open source, no cloud required |
| Intelligence | AI-native, context-aware, remembers your work |
| Flexibility | OpenClaw-powered, works with multiple AI models |
| Portability | Markdown files, no lock-in, import/export |
| Control | You own everything, self-hosted option, auditable code |

---

## Goals

**Business goal:**
Become the default AI-native second brain for privacy-conscious knowledge workers, with 10,000+ active self-hosted instances and 500+ OneClaw paid users within 12 months of launch.

**Key conversion actions (funnel):**
1. **Awareness:** Star GitHub repo, share on social
2. **Interest:** Join waitlist, join Discord
3. **Consideration:** Self-host ClawBrain, try it out
4. **Activation:** Daily active usage (create 3+ tasks via chat)
5. **Revenue:** Sign up for OneClaw managed hosting
6. **Advocacy:** Refer friends, write about experience, contribute to open source

**Target metrics by phase:**

| Phase | Waitlist | GitHub Stars | Active Users | OneClaw Users |
|-------|----------|--------------|--------------|---------------|
| Alpha | 100 | 50 | 10 | 0 |
| Beta | 500 | 200 | 50 | 10 |
| Early Access | 1,000 | 500 | 200 | 50 |
| Full Launch | 2,000 | 1,000 | 500 | 100 |
| Month 6 | 5,000 | 3,000 | 2,000 | 300 |
| Month 12 | 10,000 | 5,000 | 5,000 | 500+ |

**Current baseline (as of 2026-02-11):**
- GitHub stars: TBD (pre-launch)
- Waitlist: 0 (need to set up)
- Discord community: Small (need to build)
- Active instances: Internal testing only

---

## Related Documents

- ClawBrain README: ~/Projects/clawbrain/README.md
- PRD: ~/Projects/clawbrain/docs/PRD.md
- Launch Strategy: ~/Projects/clawbrain/skill/marketing-skills/launch-strategy/SKILL.md
- Copywriting Guide: ~/Projects/clawbrain/skill/marketing-skills/copywriting/SKILL.md

---

*This document should be reviewed and updated monthly, or whenever significant product/market changes occur.*
