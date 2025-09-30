import { NextRequest, NextResponse } from 'next/server';
import { getDatabase, Collections } from '@/lib/mongodb';
import type { MailDraftModel } from '@/lib/models';

export const runtime = 'nodejs';

/**
 * GET /api/mails
 * Fetch mail drafts with optional filtering
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const category = searchParams.get('category');
    const priority = searchParams.get('priority');
    const limit = parseInt(searchParams.get('limit') || '50');
    const skip = parseInt(searchParams.get('skip') || '0');

    const db = await getDatabase();
    
    // Build filter
    const filter: Record<string, unknown> = {};
    if (status) filter.status = status;
    if (category) filter.category = category;
    if (priority) filter.priority = priority;

    // Fetch mail drafts
    const drafts = await db
      .collection<MailDraftModel>(Collections.MAIL_DRAFTS)
      .find(filter)
      .sort({ generatedAt: -1 })
      .skip(skip)
      .limit(limit)
      .toArray();

    const total = await db
      .collection<MailDraftModel>(Collections.MAIL_DRAFTS)
      .countDocuments(filter);

    return NextResponse.json({
      success: true,
      data: {
        drafts,
        total,
        limit,
        skip,
      },
    });
  } catch (error) {
    console.error('Error fetching mail drafts:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to fetch mail drafts' 
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/mails
 * Create new mail draft
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      to,
      subject,
      body: emailBody,
      context,
      tone = 'professional',
      priority = 'medium',
      category = 'general',
      sourceDocumentId,
      sourceTaskId,
    } = body;

    if (!subject || !emailBody) {
      return NextResponse.json(
        { success: false, error: 'Subject and body are required' },
        { status: 400 }
      );
    }

    const db = await getDatabase();
    const now = new Date();
    
    const newDraft: Omit<MailDraftModel, '_id'> = {
      id: `mail_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      to,
      subject,
      body: emailBody,
      context: context || 'Generated from document processing',
      tone,
      priority,
      category,
      status: 'draft',
      sourceDocumentId,
      sourceTaskId,
      generatedAt: now,
      createdAt: now,
      updatedAt: now,
    };

    const result = await db
      .collection<MailDraftModel>(Collections.MAIL_DRAFTS)
      .insertOne(newDraft as MailDraftModel);

    return NextResponse.json({
      success: true,
      data: {
        id: result.insertedId,
        draft: newDraft,
      },
    });
  } catch (error) {
    console.error('Error creating mail draft:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to create mail draft' 
      },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/mails
 * Update mail draft status or content
 */
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { draftId, updates } = body;

    if (!draftId) {
      return NextResponse.json(
        { success: false, error: 'Draft ID is required' },
        { status: 400 }
      );
    }

    const db = await getDatabase();
    
    // Add updatedAt timestamp
    updates.updatedAt = new Date();
    
    // Add sentAt timestamp if status is being changed to 'sent'
    if (updates.status === 'sent' && !updates.sentAt) {
      updates.sentAt = new Date();
    }

    const result = await db
      .collection<MailDraftModel>(Collections.MAIL_DRAFTS)
      .updateOne(
        { id: draftId },
        { $set: updates }
      );

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { success: false, error: 'Mail draft not found' },
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
    console.error('Error updating mail draft:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to update mail draft' 
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/mails
 * Delete a mail draft
 */
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Mail ID is required' },
        { status: 400 }
      );
    }

    const db = await getDatabase();
    
    const result = await db
      .collection<MailDraftModel>(Collections.MAIL_DRAFTS)
      .deleteOne({ id });

    if (result.deletedCount === 0) {
      return NextResponse.json(
        { success: false, error: 'Mail draft not found' },
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
    console.error('Error deleting mail draft:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to delete mail draft' 
      },
      { status: 500 }
    );
  }
}
