# ClawBrain

**AI-native second brain powered by OpenClaw.**

Chat with your AI assistant, manage tasks in Kanban views, and maintain full context — all in one unified dashboard. When you host ClawBrain, your OpenClaw instance lives inside this interface.

## What Makes It Different

- **Chat is the interface** — Ask "what's on my plate?" and get real answers
- **Your AI knows your tasks** — OpenClaw reads from the same files the dashboard shows
- **Self-hosted, fully open** — Your data, your files, your control

## Quick Start

**Prerequisites:** [bun](https://bun.sh/) must be installed.

```bash
# 1. Clone and install
git clone https://github.com/yourusername/clawbrain.git
cd clawbrain
bun install

# 2. Set up OpenClaw (if not already installed)
curl -fsSL https://openclaw.ai/install | sh
openclaw setup

# 3. Start OpenClaw Gateway
openclaw gateway start

# 4. Start ClawBrain
bun run dev

# 5. Open http://localhost:3000
```

## Package Manager

**This project uses bun exclusively.** Do not use npm, yarn, or pnpm.

```bash
bun install     # Install dependencies
bun add <pkg>   # Add packages
bun run dev     # Dev server
bun run build   # Production build
```

## Development

See `AGENTS.md` for:
- Team assignments
- Skill requirements
- Component ownership

See `docs/` folder for:
- [PRD.md](./docs/PRD.md) — Product requirements
- [ARCHITECTURE.md](./docs/ARCHITECTURE.md) — Technical architecture
- [DESIGN.md](./docs/DESIGN.md) — Design system
- [prd.json](./docs/prd.json) — User stories

## Stack

- **Framework:** Next.js 15 + TypeScript
- **UI:** shadcn/ui + AI Elements
- **Styling:** Tailwind CSS (mono wireframe grid)
- **State:** Zustand
- **Package Manager:** bun

## License

MIT
