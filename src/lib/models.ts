import { ObjectId } from 'mongodb';
import type { Task, DocumentSummary, Metadata } from '@/types/ai-schemas';

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
  sourceDocumentId?: string; 
  confidence?: number; 
  createdAt: Date;
  updatedAt: Date;
}

export interface DocumentModel {
  _id?: ObjectId;
  fileName: string;
  fileType: string; 
  fileSize?: number; 
  contentType: 'text' | 'file' | 'multimodal'; 
  originalContent?: string; 
  summary?: DocumentSummary;
  metadata?: Metadata;
  extractedTaskIds: string[]; 
  processingStatus: 'pending' | 'processing' | 'completed' | 'failed';
  processingTime?: number; 
  provider: 'gemini' | 'mistral';
  error?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ProcessingLogModel {
  _id?: ObjectId;
  documentId?: string; 
  processingType: 'task-extraction' | 'summarization' | 'metadata-extraction' | 'full-processing';
  provider: 'gemini' | 'mistral';
  inputTokens?: number;
  outputTokens?: number;
  processingTime: number; 
  status: 'success' | 'failed' | 'partial';
  error?: string;
  confidence?: number; 
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
  sourceDocumentId?: string; 
  sourceTaskId?: string; 
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
}

export interface CalendarEventModel {
  _id?: ObjectId;
  id: string;
  title: string;
  description?: string;
  startDate: Date;
  startTime?: string;
  endDate?: Date;
  endTime?: string;
  location?: string; 
  attendees?: string[];
  priority: 'low' | 'medium' | 'high';
  status: 'scheduled' | 'in-progress' | 'completed' | 'cancelled';
  reminders?: string[]; 
  sourceDocumentId?: string; 
  sourceTaskId?: string; 
  confidence?: number; 
  createdAt: Date;
  updatedAt: Date;
}

export interface MailDraftModel {
  _id?: ObjectId;
  id: string;
  to?: string; 
  subject: string;
  body: string;
  context: string; 
  tone: 'formal' | 'casual' | 'professional' | 'friendly';
  priority: 'low' | 'medium' | 'high';
  category: 'customer_support' | 'project_update' | 'meeting_invitation' | 'general';
  status: 'draft' | 'sent' | 'archived';
  sourceDocumentId?: string; 
  sourceTaskId?: string; 
  confidence?: number; 
  generatedAt: Date;
  sentAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

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
