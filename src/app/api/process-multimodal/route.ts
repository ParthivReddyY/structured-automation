import { NextRequest, NextResponse } from 'next/server';
import { ai } from '@/lib/genkit';
import { gemini20FlashExp } from '@genkit-ai/googleai';
import type { ProcessingResponse, TasksExtraction, DocumentSummary, Metadata } from '@/types/ai-schemas';

export const runtime = 'nodejs';
export const maxDuration = 60;

/**
 * Extract JSON from AI response text
 * Handles cases where AI includes markdown code blocks or extra text
 */
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

  // If no JSON found, try parsing the whole text
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

    // Validate mime type for multimodal support
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
      tasks: TasksExtraction;
      summary: DocumentSummary;
      metadata: Metadata;
    }> = {};

    // Create media object for Genkit multimodal prompt
    const mediaObject = {
      url: `data:${mimeType};base64,${fileBase64}`,
    };

    // Extract tasks if requested
    if (extractTasks) {
      const tasksResponse = await ai.generate({
        model: gemini20FlashExp,
        prompt: [
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
        ],
        config: { temperature: 0.3 },
      });

      const parsed = extractJSON(tasksResponse.text);
      result.tasks = parsed as TasksExtraction;
    }

    // Generate summary if requested
    if (generateSummary) {
      const summaryResponse = await ai.generate({
        model: gemini20FlashExp,
        prompt: [
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
        ],
        config: { temperature: 0.5 },
      });

      const parsed = extractJSON(summaryResponse.text);
      result.summary = parsed as DocumentSummary;
    }

    // Extract metadata if requested
    if (extractMetadata) {
      const metadataResponse = await ai.generate({
        model: gemini20FlashExp,
        prompt: [
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
        ],
        config: { temperature: 0.2 },
      });

      const parsed = extractJSON(metadataResponse.text);
      result.metadata = parsed as Metadata;
    }

    const processingTime = Date.now() - startTime;

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
