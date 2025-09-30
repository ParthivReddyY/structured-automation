import { NextRequest, NextResponse } from 'next/server';
import { getDatabase, Collections } from '@/lib/mongodb';
import type { ProcessingLogModel } from '@/lib/models';

export const runtime = 'nodejs';

/**
 * GET /api/processing-logs
 * Fetch processing logs
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = parseInt(searchParams.get('skip') || '0');

    const db = await getDatabase();
    
    // Build filter
    const filter: Record<string, unknown> = {};
    if (status) filter.status = status;

    // Fetch logs
    const logs = await db
      .collection<ProcessingLogModel>(Collections.PROCESSING_LOGS)
      .find(filter)
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(limit)
      .toArray();

    const total = await db
      .collection<ProcessingLogModel>(Collections.PROCESSING_LOGS)
      .countDocuments(filter);

    return NextResponse.json({
      success: true,
      data: {
        logs,
        total,
        limit,
        skip,
      },
    });
  } catch (error) {
    console.error('Error fetching processing logs:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to fetch processing logs' 
      },
      { status: 500 }
    );
  }
}
