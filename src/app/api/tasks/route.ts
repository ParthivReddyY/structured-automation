import { NextRequest, NextResponse } from 'next/server';
import { getDatabase, Collections } from '@/lib/mongodb';
import type { TaskDocument } from '@/lib/models';

export const runtime = 'nodejs';

/**
 * GET /api/tasks
 * Fetch all tasks with optional filtering
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const priority = searchParams.get('priority');
    const limit = parseInt(searchParams.get('limit') || '50');
    const skip = parseInt(searchParams.get('skip') || '0');

    const db = await getDatabase();
    
    // Build filter
    const filter: Record<string, unknown> = {};
    if (status) filter.status = status;
    if (priority) filter.priority = priority;

    // Fetch tasks
    const tasks = await db
      .collection<TaskDocument>(Collections.TASKS)
      .find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .toArray();

    const total = await db
      .collection<TaskDocument>(Collections.TASKS)
      .countDocuments(filter);

    return NextResponse.json({
      success: true,
      data: {
        tasks,
        total,
        limit,
        skip,
      },
    });
  } catch (error) {
    console.error('Error fetching tasks:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to fetch tasks' 
      },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/tasks
 * Update task status or details
 */
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { taskId, updates } = body;

    if (!taskId) {
      return NextResponse.json(
        { success: false, error: 'Task ID is required' },
        { status: 400 }
      );
    }

    const db = await getDatabase();
    
    // Add updatedAt timestamp
    updates.updatedAt = new Date();

    const result = await db
      .collection<TaskDocument>(Collections.TASKS)
      .updateOne(
        { id: taskId },
        { $set: updates }
      );

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { success: false, error: 'Task not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        modified: result.modifiedCount,
      },
    });
  } catch (error) {
    console.error('Error updating task:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to update task' 
      },
      { status: 500 }
    );
  }
}
