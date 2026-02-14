# ClawBrain Marketing Skills

Adapted from [Corey Haines' marketingskills](https://github.com/coreyhaines31/marketingskills) — marketing skills tailored for the ClawBrain AI-native second brain.

## What This Is

These are AI agent skills (markdown files with prompts and workflows) that help with marketing tasks for ClawBrain. When you install these, OpenClaw can help with launch planning, copywriting, landing page optimization, and more.

## Skills Included

| Skill | Purpose |
|-------|---------|
| `launch-strategy` | Plan product launch phases, Product Hunt strategy, channel planning (ORB framework) |
| `product-marketing-context` | Create and maintain positioning/messaging document |
| `copywriting` | Write homepage copy, emails, social posts, ads |
| `page-cro` | Optimize landing pages for conversions |

## Installation

### Option 1: Copy to OpenClaw Skills Directory

```bash
# Copy all marketing skills
cp -r ~/Projects/clawbrain/skill/marketing-skills/* ~/.openclaw/skills/

# Or copy specific skills
cp -r ~/Projects/clawbrain/skill/marketing-skills/launch-strategy ~/.openclaw/skills/
```

### Option 2: Use Directly in Project

Reference the skills directly from the project directory:

```bash
# In your OpenClaw config, add:
# skillsPaths: ["~/Projects/clawbrain/skill/marketing-skills"]
```

## Usage

Once installed, just ask OpenClaw for help:

```
"Help me plan the ClawBrain launch"
→ Uses launch-strategy skill

"Write homepage copy for ClawBrain"
→ Uses copywriting skill

"Create our product marketing context doc"
→ Uses product-marketing-context skill

"Optimize our landing page for signups"
→ Uses page-cro skill
```

## Key Concepts from Corey's Framework

### ORB Channel Strategy
- **Owned:** Email list, blog, Discord, YouTube — you control these
- **Rented:** Twitter/X, LinkedIn, HN, Reddit — use for distribution
- **Borrowed:** Podcasts, influencers, partnerships — tap existing audiences

### Five-Phase Launch
1. **Internal** — Friends & family feedback
2. **Alpha** — Controlled early access
3. **Beta** — Scaled early access + buzz
4. **Early Access** — Controlled expansion
5. **Full Launch** — Open signups + Product Hunt

### ClawBrain Positioning
- **What:** AI-native second brain
- **Who:** Privacy-conscious knowledge workers
- **Why:** AI that knows your work + you own your data
- **Different:** AI-first (not bolted-on), self-hosted, file-based

## Customization

These skills are adapted specifically for ClawBrain:
- Messaging references ClawBrain features (chat, Kanban, OpenClaw)
- Target audience is defined (developers, founders, privacy-conscious users)
- Positioning against competitors (Notion AI, Mem.ai, etc.)
- Launch strategy includes Product Hunt and OpenClaw community

To adapt for other projects:
1. Fork this directory
2. Update product-specific references
3. Adjust target audience and competitors
4. Modify launch channels as needed

## Attribution

Based on [marketingskills](https://github.com/coreyhaines31/marketingskills) by Corey Haines — marketing expert, founder of Conversion Factory, and ex-Head of Growth at Baremetrics.

MIT Licensed — use and adapt freely.

## Contributing

To add or improve skills:
1. Edit the relevant SKILL.md file
2. Test with OpenClaw
3. Commit changes

## Related

- ClawBrain main repo: `~/Projects/clawbrain/`
- ClawBrain PRD: `~/Projects/clawbrain/docs/PRD.md`
- OneClaw (managed hosting): `~/Projects/ClawDeploy/`
