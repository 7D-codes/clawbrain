# Task Manager Skill

An OpenClaw skill for managing tasks as markdown files with YAML frontmatter.

## Installation

```bash
# Copy skill to OpenClaw skills folder
cp -r ~/Projects/clawbrain/skill/task-manager ~/.openclaw/skills/

# Or symlink for development
ln -s ~/Projects/clawbrain/skill/task-manager ~/.openclaw/skills/task-manager
```

## Commands

### Create Task
```
create task: <title>
create task "<title>" in project <project>
```

### List Tasks
```
list tasks
list tasks in project <project>
list tasks with status <todo|in-progress|done>
```

### Update Task
```
update task <id> status to <todo|in-progress|done>
update task <slug> title to "<new title>"
```

### Delete Task
```
delete task <id>
delete task <slug>
```

## File Format

Tasks are stored as markdown files in `~/clawdbrain/tasks/`:

```markdown
---
id: task-uuid
slug: task-name
title: "Task Title"
status: todo | in-progress | done
project: project-name
created: ISO timestamp
updated: ISO timestamp
---

# Task Title

Description here...
```

## Configuration

The skill reads configuration from OpenClaw's context:
- `TASKS_DIR`: Directory for task files (default: `~/clawdbrain/tasks`)

## Dependencies

- `uuid` - UUID generation
- `js-yaml` - YAML frontmatter parsing
- `gray-matter` - Markdown frontmatter handling

## Author

ClawBrain Team
