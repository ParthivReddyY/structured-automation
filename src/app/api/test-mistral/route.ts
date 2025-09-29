import { NextResponse } from 'next/server';
import { generateText } from 'ai';
import { createMistral } from '@ai-sdk/mistral';

export const runtime = 'nodejs';
export const maxDuration = 60;

export async function GET() {
  const testResults = {
    timestamp: new Date().toISOString(),
    tests: [] as Array<{ model: string; status: string; response?: string; error?: string }>,
  };

  // Create Mistral instance
  const mistral = createMistral({
    apiKey: process.env.MISTRAL_API_KEY || '',
  });

  // Test different Mistral models
  const modelsToTest = [
    'mistral-small-latest',
    'mistral-medium-latest',
    'mistral-large-latest',
    'open-mistral-7b',
    'open-mixtral-8x7b',
    'open-mixtral-8x22b',
  ];

  for (const modelName of modelsToTest) {
    try {
      const { text } = await generateText({
        model: mistral(modelName),
        prompt: 'Say "Hello from Mistral!" in a friendly way.',
      });

      testResults.tests.push({
        model: modelName,
        status: 'success',
        response: text,
      });
    } catch (error) {
      testResults.tests.push({
        model: modelName,
        status: 'failed',
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  return NextResponse.json(testResults);
}
