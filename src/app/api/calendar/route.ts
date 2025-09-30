import { NextRequest, NextResponse } from 'next/server';
import { getDatabase, Collections } from '@/lib/mongodb';
import type { CalendarEventModel } from '@/lib/models';

export const runtime = 'nodejs';

/**
 * GET /api/calendar
 * Fetch calendar events with optional date filtering
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const priority = searchParams.get('priority');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const limit = parseInt(searchParams.get('limit') || '100');
    const skip = parseInt(searchParams.get('skip') || '0');

    const db = await getDatabase();
    
    // Build filter
    const filter: Record<string, unknown> = {};
    if (status) filter.status = status;
    if (priority) filter.priority = priority;
    
    // Date range filtering - fix MongoDB date comparison
    if (startDate || endDate) {
      filter.startDate = {};
      if (startDate) {
        // Convert to Date object for proper MongoDB comparison
        (filter.startDate as Record<string, unknown>).$gte = new Date(startDate);
      }
      if (endDate) {
        // Convert to Date object for proper MongoDB comparison
        (filter.startDate as Record<string, unknown>).$lte = new Date(endDate);
      }
    }

    console.log('Calendar filter:', JSON.stringify(filter, null, 2));

    // Fetch events - convert to plain objects
    const events = await db
      .collection<CalendarEventModel>(Collections.CALENDAR_EVENTS)
      .find(filter)
      .sort({ startDate: 1 })
      .skip(skip)
      .limit(limit)
      .toArray();

    console.log('Found events:', events.length);

    // Convert MongoDB dates to ISO strings for JSON serialization
    const serializedEvents = events.map(event => ({
      ...event,
      _id: event._id?.toString(),
      startDate: event.startDate.toISOString(),
      endDate: event.endDate ? event.endDate.toISOString() : undefined,
      createdAt: event.createdAt.toISOString(),
      updatedAt: event.updatedAt.toISOString(),
    }));

    const total = await db
      .collection<CalendarEventModel>(Collections.CALENDAR_EVENTS)
      .countDocuments(filter);

    return NextResponse.json({
      success: true,
      data: {
        events: serializedEvents,
        total,
        limit,
        skip,
      },
    });
  } catch (error) {
    console.error('Error fetching calendar events:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to fetch calendar events' 
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/calendar
 * Create new calendar event
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      title,
      description,
      startDate,
      startTime,
      endDate,
      endTime,
      location,
      attendees,
      priority = 'medium',
      reminders,
      sourceDocumentId,
      sourceTaskId,
    } = body;

    if (!title || !startDate) {
      return NextResponse.json(
        { success: false, error: 'Title and start date are required' },
        { status: 400 }
      );
    }

    const db = await getDatabase();
    const now = new Date();
    
    const newEvent: Omit<CalendarEventModel, '_id'> = {
      id: `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      title,
      description,
      startDate: new Date(startDate),
      startTime,
      endDate: endDate ? new Date(endDate) : undefined,
      endTime,
      location,
      attendees,
      priority,
      status: 'scheduled',
      reminders,
      sourceDocumentId,
      sourceTaskId,
      createdAt: now,
      updatedAt: now,
    };

    const result = await db
      .collection<CalendarEventModel>(Collections.CALENDAR_EVENTS)
      .insertOne(newEvent as CalendarEventModel);

    return NextResponse.json({
      success: true,
      data: {
        id: result.insertedId,
        event: newEvent,
      },
    });
  } catch (error) {
    console.error('Error creating calendar event:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to create calendar event' 
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
        { success: false, error: 'Event ID is required' },
        { status: 400 }
      );
    }

    const db = await getDatabase();
    
    
    updates.updatedAt = new Date();

    const result = await db
      .collection<CalendarEventModel>(Collections.CALENDAR_EVENTS)
      .updateOne(
        { id },
        { $set: updates }
      );

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { success: false, error: 'Event not found' },
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
    console.error('Error updating calendar event:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to update calendar event' 
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
        { success: false, error: 'Event ID is required' },
        { status: 400 }
      );
    }

    const db = await getDatabase();
    
    const result = await db
      .collection<CalendarEventModel>(Collections.CALENDAR_EVENTS)
      .deleteOne({ id });

    if (result.deletedCount === 0) {
      return NextResponse.json(
        { success: false, error: 'Event not found' },
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
    console.error('Error deleting calendar event:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to delete calendar event' 
      },
      { status: 500 }
    );
  }
}
