import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { 
  listTasks, 
  createTask, 
  FileStoreError,
  Task 
} from '@/lib/file-store';
import { PathValidationError } from '@/lib/security';

/**
 * GET /api/tasks
 * List all tasks with optional pagination
 * Query params:
 *   - page: number (default: 1)
 *   - limit: number (default: 50, max: 100)
 *   - status: 'todo' | 'in-progress' | 'done' (optional filter)
 *   - project: string (optional filter)
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '50', 10)));
    const statusFilter = searchParams.get('status');
    const projectFilter = searchParams.get('project');
    
    // Get all tasks
    let tasks = await listTasks();
    
    // Apply filters
    if (statusFilter) {
      const validStatuses = ['todo', 'in-progress', 'done'];
      if (!validStatuses.includes(statusFilter)) {
        return NextResponse.json(
          { 
            error: 'Invalid status filter',
            code: 'INVALID_STATUS',
            validValues: validStatuses
          },
          { status: 400 }
        );
      }
      tasks = tasks.filter(task => task.status === statusFilter);
    }
    
    if (projectFilter) {
      tasks = tasks.filter(task => task.project === projectFilter);
    }
    
    // Calculate pagination
    const total = tasks.length;
    const totalPages = Math.ceil(total / limit);
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedTasks = tasks.slice(startIndex, endIndex);
    
    return NextResponse.json({
      tasks: paginatedTasks,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      }
    });
    
  } catch (error) {
    console.error('GET /api/tasks error:', error);
    
    if (error instanceof PathValidationError) {
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: 403 }
      );
    }
    
    if (error instanceof FileStoreError) {
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: error.statusCode }
      );
    }
    
    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/tasks
 * Create a new task
 * Body: { title, slug?, status?, project?, content? }
 */
const CreateTaskSchema = z.object({
  title: z.string().min(1).max(200),
  slug: z.string().min(1).max(100).regex(/^[a-z0-9-]+$/).optional(),
  status: z.enum(['todo', 'in-progress', 'done']).default('todo'),
  project: z.string().min(1).max(50).default('default'),
  content: z.string().max(100000).default('')
});

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    // Parse and validate request body
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: 'Invalid JSON body', code: 'INVALID_JSON' },
        { status: 400 }
      );
    }
    
    const validationResult = CreateTaskSchema.safeParse(body);
    
    if (!validationResult.success) {
      const errors = validationResult.error.errors.map(err => ({
        field: err.path.join('.'),
        message: err.message
      }));
      
      return NextResponse.json(
        { 
          error: 'Validation failed', 
          code: 'VALIDATION_ERROR',
          details: errors 
        },
        { status: 400 }
      );
    }
    
    const data = validationResult.data;
    
    // Generate slug from title if not provided
    const slug = data.slug || data.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
    
    // Create the task
    const task = await createTask({
      title: data.title,
      slug,
      status: data.status,
      project: data.project,
      content: data.content
    });
    
    return NextResponse.json(
      { task },
      { 
        status: 201,
        headers: {
          'Location': `/api/tasks/${task.id}`
        }
      }
    );
    
  } catch (error) {
    console.error('POST /api/tasks error:', error);
    
    if (error instanceof PathValidationError) {
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: 403 }
      );
    }
    
    if (error instanceof FileStoreError) {
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: error.statusCode }
      );
    }
    
    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}
