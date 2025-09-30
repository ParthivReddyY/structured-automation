import { ObjectId } from 'mongodb';
import type { Task, DocumentSummary, Metadata } from '@/types/ai-schemas';

/**
 * MongoDB Document Models
 * Based on the Intelligent Data-to-Action System specifications
 */

// Task Document Model
export interface TaskDocument extends Omit<Task, 'id'> {
  _id?: ObjectId;
  id: string;
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  category: string;
  estimatedTime?: string;
  dependencies?: string[];
  tags: string[];
  status: 'pending' | 'in-progress' | 'completed' | 'archived';
  dueDate?: Date;
  completedAt?: Date;
  sourceDocumentId?: string; // Reference to source document
  confidence?: number; // AI extraction confidence score (0-1)
  createdAt: Date;
  updatedAt: Date;
}

// Document Model (for uploaded/processed documents)
export interface DocumentModel {
  _id?: ObjectId;
  fileName: string;
  fileType: string; // mime type
  fileSize?: number; // in bytes
  contentType: 'text' | 'file' | 'multimodal'; // processing type used
  originalContent?: string; // for text input
  summary?: DocumentSummary;
  metadata?: Metadata;
  extractedTaskIds: string[]; // IDs of tasks extracted from this document
  processingStatus: 'pending' | 'processing' | 'completed' | 'failed';
  processingTime?: number; // in milliseconds
  provider: 'gemini' | 'mistral';
  error?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Processing Log Model (for tracking AI processing history)
export interface ProcessingLogModel {
  _id?: ObjectId;
  documentId?: string; // Reference to document
  processingType: 'task-extraction' | 'summarization' | 'metadata-extraction' | 'full-processing';
  provider: 'gemini' | 'mistral';
  inputTokens?: number;
  outputTokens?: number;
  processingTime: number; // in milliseconds
  status: 'success' | 'failed' | 'partial';
  error?: string;
  confidence?: number; // Overall confidence score
  extractedData: {
    intent?: string;
    tasksCount?: number;
    calendarEventsCount?: number;
    mailDraftsCount?: number;
    todoItemsCount?: number;
    summary?: boolean;
    metadata?: boolean;
  };
  timestamp: Date;
}

// Todo Model (simple checkable items)
export interface TodoModel {
  _id?: ObjectId;
  id: string;
  text: string;
  description?: string;
  completed: boolean;
  dueDate?: Date;
  priority: 'low' | 'medium' | 'high';
  category?: string;
  estimatedTime?: string;
  subtasks?: string[];
  sourceDocumentId?: string; // Reference to source document if derived from one
  sourceTaskId?: string; // Reference to parent task if derived from one
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
}

// Calendar Event Model (for meetings, deadlines, reminders)
export interface CalendarEventModel {
  _id?: ObjectId;
  id: string;
  title: string;
  description?: string;
  startDate: Date;
  startTime?: string;
  endDate?: Date;
  endTime?: string;
  location?: string; // Physical location or meeting platform (e.g., "Zoom", "Office Room 301")
  attendees?: string[];
  priority: 'low' | 'medium' | 'high';
  status: 'scheduled' | 'in-progress' | 'completed' | 'cancelled';
  reminders?: string[]; // e.g., ["15 minutes before", "1 day before"]
  sourceDocumentId?: string; // Reference to source document
  sourceTaskId?: string; // Reference to related task
  confidence?: number; // AI extraction confidence score
  createdAt: Date;
  updatedAt: Date;
}

// Mail Draft Model (AI-generated email drafts)
export interface MailDraftModel {
  _id?: ObjectId;
  id: string;
  to?: string; // Recipient email or name
  subject: string;
  body: string;
  context: string; // Context or reason for email
  tone: 'formal' | 'casual' | 'professional' | 'friendly';
  priority: 'low' | 'medium' | 'high';
  category: 'customer_support' | 'project_update' | 'meeting_invitation' | 'general';
  status: 'draft' | 'sent' | 'archived';
  sourceDocumentId?: string; // Reference to source document
  sourceTaskId?: string; // Reference to related task
  confidence?: number; // AI generation confidence score
  generatedAt: Date;
  sentAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Helper functions for data transformation
 */

export function taskToDocument(task: Task, sourceDocId?: string): Omit<TaskDocument, '_id'> {
  return {
    ...task,
    status: 'pending',
    sourceDocumentId: sourceDocId,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

export function documentTaskToTask(doc: TaskDocument): Task {
  return {
    id: doc.id,
    title: doc.title,
    description: doc.description,
    priority: doc.priority,
    category: doc.category,
    estimatedTime: doc.estimatedTime,
    dependencies: doc.dependencies,
    tags: doc.tags,
  };
}
