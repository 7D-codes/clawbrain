/**
 * Task Manager Skill for OpenClaw
 * 
 * Manages tasks as markdown files with YAML frontmatter.
 * Stored in ~/clawdbrain/tasks/task-{uuid}.md
 */

import { v4 as uuidv4 } from 'uuid';
import yaml from 'js-yaml';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import matter from 'gray-matter';

// Configuration
const DEFAULT_TASKS_DIR = path.join(os.homedir(), 'clawdbrain', 'tasks');

/**
 * Get the tasks directory from context or default
 */
function getTasksDir(context) {
  return context?.TASKS_DIR || DEFAULT_TASKS_DIR;
}

/**
 * Ensure the tasks directory exists
 */
async function ensureTasksDir(tasksDir) {
  await fs.mkdir(tasksDir, { recursive: true });
}

/**
 * Generate a slug from a title
 */
function slugify(title) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .substring(0, 50);
}

/**
 * Get current ISO timestamp
 */
function now() {
  return new Date().toISOString();
}

/**
 * Create a task file
 */
async function createTask(context, params) {
  const { title, project = 'default', description = '', status = 'todo' } = params;
  
  if (!title) {
    return { error: 'Title is required' };
  }
  
  const tasksDir = getTasksDir(context);
  await ensureTasksDir(tasksDir);
  
  const id = uuidv4();
  const slug = slugify(title);
  const timestamp = now();
  
  const taskData = {
    id,
    slug,
    title,
    status,
    project,
    created: timestamp,
    updated: timestamp
  };
  
  const content = generateTaskMarkdown(taskData, description);
  const filePath = path.join(tasksDir, `task-${id}.md`);
  
  await fs.writeFile(filePath, content, 'utf-8');
  
  return {
    success: true,
    task: {
      ...taskData,
      content: description
    },
    filePath
  };
}

/**
 * Generate markdown content for a task
 */
function generateTaskMarkdown(taskData, description) {
  const frontmatter = yaml.dump({
    id: taskData.id,
    slug: taskData.slug,
    title: taskData.title,
    status: taskData.status,
    project: taskData.project,
    created: taskData.created,
    updated: taskData.updated
  }, { lineWidth: -1 });
  
  return `---\n${frontmatter}---\n\n# ${taskData.title}\n\n${description || 'No description provided.'}\n`;
}

/**
 * List all tasks
 */
async function listTasks(context, params = {}) {
  const { project, status } = params;
  const tasksDir = getTasksDir(context);
  
  try {
    await fs.access(tasksDir);
  } catch {
    return { tasks: [], count: 0 };
  }
  
  const files = await fs.readdir(tasksDir);
  const taskFiles = files.filter(f => f.startsWith('task-') && f.endsWith('.md'));
  
  const tasks = [];
  
  for (const file of taskFiles) {
    try {
      const filePath = path.join(tasksDir, file);
      const content = await fs.readFile(filePath, 'utf-8');
      const parsed = matter(content);
      
      const task = {
        id: parsed.data.id,
        slug: parsed.data.slug,
        title: parsed.data.title,
        status: parsed.data.status,
        project: parsed.data.project,
        created: parsed.data.created,
        updated: parsed.data.updated,
        content: parsed.content
      };
      
      // Apply filters
      if (project && task.project !== project) continue;
      if (status && task.status !== status) continue;
      
      tasks.push(task);
    } catch (err) {
      // Skip invalid files
      console.error(`Error reading task file ${file}:`, err.message);
    }
  }
  
  // Sort by updated date (newest first)
  tasks.sort((a, b) => new Date(b.updated) - new Date(a.updated));
  
  return {
    tasks,
    count: tasks.length
  };
}

/**
 * Get a single task by ID or slug
 */
async function getTask(context, params) {
  const { id, slug } = params;
  
  if (!id && !slug) {
    return { error: 'ID or slug is required' };
  }
  
  const tasksDir = getTasksDir(context);
  
  try {
    await fs.access(tasksDir);
  } catch {
    return { error: 'Tasks directory not found' };
  }
  
  const files = await fs.readdir(tasksDir);
  const taskFiles = files.filter(f => f.startsWith('task-') && f.endsWith('.md'));
  
  for (const file of taskFiles) {
    try {
      const filePath = path.join(tasksDir, file);
      const content = await fs.readFile(filePath, 'utf-8');
      const parsed = matter(content);
      
      if (id && parsed.data.id === id) {
        return {
          found: true,
          task: {
            id: parsed.data.id,
            slug: parsed.data.slug,
            title: parsed.data.title,
            status: parsed.data.status,
            project: parsed.data.project,
            created: parsed.data.created,
            updated: parsed.data.updated,
            content: parsed.content
          }
        };
      }
      
      if (slug && parsed.data.slug === slug) {
        return {
          found: true,
          task: {
            id: parsed.data.id,
            slug: parsed.data.slug,
            title: parsed.data.title,
            status: parsed.data.status,
            project: parsed.data.project,
            created: parsed.data.created,
            updated: parsed.data.updated,
            content: parsed.content
          }
        };
      }
    } catch (err) {
      continue;
    }
  }
  
  return { found: false, error: 'Task not found' };
}

/**
 * Update a task
 */
async function updateTask(context, params) {
  const { id, slug, title, status, project, description } = params;
  
  if (!id && !slug) {
    return { error: 'ID or slug is required' };
  }
  
  const tasksDir = getTasksDir(context);
  const files = await fs.readdir(tasksDir);
  const taskFiles = files.filter(f => f.startsWith('task-') && f.endsWith('.md'));
  
  for (const file of taskFiles) {
    try {
      const filePath = path.join(tasksDir, file);
      const content = await fs.readFile(filePath, 'utf-8');
      const parsed = matter(content);
      
      const match = (id && parsed.data.id === id) || (slug && parsed.data.slug === slug);
      
      if (match) {
        // Update fields
        if (title) parsed.data.title = title;
        if (status) parsed.data.status = status;
        if (project) parsed.data.project = project;
        parsed.data.updated = now();
        
        // Update slug if title changed
        if (title) {
          parsed.data.slug = slugify(title);
        }
        
        // Generate new content
        const newContent = generateTaskMarkdown(
          parsed.data,
          description || parsed.content.replace(`# ${parsed.data.title}\n\n`, '').trim()
        );
        
        await fs.writeFile(filePath, newContent, 'utf-8');
        
        return {
          success: true,
          task: {
            id: parsed.data.id,
            slug: parsed.data.slug,
            title: parsed.data.title,
            status: parsed.data.status,
            project: parsed.data.project,
            created: parsed.data.created,
            updated: parsed.data.updated
          }
        };
      }
    } catch (err) {
      continue;
    }
  }
  
  return { error: 'Task not found' };
}

/**
 * Delete a task
 */
async function deleteTask(context, params) {
  const { id, slug } = params;
  
  if (!id && !slug) {
    return { error: 'ID or slug is required' };
  }
  
  const tasksDir = getTasksDir(context);
  const files = await fs.readdir(tasksDir);
  const taskFiles = files.filter(f => f.startsWith('task-') && f.endsWith('.md'));
  
  for (const file of taskFiles) {
    try {
      const filePath = path.join(tasksDir, file);
      const content = await fs.readFile(filePath, 'utf-8');
      const parsed = matter(content);
      
      const match = (id && parsed.data.id === id) || (slug && parsed.data.slug === slug);
      
      if (match) {
        await fs.unlink(filePath);
        return {
          success: true,
          deleted: {
            id: parsed.data.id,
            title: parsed.data.title
          }
        };
      }
    } catch (err) {
      continue;
    }
  }
  
  return { error: 'Task not found' };
}

// Command handlers for natural language parsing
const commandPatterns = [
  {
    pattern: /create task[:\s]+["']?([^"']+)["']?(?:\s+in\s+project\s+(\S+))?/i,
    handler: (context, match) => createTask(context, {
      title: match[1].trim(),
      project: match[2] || 'default'
    })
  },
  {
    pattern: /list tasks(?:\s+in\s+project\s+(\S+))?(?:\s+with\s+status\s+(todo|in-progress|done))?/i,
    handler: (context, match) => listTasks(context, {
      project: match[1],
      status: match[2]
    })
  },
  {
    pattern: /update task\s+(\S+)\s+status\s+to\s+(todo|in-progress|done)/i,
    handler: (context, match) => {
      const identifier = match[1];
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(identifier);
      return updateTask(context, {
        [isUuid ? 'id' : 'slug']: identifier,
        status: match[2]
      });
    }
  },
  {
    pattern: /update task\s+(\S+)\s+title\s+to\s+["']([^"']+)["']/i,
    handler: (context, match) => {
      const identifier = match[1];
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(identifier);
      return updateTask(context, {
        [isUuid ? 'id' : 'slug']: identifier,
        title: match[2]
      });
    }
  },
  {
    pattern: /delete task\s+(\S+)/i,
    handler: (context, match) => {
      const identifier = match[1];
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(identifier);
      return deleteTask(context, {
        [isUuid ? 'id' : 'slug']: identifier
      });
    }
  }
];

/**
 * Main skill entry point
 */
export default async function taskManagerSkill(context, message) {
  // Try to match against command patterns
  for (const cmd of commandPatterns) {
    const match = message.match(cmd.pattern);
    if (match) {
      return await cmd.handler(context, match);
    }
  }
  
  // No pattern matched - return help
  return {
    error: 'Unknown command',
    help: `Available commands:
- create task: "<title>" [in project <project>]
- list tasks [in project <project>] [with status <todo|in-progress|done>]
- update task <id|slug> status to <todo|in-progress|done>
- update task <id|slug> title to "<new title>"
- delete task <id|slug>`
  };
}

// Export individual functions for programmatic use
export {
  createTask,
  listTasks,
  getTask,
  updateTask,
  deleteTask
};
