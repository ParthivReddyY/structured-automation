import { NextRequest, NextResponse } from 'next/server';
import { ai, geminiFlash, mistralSmall } from '@/lib/genkit';
import { getDatabase, Collections } from '@/lib/mongodb';
import { taskToDocument } from '@/lib/models';
import type { 
  ProcessTextRequest, 
  ProcessingResponse, 
  TasksExtraction, 
  DocumentSummary, 
  Metadata,
  IntentDetection,
  CalendarEvent,
  MailDraft,
  TodoItem
} from '@/types/ai-schemas';
import type { 
  DocumentModel, 
  ProcessingLogModel, 
  CalendarEventModel, 
  MailDraftModel, 
  TodoModel 
} from '@/lib/models';

export const runtime = 'nodejs';
export const maxDuration = 60;

// Helper function to make AI calls with retry logic and fallback
async function generateWithFallback(prompt: string | object[], retries = 2) {
  let lastError: Error | null = null;
  
  // Try with Gemini first (more reliable)
  for (let i = 0; i <= retries; i++) {
    try {
      const response = await ai.generate({
        model: geminiFlash,
        prompt,
        config: { temperature: 0.3 },
      });
      return response;
    } catch (error) {
      console.warn(`Gemini attempt ${i + 1} failed:`, error instanceof Error ? error.message : error);
      lastError = error instanceof Error ? error : new Error(String(error));
      
      // Wait before retry (exponential backoff)
      if (i < retries) {
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, i) * 1000));
      }
    }
  }
  
  // If Gemini fails, try Mistral as fallback
  try {
    console.log('Falling back to Mistral...');
    const response = await ai.generate({
      model: mistralSmall,
      prompt,
      config: { temperature: 0.3 },
    });
    return response;
  } catch (error) {
    console.error('Mistral fallback also failed:', error);
    throw lastError || error;
  }
}

// Helper function to extract JSON from AI responses that may include extra text
function extractJSON(text: string): unknown {
  // Try to find JSON in markdown code blocks
  const codeBlockMatch = text.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/);
  if (codeBlockMatch) {
    return JSON.parse(codeBlockMatch[1]);
  }
  
  // Try to find raw JSON object
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    return JSON.parse(jsonMatch[0]);
  }
  
  // Fallback to direct parse
  return JSON.parse(text);
}

export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    const body: ProcessTextRequest = await request.json();
    const { 
      text, 
      provider = 'gemini',
      extractTasks = true,
      generateSummary = true,
      extractMetadata = true
    } = body;

    if (!text || text.trim().length === 0) {
      return NextResponse.json<ProcessingResponse>(
        { success: false, error: 'Text content is required' },
        { status: 400 }
      );
    }

    const result: Partial<{
      intent: IntentDetection;
      tasks: TasksExtraction;
      summary: DocumentSummary;
      metadata: Metadata;
      calendarEvents: CalendarEvent[];
      mailDrafts: MailDraft[];
      todoItems: TodoItem[];
    }> = {};

    // Step 1: Detect intent first to determine what entities to generate
    const intentResponse = await generateWithFallback(`Analyze the following text and detect the primary intent and what actions should be taken.

IMPORTANT: Return ONLY valid JSON, no additional text, explanations, or markdown formatting.

Detect the intent type (meeting, customer_support, personal_task, meeting_notes, send_report, reminder, support_documentation), confidence score (0-1), and routing targets (which tabs should receive this: actions, calendar, mails, todos).

Routing Rules:
- "meeting" → calendar + actions
- "customer_support" → mails + actions
- "personal_task" → todos + calendar (if has due date)
- "meeting_notes" → actions + calendar
- "send_report" → mails + actions
- "reminder" → calendar + todos
- "support_documentation" → actions

JSON structure (respond with ONLY this JSON, nothing else):
{
  "intent": "meeting" | "customer_support" | "personal_task" | "meeting_notes" | "send_report" | "reminder" | "support_documentation",
  "confidence": number (0-1),
  "routingTargets": ["actions" | "calendar" | "mails" | "todos"]
}

Text:
${text}`);

    const intentParsed = extractJSON(intentResponse.text);
    result.intent = intentParsed as IntentDetection;

    // Step 2: Based on intent, generate appropriate entities
    const routingTargets = result.intent?.routingTargets || [];

    // Generate calendar events if routing to calendar
    if (routingTargets.includes('calendar')) {
      const currentDate = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
      const currentYear = new Date().getFullYear();
      const currentMonth = new Date().getMonth() + 1;
      
      const calendarResponse = await generateWithFallback(`Extract calendar events from the following text.

IMPORTANT CONTEXT: Today's date is ${currentDate} (${currentYear}-${currentMonth.toString().padStart(2, '0')}).

When extracting dates:
- If only a day is mentioned (e.g., "15th"), use the current month and year: ${currentYear}-${currentMonth.toString().padStart(2, '0')}-15
- If "next week" is mentioned, add 7 days to today's date
- If "tomorrow" is mentioned, use ${new Date(Date.now() + 86400000).toISOString().split('T')[0]}
- If "next month" is mentioned, use next month: ${new Date(currentYear, currentMonth, 1).toISOString().split('T')[0]}
- For relative dates like "in 3 days", calculate from ${currentDate}
- If a month is mentioned without a year, use ${currentYear}
- Always output dates in YYYY-MM-DD format

IMPORTANT: Return ONLY valid JSON, no additional text, explanations, or markdown formatting.

Extract meeting/event title, description, dates, times, location, attendees, priority, and reminders.

JSON structure (respond with ONLY this JSON, nothing else):
{
  "events": [{
    "title": "string",
    "description": "string" (optional),
    "startDate": "YYYY-MM-DD",
    "startTime": "HH:MM" (optional),
    "endDate": "YYYY-MM-DD" (optional),
    "endTime": "HH:MM" (optional),
    "location": "string" (optional),
    "attendees": ["string"] (optional),
    "priority": "low" | "medium" | "high",
    "reminders": ["string"] (optional)
  }]
}

Text:
${text}`);

      const calendarParsed = extractJSON(calendarResponse.text) as { events: CalendarEvent[] };
      result.calendarEvents = calendarParsed.events || [];
    }

    // Generate mail drafts if routing to mails
    if (routingTargets.includes('mails')) {
      const mailResponse = await generateWithFallback(`Generate email drafts based on the following text.

IMPORTANT: Return ONLY valid JSON, no additional text, explanations, or markdown formatting.

Create appropriate email drafts with recipient (if mentioned), subject, body, tone, priority, and category.

JSON structure (respond with ONLY this JSON, nothing else):
{
  "drafts": [{
    "to": "string" (optional),
    "subject": "string",
    "body": "string",
    "context": "string",
    "tone": "formal" | "casual" | "professional" | "friendly",
    "priority": "low" | "medium" | "high",
    "category": "customer_support" | "project_update" | "meeting_invitation" | "general"
  }]
}

Text:
${text}`);

      const mailParsed = extractJSON(mailResponse.text) as { drafts: MailDraft[] };
      result.mailDrafts = mailParsed.drafts || [];
    }

    // Generate todos if routing to todos
    if (routingTargets.includes('todos')) {
      const currentDate = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
      const currentYear = new Date().getFullYear();
      const currentMonth = new Date().getMonth() + 1;
      
      const todoResponse = await generateWithFallback(`Extract todo items from the following text.

IMPORTANT CONTEXT: Today's date is ${currentDate} (${currentYear}-${currentMonth.toString().padStart(2, '0')}).

When extracting due dates:
- If only a day is mentioned (e.g., "by the 15th"), use the current month and year: ${currentYear}-${currentMonth.toString().padStart(2, '0')}-15
- If "by next week" is mentioned, add 7 days to today's date
- If "by tomorrow" is mentioned, use ${new Date(Date.now() + 86400000).toISOString().split('T')[0]}
- If "by end of month" is mentioned, use the last day of current month
- For relative dates like "in 3 days", calculate from ${currentDate}
- If a month is mentioned without a year, use ${currentYear}
- Always output dates in YYYY-MM-DD format

IMPORTANT: Return ONLY valid JSON, no additional text, explanations, or markdown formatting.

Extract simple actionable todo items with title, description, due date, priority, category, estimated time, and subtasks.

JSON structure (respond with ONLY this JSON, nothing else):
{
  "items": [{
    "title": "string",
    "description": "string" (optional),
    "dueDate": "YYYY-MM-DD" (optional),
    "priority": "low" | "medium" | "high",
    "category": "string" (optional),
    "estimatedTime": "string" (optional),
    "subtasks": ["string"] (optional)
  }]
}

Text:
${text}`);

      const todoParsed = extractJSON(todoResponse.text) as { items: TodoItem[] };
      result.todoItems = todoParsed.items || [];
    }

    // Extract tasks if requested (original functionality for actions tab)
    if (extractTasks) {
      const tasksResponse = await generateWithFallback(`Analyze the following text and extract all actionable tasks, action items, or to-do items.

IMPORTANT: Return ONLY valid JSON, no additional text, explanations, or markdown formatting.

For each task, provide a clear title, description, priority level, category, estimated time if applicable, and relevant tags.

JSON structure (respond with ONLY this JSON, nothing else):
{
  "tasks": [{"id": "string", "title": "string", "description": "string", "priority": "low"|"medium"|"high"|"urgent", "category": "string", "estimatedTime": "string" (optional), "dependencies": ["string"] (optional), "tags": ["string"] (optional)}],
  "totalCount": number,
  "categories": ["string"]
}
        
Text:
${text}`);
      
      const parsed = extractJSON(tasksResponse.text);
      result.tasks = parsed as TasksExtraction;
    }

    // Generate summary if requested
    if (generateSummary) {
      const summaryResponse = await generateWithFallback(`Analyze the following text and create a comprehensive summary.

IMPORTANT: Return ONLY valid JSON, no additional text, explanations, or markdown formatting.

Include the main title/topic, a detailed summary, key points, topics covered, action items, and overall sentiment.

JSON structure (respond with ONLY this JSON, nothing else):
{
  "title": "string",
  "summary": "string",
  "keyPoints": ["string"],
  "topics": ["string"],
  "actionItems": ["string"],
  "sentiment": "positive" | "negative" | "neutral" | "mixed"
}
        
Text:
${text}`);

      const parsed = extractJSON(summaryResponse.text);
      result.summary = parsed as DocumentSummary;
    }

    // Extract metadata if requested
    if (extractMetadata) {
      const metadataResponse = await generateWithFallback(`Analyze the following text and extract relevant metadata.

IMPORTANT: Return ONLY valid JSON, no additional text, explanations, or markdown formatting.

Identify the document type, date references, people mentioned, organizations, locations, URLs, and urgency level.

JSON structure (respond with ONLY this JSON, nothing else):
{
  "documentType": "string",
  "dateReferences": ["string"] (optional),
  "people": ["string"] (optional),
  "organizations": ["string"] (optional),
  "locations": ["string"] (optional),
  "urls": ["string"] (optional),
  "urgency": "low" | "medium" | "high"
}
        
Text:
${text}`);

      const parsed = extractJSON(metadataResponse.text);
      result.metadata = parsed as Metadata;
    }

    const processingTime = Date.now() - startTime;

    // Save to MongoDB
    try {
      const db = await getDatabase();
      
      // Create document record
      const documentRecord: Omit<DocumentModel, '_id'> = {
        fileName: 'Text Input',
        fileType: 'text/plain',
        contentType: 'text',
        originalContent: text.substring(0, 5000), // Store first 5000 chars
        summary: result.summary,
        metadata: result.metadata,
        extractedTaskIds: [],
        processingStatus: 'completed',
        processingTime,
        provider,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const docResult = await db.collection(Collections.DOCUMENTS).insertOne(documentRecord);
      const documentId = docResult.insertedId.toString();

      // Save extracted tasks if any
      if (result.tasks && result.tasks.tasks.length > 0) {
        const taskDocuments = result.tasks.tasks.map(task => 
          taskToDocument(task, documentId)
        );
        await db.collection(Collections.TASKS).insertMany(taskDocuments);
        
        // Update document with task IDs
        const taskIds = result.tasks.tasks.map(t => t.id);
        await db.collection(Collections.DOCUMENTS).updateOne(
          { _id: docResult.insertedId },
          { $set: { extractedTaskIds: taskIds } }
        );
      }

      // Save calendar events if any
      if (result.calendarEvents && result.calendarEvents.length > 0) {
        const eventDocuments = result.calendarEvents.map(event => {
          const eventDoc: Omit<CalendarEventModel, '_id'> = {
            id: `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            title: event.title,
            description: event.description,
            startDate: new Date(event.startDate),
            startTime: event.startTime,
            endDate: event.endDate ? new Date(event.endDate) : undefined,
            endTime: event.endTime,
            location: event.location,
            attendees: event.attendees,
            priority: event.priority,
            status: 'scheduled',
            reminders: event.reminders,
            sourceDocumentId: documentId,
            confidence: result.intent?.confidence,
            createdAt: new Date(),
            updatedAt: new Date(),
          };
          return eventDoc;
        });
        await db.collection(Collections.CALENDAR_EVENTS).insertMany(eventDocuments as CalendarEventModel[]);
      }

      // Save mail drafts if any
      if (result.mailDrafts && result.mailDrafts.length > 0) {
        const mailDocuments = result.mailDrafts.map(draft => {
          const mailDoc: Omit<MailDraftModel, '_id'> = {
            id: `mail_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            to: draft.to,
            subject: draft.subject,
            body: draft.body,
            context: draft.context,
            tone: draft.tone,
            priority: draft.priority,
            category: draft.category,
            status: 'draft',
            sourceDocumentId: documentId,
            confidence: result.intent?.confidence,
            generatedAt: new Date(),
            createdAt: new Date(),
            updatedAt: new Date(),
          };
          return mailDoc;
        });
        await db.collection(Collections.MAIL_DRAFTS).insertMany(mailDocuments as MailDraftModel[]);
      }

      // Save todos if any
      if (result.todoItems && result.todoItems.length > 0) {
        const todoDocuments = result.todoItems.map(item => {
          const todoDoc: Omit<TodoModel, '_id'> = {
            id: `todo_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            text: item.title,
            description: item.description,
            completed: false,
            dueDate: item.dueDate ? new Date(item.dueDate) : undefined,
            priority: item.priority,
            category: item.category,
            estimatedTime: item.estimatedTime,
            subtasks: item.subtasks,
            sourceDocumentId: documentId,
            createdAt: new Date(),
            updatedAt: new Date(),
          };
          return todoDoc;
        });
        await db.collection(Collections.TODOS).insertMany(todoDocuments as TodoModel[]);
      }

      // Create processing log
      const processingLog: Omit<ProcessingLogModel, '_id'> = {
        documentId,
        processingType: 'full-processing',
        provider,
        processingTime,
        status: 'success',
        extractedData: {
          tasksCount: result.tasks?.totalCount || 0,
          summary: !!result.summary,
          metadata: !!result.metadata,
        },
        timestamp: new Date(),
      };
      await db.collection(Collections.PROCESSING_LOGS).insertOne(processingLog);

    } catch (dbError) {
      console.error('Error saving to MongoDB:', dbError);
      // Continue anyway - don't fail the request if DB save fails
    }

    return NextResponse.json<ProcessingResponse>({
      success: true,
      data: {
        ...result,
        processingTimestamp: new Date().toISOString(),
        provider,
      },
      processingTime,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to process text';
    console.error('Error processing text:', error);
    return NextResponse.json<ProcessingResponse>(
      { 
        success: false, 
        error: errorMessage,
        processingTime: Date.now() - startTime
      },
      { status: 500 }
    );
  }
}

