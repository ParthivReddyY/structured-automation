import { NextRequest, NextResponse } from 'next/server';
import { ai } from '@/lib/genkit';
import { gemini20FlashExp } from '@genkit-ai/googleai';
import type { ProcessTextRequest, ProcessingResponse, TasksExtraction, DocumentSummary, Metadata } from '@/types/ai-schemas';

export const runtime = 'nodejs';
export const maxDuration = 60;

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
      tasks: TasksExtraction;
      summary: DocumentSummary;
      metadata: Metadata;
    }> = {};

    // Extract tasks if requested
    if (extractTasks) {
      const tasksResponse = await ai.generate({
        model: gemini20FlashExp,
        prompt: `Analyze the following text and extract all actionable tasks, action items, or to-do items.

IMPORTANT: Return ONLY valid JSON, no additional text, explanations, or markdown formatting.

For each task, provide a clear title, description, priority level, category, estimated time if applicable, and relevant tags.

JSON structure (respond with ONLY this JSON, nothing else):
{
  "tasks": [{"id": "string", "title": "string", "description": "string", "priority": "low"|"medium"|"high"|"urgent", "category": "string", "estimatedTime": "string" (optional), "dependencies": ["string"] (optional), "tags": ["string"] (optional)}],
  "totalCount": number,
  "categories": ["string"]
}
        
Text:
${text}`,
        config: { temperature: 0.3 },
      });
      
      const parsed = extractJSON(tasksResponse.text);
      result.tasks = parsed as TasksExtraction;
    }

    // Generate summary if requested
    if (generateSummary) {
      const summaryResponse = await ai.generate({
        model: gemini20FlashExp,
        prompt: `Analyze the following text and create a comprehensive summary.

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
${text}`,
        config: { temperature: 0.5 },
      });

      const parsed = extractJSON(summaryResponse.text);
      result.summary = parsed as DocumentSummary;
    }

    // Extract metadata if requested
    if (extractMetadata) {
      const metadataResponse = await ai.generate({
        model: gemini20FlashExp,
        prompt: `Analyze the following text and extract relevant metadata.

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
${text}`,
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
