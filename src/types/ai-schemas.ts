import { z } from 'zod';

// Schema for extracted tasks from documents
export const TaskSchema = z.object({
  id: z.string().describe('Unique identifier for the task'),
  title: z.string().describe('Short, actionable title of the task'),
  description: z.string().describe('Detailed description of what needs to be done'),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).describe('Priority level of the task'),
  category: z.string().describe('Category or type of task (e.g., bug, feature, documentation)'),
  estimatedTime: z.string().optional().describe('Estimated time to complete (e.g., "2 hours", "1 day")'),
  dependencies: z.array(z.string()).optional().describe('IDs of tasks that must be completed first'),
  tags: z.array(z.string()).describe('Relevant tags or labels'),
});

export const TasksExtractionSchema = z.object({
  tasks: z.array(TaskSchema).describe('List of extracted tasks'),
  totalCount: z.number().describe('Total number of tasks identified'),
  summary: z.string().describe('Brief summary of all tasks'),
});

// Schema for document summary
export const DocumentSummarySchema = z.object({
  title: z.string().describe('Title or main topic of the document'),
  summary: z.string().describe('Comprehensive summary of the document content'),
  keyPoints: z.array(z.string()).describe('Main key points or takeaways'),
  topics: z.array(z.string()).describe('Main topics covered in the document'),
  actionItems: z.array(z.string()).describe('Action items or next steps identified'),
  sentiment: z.enum(['positive', 'neutral', 'negative', 'mixed']).describe('Overall sentiment of the document'),
});

// Schema for metadata extraction
export const MetadataSchema = z.object({
  documentType: z.string().describe('Type of document (e.g., meeting notes, project plan, email)'),
  dateReferences: z.array(z.string()).optional().describe('Dates mentioned in the document'),
  people: z.array(z.string()).optional().describe('People or stakeholders mentioned'),
  organizations: z.array(z.string()).optional().describe('Organizations or companies mentioned'),
  locations: z.array(z.string()).optional().describe('Locations mentioned'),
  urls: z.array(z.string()).optional().describe('URLs or links found'),
  urgency: z.enum(['low', 'medium', 'high']).describe('Urgency level of the content'),
});

// Schema for intent detection
export const IntentDetectionSchema = z.object({
  intent: z.enum([
    'meeting',
    'customer_support',
    'personal_task',
    'meeting_notes',
    'send_report',
    'reminder',
    'support_documentation'
  ]).describe('The primary intent detected from the content'),
  confidence: z.number().min(0).max(1).describe('Confidence score for the detected intent (0-1)'),
  subIntent: z.string().optional().describe('Secondary or sub-intent if applicable'),
  routingTargets: z.array(z.enum(['actions', 'calendar', 'mails', 'todos', 'documents'])).describe('Which tabs/sections should receive this content'),
});

// Schema for calendar events
export const CalendarEventSchema = z.object({
  title: z.string().describe('Event title'),
  description: z.string().optional().describe('Event description'),
  startDate: z.string().describe('Start date in ISO format'),
  startTime: z.string().optional().describe('Start time (e.g., "10:00 AM")'),
  endDate: z.string().optional().describe('End date in ISO format'),
  endTime: z.string().optional().describe('End time (e.g., "11:00 AM")'),
  location: z.string().optional().describe('Meeting location or platform (e.g., "Zoom", "Office Room 301")'),
  attendees: z.array(z.string()).optional().describe('List of attendees'),
  priority: z.enum(['low', 'medium', 'high']).describe('Event priority'),
  reminders: z.array(z.string()).optional().describe('Reminder times (e.g., "15 minutes before", "1 day before")'),
});

// Schema for mail drafts
export const MailDraftSchema = z.object({
  to: z.string().optional().describe('Recipient email or name'),
  subject: z.string().describe('Email subject line'),
  body: z.string().describe('Email body content'),
  context: z.string().describe('Context or reason for the email'),
  tone: z.enum(['formal', 'casual', 'professional', 'friendly']).describe('Tone of the email'),
  priority: z.enum(['low', 'medium', 'high']).describe('Email priority'),
  category: z.enum(['customer_support', 'project_update', 'meeting_invitation', 'general']).describe('Email category'),
});

// Schema for todo items
export const TodoItemSchema = z.object({
  title: z.string().describe('Todo item title'),
  description: z.string().optional().describe('Detailed description'),
  dueDate: z.string().optional().describe('Due date in ISO format'),
  priority: z.enum(['low', 'medium', 'high']).describe('Priority level'),
  category: z.string().optional().describe('Category (e.g., personal, work, shopping)'),
  estimatedTime: z.string().optional().describe('Estimated time to complete'),
  subtasks: z.array(z.string()).optional().describe('List of subtasks'),
});

// Combined schema for full document processing
export const DocumentProcessingSchema = z.object({
  summary: DocumentSummarySchema,
  tasks: TasksExtractionSchema,
  metadata: MetadataSchema,
  processingTimestamp: z.string().describe('ISO timestamp when processing completed'),
  provider: z.enum(['gemini', 'mistral']).describe('AI provider used for processing'),
});

// Enhanced processing schema with intent detection
export const IntelligentProcessingSchema = z.object({
  intent: IntentDetectionSchema,
  summary: DocumentSummarySchema,
  tasks: TasksExtractionSchema.optional(),
  calendarEvents: z.array(CalendarEventSchema).optional(),
  mailDrafts: z.array(MailDraftSchema).optional(),
  todoItems: z.array(TodoItemSchema).optional(),
  metadata: MetadataSchema,
  processingTimestamp: z.string().describe('ISO timestamp when processing completed'),
  provider: z.enum(['gemini', 'mistral']).describe('AI provider used for processing'),
});

// TypeScript types derived from schemas
export type Task = z.infer<typeof TaskSchema>;
export type TasksExtraction = z.infer<typeof TasksExtractionSchema>;
export type DocumentSummary = z.infer<typeof DocumentSummarySchema>;
export type Metadata = z.infer<typeof MetadataSchema>;
export type DocumentProcessing = z.infer<typeof DocumentProcessingSchema>;
export type IntentDetection = z.infer<typeof IntentDetectionSchema>;
export type CalendarEvent = z.infer<typeof CalendarEventSchema>;
export type MailDraft = z.infer<typeof MailDraftSchema>;
export type TodoItem = z.infer<typeof TodoItemSchema>;
export type IntelligentProcessing = z.infer<typeof IntelligentProcessingSchema>;

// Request/Response types for API routes
export interface ProcessTextRequest {
  text: string;
  provider?: 'gemini' | 'mistral';
  extractTasks?: boolean;
  generateSummary?: boolean;
  extractMetadata?: boolean;
}

export interface ProcessFileRequest {
  fileContent: string;
  fileName: string;
  mimeType: string;
  provider?: 'gemini' | 'mistral';
  extractTasks?: boolean;
  generateSummary?: boolean;
  extractMetadata?: boolean;
}

export interface ProcessingResponse {
  success: boolean;
  data?: Partial<DocumentProcessing>;
  error?: string;
  processingTime?: number;
}
