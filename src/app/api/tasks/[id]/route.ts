import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { 
  getTask, 
  updateTask, 
  deleteTask,
  FileStoreError 
} from '@/lib/file-store';
import { PathValidationError, isValidUUID } from '@/lib/security';

/**
 * GET /api/tasks/[id]
 * Get a single task by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const { id } = await params;
    
    // Validate task ID format (UUID)
    if (!isValidUUID(id)) {
      return NextResponse.json(
        { 
          error: 'Invalid task ID format - must be UUID',
          code: 'INVALID_UUID'
        },
        { status: 400 }
      );
    }
    
    const task = await getTask(id);
    
    return NextResponse.json({ task });
    
  } catch (error) {
    console.error(`GET /api/tasks/[id] error:`, error);
    
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
 * PATCH /api/tasks/[id]
 * Update a task (partial update)
 * Body: { title?, slug?, status?, project?, content? }
 */
const UpdateTaskSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  slug: z.string().min(1).max(100).regex(/^[a-z0-9-]+$/).optional(),
  status: z.enum(['todo', 'in-progress', 'done']).optional(),
  project: z.string().min(1).max(50).optional(),
  content: z.string().max(100000).optional()
}).refine(data => Object.keys(data).length > 0, {
  message: 'At least one field must be provided for update'
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const { id } = await params;
    
    // Validate task ID format (UUID)
    if (!isValidUUID(id)) {
      return NextResponse.json(
        { 
          error: 'Invalid task ID format - must be UUID',
          code: 'INVALID_UUID'
        },
        { status: 400 }
      );
    }
    
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
    
    const validationResult = UpdateTaskSchema.safeParse(body);
    
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
    
    const updates = validationResult.data;
    
    // Update the task
    const task = await updateTask(id, updates);
    
    return NextResponse.json({ task });
    
  } catch (error) {
    console.error(`PATCH /api/tasks/[id] error:`, error);
    
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
 * DELETE /api/tasks/[id]
 * Delete a task by ID
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const { id } = await params;
    
    // Validate task ID format (UUID)
    if (!isValidUUID(id)) {
      return NextResponse.json(
        { 
          error: 'Invalid task ID format - must be UUID',
          code: 'INVALID_UUID'
        },
        { status: 400 }
      );
    }
    
    await deleteTask(id);
    
    return NextResponse.json(
      { 
        success: true,
        message: 'Task deleted successfully'
      },
      { status: 200 }
    );
    
  } catch (error) {
    console.error(`DELETE /api/tasks/[id] error:`, error);
    
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
