import { NextRequest, NextResponse } from 'next/server';
import { getDatabase, Collections } from '@/lib/mongodb';
import { ActivityModel } from '@/lib/models';
import { auth } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    const searchParams = request.nextUrl.searchParams;
    const type = searchParams.get('type'); 
    const limit = parseInt(searchParams.get('limit') || '50');
    const skip = parseInt(searchParams.get('skip') || '0');

    const db = await getDatabase();
    const collection = db.collection<ActivityModel>(Collections.ACTIVITIES);

    interface QueryFilter {
      userId?: string;
      type?: 'task' | 'event' | 'mail' | 'todo';
    }
    const query: QueryFilter = {};
    if (session?.user?.email) {
      query.userId = session.user.email;
    }
    if (type && type !== 'all') {
      query.type = type as 'task' | 'event' | 'mail' | 'todo';
    }
    const activities = await collection
      .find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .toArray();

    const total = await collection.countDocuments(query);

    return NextResponse.json({
      success: true,
      activities,
      total,
      page: Math.floor(skip / limit) + 1,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error('Failed to fetch activities:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch activities' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    const body = await request.json();
    
    const {
      type,
      title,
      count,
      userPrompt,
      actionMode,
      files,
      results,
      sessionId,
    } = body;

    if (!type || !title || count === undefined || !userPrompt || !results) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const db = await getDatabase();
    const collection = db.collection<ActivityModel>(Collections.ACTIVITIES);

    const activity: Omit<ActivityModel, '_id'> = {
      id: `activity_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      title,
      count,
      userPrompt,
      actionMode,
      files: files || [],
      results,
      userId: session?.user?.email || undefined,
      sessionId,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await collection.insertOne(activity as ActivityModel);

    return NextResponse.json({
      success: true,
      activityId: result.insertedId,
      activity,
    });
  } catch (error) {
    console.error('Failed to create activity:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create activity' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();
    const searchParams = request.nextUrl.searchParams;
    const activityId = searchParams.get('id');

    if (!activityId) {
      return NextResponse.json(
        { success: false, error: 'Activity ID is required' },
        { status: 400 }
      );
    }

    const db = await getDatabase();
    const collection = db.collection<ActivityModel>(Collections.ACTIVITIES);

    interface DeleteFilter {
      id: string;
      userId?: string;
    }
    const query: DeleteFilter = { id: activityId };
    if (session?.user?.email) {
      query.userId = session.user.email;
    }

    const result = await collection.deleteOne(query);

    if (result.deletedCount === 0) {
      return NextResponse.json(
        { success: false, error: 'Activity not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Activity deleted successfully',
    });
  } catch (error) {
    console.error('Failed to delete activity:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete activity' },
      { status: 500 }
    );
  }
}
