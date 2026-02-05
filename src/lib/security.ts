import path from 'path';
import os from 'os';

/**
 * Security module for file system operations
 * Provides path sandboxing and validation to prevent path traversal attacks
 */

// Sandboxed root directory - all file operations are restricted to this path
export const SANDBOX_ROOT = path.resolve(os.homedir(), 'clawdbrain');

/**
 * Validates that a string is a valid UUID v4
 */
export function isValidUUID(id: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(id);
}

/**
 * Sanitizes a path input to prevent path traversal attacks
 * - Rejects absolute paths
 * - Removes parent directory references (../)
 * - Ensures the resolved path stays within the sandbox root
 * 
 * @param inputPath - The user-provided path component
 * @returns The sanitized full path
 * @throws Error if path traversal is detected
 */
export function sanitizePath(inputPath: string): string {
  // Reject absolute paths
  if (path.isAbsolute(inputPath)) {
    throw new PathValidationError('Absolute paths are not allowed', 'ABSOLUTE_PATH');
  }
  
  // Normalize the path and remove leading parent directory references
  const normalized = path.normalize(inputPath);
  
  // Check for path traversal attempts (../ or ..\)
  if (normalized.startsWith('..') || normalized.includes('../') || normalized.includes('..\\')) {
    throw new PathValidationError('Path traversal detected', 'PATH_TRAVERSAL');
  }
  
  // Construct the full path within the sandbox
  const fullPath = path.join(SANDBOX_ROOT, normalized);
  
  // Ensure the resolved path is within the sandbox root
  // Resolve to handle any remaining .. sequences and symlinks
  const resolvedPath = path.resolve(fullPath);
  const resolvedSandbox = path.resolve(SANDBOX_ROOT);
  
  if (!resolvedPath.startsWith(resolvedSandbox)) {
    throw new PathValidationError('Path escapes sandbox directory', 'SANDBOX_ESCAPE');
  }
  
  return resolvedPath;
}

/**
 * Validates and sanitizes a task ID (must be UUID format)
 * Returns the safe file path for the task
 */
export function getTaskPath(taskId: string): string {
  if (!isValidUUID(taskId)) {
    throw new PathValidationError('Invalid task ID format - must be UUID', 'INVALID_UUID');
  }
  
  // Task IDs are used as filenames: tasks/task-{uuid}.md
  const relativePath = path.join('tasks', `task-${taskId}.md`);
  return sanitizePath(relativePath);
}

/**
 * Gets the tasks directory path (sanitized)
 */
export function getTasksDirectory(): string {
  return sanitizePath('tasks');
}

/**
 * Custom error class for path validation errors
 */
export class PathValidationError extends Error {
  code: string;
  
  constructor(message: string, code: string) {
    super(message);
    this.name = 'PathValidationError';
    this.code = code;
  }
}

/**
 * Validates file content for basic safety
 * - Prevents null bytes
 * - Checks for reasonable size limits
 */
export function validateContent(content: string, maxSize: number = 10 * 1024 * 1024): void {
  if (content === null || content === undefined) {
    throw new PathValidationError('Content cannot be null or undefined', 'INVALID_CONTENT');
  }
  
  if (typeof content !== 'string') {
    throw new PathValidationError('Content must be a string', 'INVALID_CONTENT_TYPE');
  }
  
  // Check for null bytes (potential injection)
  if (content.includes('\x00')) {
    throw new PathValidationError('Content contains null bytes', 'NULL_BYTE_INJECTION');
  }
  
  // Check size limit (default 10MB)
  const contentSize = Buffer.byteLength(content, 'utf8');
  if (contentSize > maxSize) {
    throw new PathValidationError(`Content exceeds maximum size of ${maxSize} bytes`, 'CONTENT_TOO_LARGE');
  }
}
