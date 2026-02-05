# ClawBrain

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![bun](https://img.shields.io/badge/bun-1.3.8-black)](https://bun.sh)
[![Next.js](https://img.shields.io/badge/Next.js-15-black)](https://nextjs.org)

> **AI-native second brain powered by OpenClaw.**

Chat with your AI assistant, manage tasks in Kanban views, and maintain full context — all in one unified dashboard. When you host ClawBrain, your OpenClaw instance lives inside this interface, giving you an AI that actually knows about your work.

![ClawBrain Interface Preview](./docs/preview.png)

## ✨ What Makes It Different

- **🤖 AI-Native Interface** — Chat is the primary interface. Ask "what's on my plate?" and get real answers from your actual task data.
- **📝 File-Based Tasks** — Tasks are stored as markdown files with YAML frontmatter. Your data is yours, always accessible.
- **🔄 Bidirectional Sync** — Create tasks via chat, see them appear in Kanban instantly. Drag cards to update status, OpenClaw knows immediately.
- **🏠 Self-Hosted** — Your data, your files, your control. No external services required beyond your AI provider.

## 🚀 Quick Start

### Prerequisites

- [bun](https://bun.sh/) 1.3.8+ (required)
- [OpenClaw](https://openclaw.ai) installed and configured
- AI provider API key (Kimi, OpenAI, etc.)

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/7d-claw/clawbrain.git
cd clawbrain

# 2. Install dependencies
bun install

# 3. Install the OpenClaw skill
cp -r skill/task-manager ~/.openclaw/skills/

# 4. Start OpenClaw Gateway (in a separate terminal)
openclaw gateway start

# 5. Start ClawBrain
bun run dev

# 6. Open http://localhost:3000
```

## 📖 Usage

### Creating Tasks

In the chat panel, simply type:
```
create task: Research competitors for our product
```

The task appears instantly in your Kanban board under "To Do".

### Managing Tasks

- **Drag and drop** cards between columns (To Do → In Progress → Done)
- **Click cards** to view full details
- Tasks sync bidirectionally with OpenClaw

### Chat with Context

Ask your AI about your work:
```
What tasks are due this week?
What's on my plate right now?
Summarize what I completed yesterday
```

## 🏗️ Architecture

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
    │                   ~/clawdbrain/                      │
    │  ┌──────────┐  ┌──────────┐  ┌──────────┐           │
    │  │  tasks/  │  │ projects/│  │sessions/ │           │
    │  │ *.md     │  │    /     │  │*.jsonl   │           │
    │  └──────────┘  └──────────┘  └──────────┘           │
    └──────────────────────────────────────────────────────┘
           ▲                                            │
           │         WebSocket (ws://localhost:18789)   │
           │                                            ▼
           │         ┌──────────────────────────┐
           └─────────┤    OpenClaw Gateway      │
                     │  (session management)    │
                     └──────────────────────────┘
```

## 🛠️ Development

### Package Manager

**This project uses bun exclusively.** Do not use npm, yarn, or pnpm.

```bash
bun install     # Install dependencies
bun add <pkg>   # Add packages
bun run dev     # Dev server
bun run build   # Production build
```

### Project Structure

```
clawbrain/
├── docs/                   # Documentation
│   ├── PRD.md             # Product requirements
│   ├── ARCHITECTURE.md    # Technical architecture
│   ├── DESIGN.md          # Design system
│   └── prd.json           # User stories
├── skill/                 # OpenClaw skill
│   └── task-manager/      # Task management skill
├── src/
│   ├── app/               # Next.js app routes
│   ├── components/        # React components
│   │   ├── kanban/        # Kanban board components
│   │   ├── chat/          # Chat panel components
│   │   └── layout/        # Layout components
│   ├── lib/               # Utilities
│   └── stores/            # Zustand stores
└── package.json
```

### Tech Stack

- **Framework:** [Next.js 15](https://nextjs.org) + TypeScript
- **UI:** [shadcn/ui](https://ui.shadcn.com) + [AI Elements](https://elements.ai-sdk.dev)
- **Styling:** Tailwind CSS with mono wireframe design system
- **State:** [Zustand](https://zustand.docs.pmnd.rs)
- **Drag & Drop:** [@dnd-kit](https://dndkit.com)
- **Package Manager:** [bun](https://bun.sh)

## 🤝 Contributing

Contributions are welcome! Please read our [Contributing Guide](./CONTRIBUTING.md) for details on our code of conduct and the process for submitting pull requests.

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](./LICENSE) file for details.

## 🙏 Acknowledgments

- Built with [OpenClaw](https://openclaw.ai) — the open-source AI assistant platform
- UI components from [shadcn/ui](https://ui.shadcn.com)
- Chat components from [AI Elements](https://elements.ai-sdk.dev)

## 📬 Contact

- **Author:** 7d-claw
- **Issues:** [GitHub Issues](https://github.com/7d-claw/clawbrain/issues)
- **Discussions:** [GitHub Discussions](https://github.com/7d-claw/clawbrain/discussions)

---

<p align="center">
  <sub>Built with ❤️ for the OpenClaw community</sub>
</p>
