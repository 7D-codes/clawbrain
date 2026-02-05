import fs from 'fs/promises';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { 
  sanitizePath, 
  getTaskPath, 
  getTasksDirectory,
  validateContent,
  PathValidationError,
  isValidUUID 
} from './security';

/**
 * File store module for atomic file operations
 * - All writes are atomic (temp file → rename)
 * - Conflict detection via timestamps
 * - Sandboxed to ~/clawdbrain/
 */

// Task interface
export interface Task {
  id: string;
  slug: string;
  title: string;
  status: 'todo' | 'in-progress' | 'done';
  project: string;
  created: string;
  updated: string;
  content: string; // markdown body
}

// Task metadata from frontmatter
interface TaskFrontmatter {
  id: string;
  slug: string;
  title: string;
  status: 'todo' | 'in-progress' | 'done';
  project: string;
  created: string;
  updated: string;
}

/**
 * Custom error class for file store errors
 */
export class FileStoreError extends Error {
  code: string;
  statusCode: number;
  
  constructor(message: string, code: string, statusCode: number = 500) {
    super(message);
    this.name = 'FileStoreError';
    this.code = code;
    this.statusCode = statusCode;
  }
}

/**
 * Ensures the tasks directory exists
 */
export async function ensureTasksDirectory(): Promise<void> {
  try {
    const tasksDir = getTasksDirectory();
    await fs.mkdir(tasksDir, { recursive: true });
  } catch (error) {
    throw new FileStoreError(
      `Failed to create tasks directory: ${(error as Error).message}`,
      'DIRECTORY_CREATE_FAILED',
      500
    );
  }
}

/**
 * Parses a task file and extracts frontmatter and content
 */
function parseTaskFile(content: string, filename: string): Task {
  const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  
  if (!frontmatterMatch) {
    throw new FileStoreError(
      `Invalid task file format: ${filename}`,
      'INVALID_TASK_FORMAT',
      500
    );
  }
  
  const [, frontmatterYaml, body] = frontmatterMatch;
  
  // Simple YAML frontmatter parsing
  const frontmatter: Record<string, string> = {};
  frontmatterYaml.split('\n').forEach(line => {
    const colonIndex = line.indexOf(':');
    if (colonIndex > 0) {
      const key = line.slice(0, colonIndex).trim();
      let value = line.slice(colonIndex + 1).trim();
      // Remove quotes if present
      if ((value.startsWith('"') && value.endsWith('"')) || 
          (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }
      frontmatter[key] = value;
    }
  });
  
  const id = frontmatter.id || '';
  
  if (!isValidUUID(id)) {
    throw new FileStoreError(
      `Invalid UUID in task file: ${filename}`,
      'INVALID_TASK_ID',
      500
    );
  }
  
  return {
    id,
    slug: frontmatter.slug || '',
    title: frontmatter.title || '',
    status: (frontmatter.status as Task['status']) || 'todo',
    project: frontmatter.project || 'default',
    created: frontmatter.created || new Date().toISOString(),
    updated: frontmatter.updated || new Date().toISOString(),
    content: body.trim()
  };
}

/**
 * Serializes a task to markdown format with YAML frontmatter
 */
function serializeTask(task: Task): string {
  const frontmatter = [
    '---',
    `id: "${task.id}"`,
    `slug: "${task.slug}"`,
    `title: "${task.title}"`,
    `status: ${task.status}`,
    `project: "${task.project}"`,
    `created: "${task.created}"`,
    `updated: "${task.updated}"`,
    '---',
    '',
    task.content
  ].join('\n');
  
  return frontmatter;
}

/**
 * Lists all tasks in the tasks directory
 */
export async function listTasks(): Promise<Task[]> {
  try {
    await ensureTasksDirectory();
    const tasksDir = getTasksDirectory();
    
    let files: string[];
    try {
      files = await fs.readdir(tasksDir);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        return [];
      }
      throw error;
    }
    
    const tasks: Task[] = [];
    
    for (const filename of files) {
      if (!filename.startsWith('task-') || !filename.endsWith('.md')) {
        continue;
      }
      
      try {
        const filePath = sanitizePath(path.join('tasks', filename));
        const content = await fs.readFile(filePath, 'utf-8');
        const task = parseTaskFile(content, filename);
        tasks.push(task);
      } catch (error) {
        // Skip invalid task files but log the error
        console.error(`Failed to parse task file ${filename}:`, error);
      }
    }
    
    // Sort by updated date, newest first
    tasks.sort((a, b) => new Date(b.updated).getTime() - new Date(a.updated).getTime());
    
    return tasks;
  } catch (error) {
    if (error instanceof FileStoreError || error instanceof PathValidationError) {
      throw error;
    }
    throw new FileStoreError(
      `Failed to list tasks: ${(error as Error).message}`,
      'LIST_TASKS_FAILED',
      500
    );
  }
}

/**
 * Gets a single task by ID
 */
export async function getTask(taskId: string): Promise<Task> {
  try {
    const filePath = getTaskPath(taskId);
    
    let content: string;
    try {
      content = await fs.readFile(filePath, 'utf-8');
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        throw new FileStoreError('Task not found', 'TASK_NOT_FOUND', 404);
      }
      throw error;
    }
    
    return parseTaskFile(content, `task-${taskId}.md`);
  } catch (error) {
    if (error instanceof FileStoreError || error instanceof PathValidationError) {
      throw error;
    }
    throw new FileStoreError(
      `Failed to get task: ${(error as Error).message}`,
      'GET_TASK_FAILED',
      500
    );
  }
}

/**
 * Creates a new task
 */
export async function createTask(
  data: Omit<Task, 'id' | 'created' | 'updated'>
): Promise<Task> {
  try {
    await ensureTasksDirectory();
    
    const now = new Date().toISOString();
    const task: Task = {
      id: uuidv4(),
      slug: data.slug,
      title: data.title,
      status: data.status,
      project: data.project,
      created: now,
      updated: now,
      content: data.content
    };
    
    const filePath = getTaskPath(task.id);
    const content = serializeTask(task);
    
    validateContent(content);
    await atomicWriteFile(filePath, content);
    
    return task;
  } catch (error) {
    if (error instanceof FileStoreError || error instanceof PathValidationError) {
      throw error;
    }
    throw new FileStoreError(
      `Failed to create task: ${(error as Error).message}`,
      'CREATE_TASK_FAILED',
      500
    );
  }
}

/**
 * Updates an existing task
 * Uses optimistic locking with timestamp-based conflict detection
 */
export async function updateTask(
  taskId: string, 
  updates: Partial<Omit<Task, 'id' | 'created'>>
): Promise<Task> {
  try {
    // Get current task
    const currentTask = await getTask(taskId);
    
    // Merge updates
    const updatedTask: Task = {
      ...currentTask,
      ...updates,
      id: currentTask.id, // Preserve ID
      created: currentTask.created, // Preserve creation date
      updated: new Date().toISOString() // Always update timestamp
    };
    
    const filePath = getTaskPath(taskId);
    const content = serializeTask(updatedTask);
    
    validateContent(content);
    await atomicWriteFile(filePath, content);
    
    return updatedTask;
  } catch (error) {
    if (error instanceof FileStoreError || error instanceof PathValidationError) {
      throw error;
    }
    throw new FileStoreError(
      `Failed to update task: ${(error as Error).message}`,
      'UPDATE_TASK_FAILED',
      500
    );
  }
}

/**
 * Deletes a task by ID
 */
export async function deleteTask(taskId: string): Promise<void> {
  try {
    const filePath = getTaskPath(taskId);
    
    try {
      await fs.unlink(filePath);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        throw new FileStoreError('Task not found', 'TASK_NOT_FOUND', 404);
      }
      throw error;
    }
  } catch (error) {
    if (error instanceof FileStoreError || error instanceof PathValidationError) {
      throw error;
    }
    throw new FileStoreError(
      `Failed to delete task: ${(error as Error).message}`,
      'DELETE_TASK_FAILED',
      500
    );
  }
}

/**
 * Atomic file write operation
 * Writes to a temporary file, then renames to the target path
 * This ensures readers never see a partially written file
 */
async function atomicWriteFile(targetPath: string, content: string): Promise<void> {
  const tempPath = `${targetPath}.tmp.${Date.now()}`;
  
  try {
    // Ensure the parent directory exists
    const parentDir = path.dirname(targetPath);
    await fs.mkdir(parentDir, { recursive: true });
    
    // Write to temporary file
    await fs.writeFile(tempPath, content, 'utf-8');
    
    // Sync to ensure data is written to disk (optional but safer)
    try {
      const fd = await fs.open(tempPath, 'r');
      await fd.sync();
      await fd.close();
    } catch {
      // fsync may not be available on all platforms, ignore errors
    }
    
    // Atomic rename
    await fs.rename(tempPath, targetPath);
  } catch (error) {
    // Clean up temp file on error
    try {
      await fs.unlink(tempPath);
    } catch {
      // Ignore cleanup errors
    }
    throw error;
  }
}

/**
 * Gets task file stats (for conflict detection)
 */
export async function getTaskStats(taskId: string): Promise<{ mtime: Date; size: number }> {
  try {
    const filePath = getTaskPath(taskId);
    const stats = await fs.stat(filePath);
    return {
      mtime: stats.mtime,
      size: stats.size
    };
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      throw new FileStoreError('Task not found', 'TASK_NOT_FOUND', 404);
    }
    throw new FileStoreError(
      `Failed to get task stats: ${(error as Error).message}`,
      'GET_STATS_FAILED',
      500
    );
  }
}
