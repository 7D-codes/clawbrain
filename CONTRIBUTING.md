# Contributing to ClawBrain

Thank you for your interest in contributing to ClawBrain! We welcome contributions from the community.

## How to Contribute

### Reporting Bugs

- Check if the issue has already been reported
- Include clear steps to reproduce
- Include your environment details (OS, browser, versions)

### Suggesting Features

- Open an issue with the "feature request" label
- Describe the feature and its use case
- Discuss implementation approach

### Pull Requests

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Commit with clear messages (`git commit -m 'feat: add amazing feature'`)
5. Push to your fork (`git push origin feature/amazing-feature`)
6. Open a Pull Request

## Development Setup

```bash
git clone https://github.com/7d-claw/clawbrain.git
cd clawbrain
bun install
bun run dev
```

## Code Style

- Use TypeScript for all new code
- Follow the existing mono wireframe design system
- Use bun as the package manager
- Run `bun run lint` before committing

## Commit Message Convention

We follow [Conventional Commits](https://www.conventionalcommits.org/):

- `feat:` — New features
- `fix:` — Bug fixes
- `docs:` — Documentation changes
- `style:` — Code style changes (formatting, etc.)
- `refactor:` — Code refactoring
- `test:` — Adding or updating tests
- `chore:` — Build process or auxiliary tool changes

## Questions?

Feel free to open an issue or start a discussion!
