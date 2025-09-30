import { NextRequest, NextResponse } from 'next/server';
import { getDatabase, Collections } from '@/lib/mongodb';
import type { DocumentModel } from '@/lib/models';

export const runtime = 'nodejs';

/**
 * GET /api/documents
 * Fetch all documents with optional filtering
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const contentType = searchParams.get('contentType');
    const limit = parseInt(searchParams.get('limit') || '50');
    const skip = parseInt(searchParams.get('skip') || '0');

    const db = await getDatabase();
    
    // Build filter
    const filter: Record<string, unknown> = {};
    if (status) filter.processingStatus = status;
    if (contentType) filter.contentType = contentType;

    // Fetch documents
    const documents = await db
      .collection<DocumentModel>(Collections.DOCUMENTS)
      .find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .toArray();

    const total = await db
      .collection<DocumentModel>(Collections.DOCUMENTS)
      .countDocuments(filter);

    return NextResponse.json({
      success: true,
      data: {
        documents,
        total,
        limit,
        skip,
      },
    });
  } catch (error) {
    console.error('Error fetching documents:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to fetch documents' 
      },
      { status: 500 }
    );
  }
}
