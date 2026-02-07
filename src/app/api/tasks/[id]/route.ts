import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { 
  getTask, 
  updateTask, 
  deleteTask,
  FileStoreError 
} from '@/lib/file-store';
import { PathValidationError, isValidUUID } from '@/lib/security';

// CORS headers for all responses
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

/**
 * Handle OPTIONS requests for CORS preflight
 */
export async function OPTIONS(): Promise<NextResponse> {
  return new NextResponse(null, {
    status: 204,
    headers: corsHeaders,
  });
}

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
        { status: 400, headers: corsHeaders }
      );
    }
    
    // Get task with timeout
    const timeoutPromise = new Promise<never>((_, reject) => 
      setTimeout(() => reject(new Error('Request timeout')), 10000)
    );
    const taskPromise = getTask(id);
    
    let task;
    try {
      task = await Promise.race([taskPromise, timeoutPromise]);
    } catch (timeoutError) {
      return NextResponse.json(
        { error: 'Request timeout', code: 'TIMEOUT' },
        { status: 504, headers: corsHeaders }
      );
    }
    
    return NextResponse.json({ task }, { headers: corsHeaders });
    
  } catch (error) {
    console.error(`GET /api/tasks/[id] error:`, error);
    
    if (error instanceof PathValidationError) {
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: 403, headers: corsHeaders }
      );
    }
    
    if (error instanceof FileStoreError) {
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: error.statusCode, headers: corsHeaders }
      );
    }
    
    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500, headers: corsHeaders }
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
        { status: 400, headers: corsHeaders }
      );
    }
    
    // Parse and validate request body
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: 'Invalid JSON body', code: 'INVALID_JSON' },
        { status: 400, headers: corsHeaders }
      );
    }
    
    const validationResult = UpdateTaskSchema.safeParse(body);
    
    if (!validationResult.success) {
      const errors = validationResult.error.issues.map(err => ({
        field: err.path.join('.'),
        message: err.message
      }));
      
      return NextResponse.json(
        { 
          error: 'Validation failed', 
          code: 'VALIDATION_ERROR',
          details: errors 
        },
        { status: 400, headers: corsHeaders }
      );
    }
    
    const updates = validationResult.data;
    
    // Update the task with timeout
    const timeoutPromise = new Promise<never>((_, reject) => 
      setTimeout(() => reject(new Error('Request timeout')), 10000)
    );
    const taskPromise = updateTask(id, updates);
    
    let task;
    try {
      task = await Promise.race([taskPromise, timeoutPromise]);
    } catch (timeoutError) {
      return NextResponse.json(
        { error: 'Request timeout', code: 'TIMEOUT' },
        { status: 504, headers: corsHeaders }
      );
    }
    
    return NextResponse.json({ task }, { headers: corsHeaders });
    
  } catch (error) {
    console.error(`PATCH /api/tasks/[id] error:`, error);
    
    if (error instanceof PathValidationError) {
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: 403, headers: corsHeaders }
      );
    }
    
    if (error instanceof FileStoreError) {
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: error.statusCode, headers: corsHeaders }
      );
    }
    
    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500, headers: corsHeaders }
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
        { status: 400, headers: corsHeaders }
      );
    }
    
    // Delete task with timeout
    const timeoutPromise = new Promise<never>((_, reject) => 
      setTimeout(() => reject(new Error('Request timeout')), 10000)
    );
    const deletePromise = deleteTask(id);
    
    try {
      await Promise.race([deletePromise, timeoutPromise]);
    } catch (timeoutError) {
      return NextResponse.json(
        { error: 'Request timeout', code: 'TIMEOUT' },
        { status: 504, headers: corsHeaders }
      );
    }
    
    return NextResponse.json(
      { 
        success: true,
        message: 'Task deleted successfully'
      },
      { status: 200, headers: corsHeaders }
    );
    
  } catch (error) {
    console.error(`DELETE /api/tasks/[id] error:`, error);
    
    if (error instanceof PathValidationError) {
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: 403, headers: corsHeaders }
      );
    }
    
    if (error instanceof FileStoreError) {
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: error.statusCode, headers: corsHeaders }
      );
    }
    
    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500, headers: corsHeaders }
    );
  }
}
