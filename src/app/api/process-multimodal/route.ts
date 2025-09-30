// Using Mistral Pixtral for multimodal processing - excellent OCR and document parsing
import { NextRequest, NextResponse } from 'next/server';
import { ai, pixtral, gemini20FlashExp } from '@/lib/genkit';
import { getDatabase, Collections } from '@/lib/mongodb';
import { taskToDocument } from '@/lib/models';
import type { 
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
  ProcessingLogModel
} from '@/lib/models';

export const runtime = 'nodejs';
export const maxDuration = 60;

async function generateWithFallback(prompt: string | object[], retries = 2) {
  let lastError: Error | null = null;
  
  for (let i = 0; i <= retries; i++) {
    try {
      const response = await ai.generate({
        model: gemini20FlashExp,
        prompt,
        config: { temperature: 0.3 },
      });
      return response;
    } catch (error) {
      console.warn(`Gemini attempt ${i + 1} failed:`, error instanceof Error ? error.message : error);
      lastError = error instanceof Error ? error : new Error(String(error));
      
      if (i < retries) {
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, i) * 1000));
      }
    }
  }
  
  try {
    console.log('Falling back to Pixtral...');
    const response = await ai.generate({
      model: pixtral,
      prompt,
      config: { temperature: 0.3 },
    });
    return response;
  } catch (error) {
    console.error('Pixtral fallback also failed:', error);
    throw lastError || error;
  }
}


function extractJSON(text: string): unknown {
  const codeBlockMatch = text.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/);
  if (codeBlockMatch) {
    return JSON.parse(codeBlockMatch[1]);
  }

  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    return JSON.parse(jsonMatch[0]);
  }

  return JSON.parse(text);
}

interface ProcessMultimodalRequest {
  fileBase64: string;
  fileName: string;
  mimeType: string;
  provider?: 'gemini' | 'mistral';
  extractTasks?: boolean;
  generateSummary?: boolean;
  extractMetadata?: boolean;
}

export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    const body: ProcessMultimodalRequest = await request.json();
    const { 
      fileBase64, 
      fileName,
      mimeType,
      provider = 'gemini',
      extractTasks = true,
      generateSummary = true,
      extractMetadata = true
    } = body;

    if (!fileBase64 || fileBase64.trim().length === 0) {
      return NextResponse.json<ProcessingResponse>(
        { success: false, error: 'File data is required' },
        { status: 400 }
      );
    }

    const supportedTypes = [
      'application/pdf',
      'image/png',
      'image/jpeg',
      'image/jpg',
      'image/webp',
      'image/heic',
      'image/heif',
    ];

    if (!supportedTypes.includes(mimeType)) {
      return NextResponse.json<ProcessingResponse>(
        { 
          success: false, 
          error: `Unsupported file type: ${mimeType}. Supported types: PDF, PNG, JPEG, WebP, HEIC, HEIF` 
        },
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

    const mediaObject = {
      url: `data:${mimeType};base64,${fileBase64}`,
    };

    const intentResponse = await generateWithFallback([
        { media: mediaObject },
        {
          text: `Analyze this ${mimeType.includes('pdf') ? 'PDF document' : 'image'} "${fileName}" and determine its primary intent/purpose.

IMPORTANT: Return ONLY valid JSON, no additional text, explanations, or markdown formatting.

Classify the content into ONE of these intent types:
- "meeting": Contains meeting information, scheduling, agendas
- "customer_support": Customer inquiries, support requests, complaints
- "personal_task": Personal to-do lists, reminders, errands
- "meeting_notes": Notes from meetings, action items from discussions
- "send_report": Reports to send, data to share, work updates
- "reminder": Simple reminders, deadlines, notifications
- "support_documentation": Help docs, guides, FAQs, technical documentation

Also identify which sections/tabs should receive this information:
- "calendar": If it contains dates, times, scheduling
- "mails": If it requires email response or communication
- "actions": If it contains tasks or action items
- "todos": If it contains simple checklist items

JSON structure (respond with ONLY this JSON, nothing else):
{
  "intent": "meeting"|"customer_support"|"personal_task"|"meeting_notes"|"send_report"|"reminder"|"support_documentation",
  "confidence": 0.0-1.0,
  "reasoning": "string explaining why this intent was chosen",
  "routingTargets": ["calendar", "mails", "actions", "todos"]
}

For images: First extract any visible text using OCR, then analyze the content to determine intent.`
        }
      ]);

    const intentParsed = extractJSON(intentResponse.text);
    result.intent = intentParsed as IntentDetection;

    const routingTargets = result.intent?.routingTargets || [];

    if (routingTargets.includes('calendar')) {
      const calendarResponse = await generateWithFallback([
          { media: mediaObject },
          {
            text: `Extract calendar events, meetings, deadlines, or scheduled items from this ${mimeType.includes('pdf') ? 'PDF document' : 'image'} "${fileName}".

IMPORTANT: Return ONLY valid JSON array, no additional text.

For each event, extract: title, description, date (YYYY-MM-DD), time (HH:MM), duration, location, attendees, priority.

JSON structure (respond with ONLY this JSON, nothing else):
[
  {
    "title": "string",
    "description": "string",
    "startDate": "YYYY-MM-DD",
    "startTime": "HH:MM",
    "endDate": "YYYY-MM-DD",
    "endTime": "HH:MM",
    "location": "string",
    "attendees": ["string"],
    "priority": "low"|"medium"|"high",
    "status": "scheduled"
  }
]

For images with text: Use OCR to extract text first, then identify calendar-related information. Return empty array [] if no calendar events found.`
          }
        ]);

      const calendarParsed = extractJSON(calendarResponse.text);
      result.calendarEvents = Array.isArray(calendarParsed) ? calendarParsed as CalendarEvent[] : [];
    }

    if (routingTargets.includes('mails')) {
      const mailResponse = await generateWithFallback([
          { media: mediaObject },
          {
            text: `Based on this ${mimeType.includes('pdf') ? 'PDF document' : 'image'} "${fileName}", generate appropriate email drafts (responses, updates, reports).

IMPORTANT: Return ONLY valid JSON array, no additional text.

Determine: recipient(s), subject, body content, appropriate tone (professional/friendly/formal), and category.

JSON structure (respond with ONLY this JSON, nothing else):
[
  {
    "to": ["string"],
    "subject": "string",
    "body": "string (complete email body)",
    "context": "string (why this email is being sent)",
    "tone": "professional"|"friendly"|"formal",
    "priority": "low"|"medium"|"high",
    "category": "support"|"update"|"report"|"general"
  }
]

For images: Extract text using OCR first, then generate appropriate email drafts. Return empty array [] if no emails needed.`
          }
        ]);

      const mailParsed = extractJSON(mailResponse.text);
      result.mailDrafts = Array.isArray(mailParsed) ? mailParsed as MailDraft[] : [];
    }

    if (routingTargets.includes('todos')) {
      const todoResponse = await generateWithFallback([
          { media: mediaObject },
          {
            text: `Extract simple checklist items or personal tasks from this ${mimeType.includes('pdf') ? 'PDF document' : 'image'} "${fileName}".

IMPORTANT: Return ONLY valid JSON array, no additional text.

For each todo: text, description, due date if mentioned, priority, category.

JSON structure (respond with ONLY this JSON, nothing else):
[
  {
    "text": "string",
    "description": "string",
    "dueDate": "YYYY-MM-DD" or null,
    "priority": "low"|"medium"|"high",
    "category": "string"
  }
]

For images: Use OCR to extract visible text, then identify todo items. Return empty array [] if no todos found.`
          }
        ]);

      const todoParsed = extractJSON(todoResponse.text);
      result.todoItems = Array.isArray(todoParsed) ? todoParsed as TodoItem[] : [];
    }

    if (extractTasks) {
      const tasksResponse = await generateWithFallback([
          { media: mediaObject },
          {
            text: `Analyze this ${mimeType.includes('pdf') ? 'PDF document' : 'image'} "${fileName}" and extract all actionable tasks, action items, or to-do items. 

IMPORTANT: Return ONLY valid JSON, no additional text, explanations, or markdown formatting.

For each task, provide a clear title, description, priority level, category, estimated time if applicable, and relevant tags.

JSON structure (respond with ONLY this JSON, nothing else):
{
  "tasks": [
    {
      "id": "string",
      "title": "string",
      "description": "string",
      "priority": "low"|"medium"|"high"|"urgent",
      "category": "string",
      "estimatedTime": "string",
      "dependencies": ["string"],
      "tags": ["string"]
    }
  ],
  "totalCount": number,
  "categories": ["string"]
}

Extract and structure all tasks found in the document. If it's an image, also describe what you see before extracting tasks.`
          }
        ]);

      const parsed = extractJSON(tasksResponse.text);
      result.tasks = parsed as TasksExtraction;
    }

    if (generateSummary) {
      const summaryResponse = await generateWithFallback([
          { media: mediaObject },
          {
            text: `Analyze this ${mimeType.includes('pdf') ? 'PDF document' : 'image'} "${fileName}" and create a comprehensive summary.

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

If this is an image, describe the visual content and extract any text visible in the image using OCR capabilities. Then provide the summary based on the extracted content.`
          }
        ]);

      const parsed = extractJSON(summaryResponse.text);
      result.summary = parsed as DocumentSummary;
    }

    if (extractMetadata) {
      const metadataResponse = await generateWithFallback([
          { media: mediaObject },
          {
            text: `Analyze this ${mimeType.includes('pdf') ? 'PDF document' : 'image'} "${fileName}" and extract relevant metadata.

IMPORTANT: Return ONLY valid JSON, no additional text, explanations, or markdown formatting.

Identify the document type, date references, people mentioned, organizations, locations, URLs, and urgency level.

JSON structure (respond with ONLY this JSON, nothing else):
{
  "documentType": "string",
  "dateReferences": ["string"],
  "people": ["string"],
  "organizations": ["string"],
  "locations": ["string"],
  "urls": ["string"],
  "urgency": "low" | "medium" | "high"
}

For images, also extract any text visible using OCR and analyze that content for metadata extraction.`
          }
        ]);

      const parsed = extractJSON(metadataResponse.text);
      result.metadata = parsed as Metadata;
    }

    const processingTime = Date.now() - startTime;

    try {
      const db = await getDatabase();
      const documentRecord: Omit<DocumentModel, '_id'> = {
        fileName,
        fileType: mimeType,
        contentType: 'multimodal',
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

      if (result.tasks && result.tasks.tasks.length > 0) {
        const taskDocuments = result.tasks.tasks.map(task => 
          taskToDocument(task, documentId)
        );
        await db.collection(Collections.TASKS).insertMany(taskDocuments);
        
        const taskIds = result.tasks.tasks.map(t => t.id);
        await db.collection(Collections.DOCUMENTS).updateOne(
          { _id: docResult.insertedId },
          { $set: { extractedTaskIds: taskIds } }
        );
      }

      if (result.calendarEvents && result.calendarEvents.length > 0) {
        const calendarDocs = result.calendarEvents.map((event) => ({
          ...event,
          reminders: event.reminders || [],
          sourceDocumentId: documentId,
          createdAt: new Date(),
          updatedAt: new Date(),
        }));
        await db.collection(Collections.CALENDAR_EVENTS).insertMany(calendarDocs);
      }

      if (result.mailDrafts && result.mailDrafts.length > 0) {
        const mailDocs = result.mailDrafts.map((draft) => ({
          ...draft,
          status: 'draft',
          sourceDocumentId: documentId,
          generatedAt: new Date(),
          createdAt: new Date(),
          updatedAt: new Date(),
        }));
        await db.collection(Collections.MAIL_DRAFTS).insertMany(mailDocs);
      }

      if (result.todoItems && result.todoItems.length > 0) {
        const todoDocs = result.todoItems.map((todo) => ({
          ...todo,
          completed: false,
          dueDate: todo.dueDate ? new Date(todo.dueDate) : undefined,
          estimatedTime: todo.estimatedTime || undefined,
          subtasks: todo.subtasks || [],
          sourceDocumentId: documentId,
          createdAt: new Date(),
          updatedAt: new Date(),
        }));
        await db.collection(Collections.TODOS).insertMany(todoDocs);
      }

      const processingLog: Omit<ProcessingLogModel, '_id'> = {
        documentId,
        processingType: 'full-processing',
        provider,
        processingTime,
        status: 'success',
        extractedData: {
          tasksCount: result.tasks?.totalCount || 0,
          calendarEventsCount: result.calendarEvents?.length || 0,
          mailDraftsCount: result.mailDrafts?.length || 0,
          todoItemsCount: result.todoItems?.length || 0,
          summary: !!result.summary,
          metadata: !!result.metadata,
        },
        timestamp: new Date(),
      };
      await db.collection(Collections.PROCESSING_LOGS).insertOne(processingLog);

    } catch (dbError) {
      console.error('Error saving to MongoDB:', dbError);
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
    const errorMessage = error instanceof Error ? error.message : 'Failed to process multimodal file';
    console.error('Error processing multimodal file:', error);
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



