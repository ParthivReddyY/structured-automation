import { NextRequest, NextResponse } from 'next/server';
import { getDatabase, Collections } from '@/lib/mongodb';
import type { TodoModel } from '@/lib/models';

export const runtime = 'nodejs';


export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const completed = searchParams.get('completed');
    const priority = searchParams.get('priority');
    const category = searchParams.get('category');
    const limit = parseInt(searchParams.get('limit') || '50');
    const skip = parseInt(searchParams.get('skip') || '0');

    const db = await getDatabase();
    
    const filter: Record<string, unknown> = {};
    if (completed !== null) {
      filter.completed = completed === 'true';
    }
    if (priority) filter.priority = priority;
    if (category) filter.category = category;

   
    const todos = await db
      .collection<TodoModel>(Collections.TODOS)
      .find(filter)
      .sort({ dueDate: 1, priority: -1, createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .toArray();

    const total = await db
      .collection<TodoModel>(Collections.TODOS)
      .countDocuments(filter);

    return NextResponse.json({
      success: true,
      data: {
        todos,
        total,
        limit,
        skip,
      },
    });
  } catch (error) {
    console.error('Error fetching todos:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to fetch todos' 
      },
      { status: 500 }
    );
  }
}


export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      text,
      description,
      dueDate,
      priority = 'medium',
      category = 'general',
      estimatedTime,
      subtasks,
      sourceDocumentId,
      sourceTaskId,
    } = body;

    if (!text || text.trim() === '') {
      return NextResponse.json(
        { success: false, error: 'Todo text is required' },
        { status: 400 }
      );
    }

    const db = await getDatabase();
    const now = new Date();
    
    const newTodo: Omit<TodoModel, '_id'> = {
      id: `todo_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      text: text.trim(),
      description: description || '',
      completed: false,
      dueDate: dueDate ? new Date(dueDate) : undefined,
      priority,
      category,
      estimatedTime,
      subtasks: subtasks || [],
      sourceDocumentId,
      sourceTaskId,
      createdAt: now,
      updatedAt: now,
    };

    const result = await db
      .collection<TodoModel>(Collections.TODOS)
      .insertOne(newTodo as TodoModel);

    return NextResponse.json({
      success: true,
      data: {
        id: result.insertedId,
        todo: newTodo,
      },
    });
  } catch (error) {
    console.error('Error creating todo:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to create todo' 
      },
      { status: 500 }
    );
  }
}


export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Todo ID is required' },
        { status: 400 }
      );
    }

    const db = await getDatabase();
    
    updates.updatedAt = new Date();
    
    if (updates.completed === true && !updates.completedAt) {
      updates.completedAt = new Date();
    }
    
    if (updates.completed === false) {
      updates.completedAt = null;
    }

    const result = await db
      .collection<TodoModel>(Collections.TODOS)
      .updateOne(
        { id },
        { $set: updates }
      );

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { success: false, error: 'Todo not found' },
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
    console.error('Error updating todo:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to update todo' 
      },
      { status: 500 }
    );
  }
}


export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Todo ID is required' },
        { status: 400 }
      );
    }

    const db = await getDatabase();
    
    const result = await db
      .collection<TodoModel>(Collections.TODOS)
      .deleteOne({ id });

    if (result.deletedCount === 0) {
      return NextResponse.json(
        { success: false, error: 'Todo not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        deleted: result.deletedCount,
      },
    });
  } catch (error) {
    console.error('Error deleting todo:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to delete todo' 
      },
      { status: 500 }
    );
  }
}
