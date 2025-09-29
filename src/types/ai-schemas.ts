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

// Combined schema for full document processing
export const DocumentProcessingSchema = z.object({
  summary: DocumentSummarySchema,
  tasks: TasksExtractionSchema,
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
