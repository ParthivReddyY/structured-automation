import { NextResponse } from 'next/server';
import { genkit } from 'genkit';
import { mistral, openMistralSmall, openMistralLarge } from 'genkitx-mistral';

export const runtime = 'nodejs';
export const maxDuration = 60;


export async function GET() {
  const testResults = {
    timestamp: new Date().toISOString(),
    note: 'Mistral is the primary AI model for all text processing (process-text, process-file routes)',
    tests: [] as Array<{ model: string; status: string; response?: string; error?: string; usage?: string }>,
  };

  const ai = genkit({
    plugins: [
      mistral({
        apiKey: process.env.MISTRAL_API_KEY,
      }),
    ],
  });

  const modelsToTest = [
    { name: 'mistral-small (PRIMARY)', model: openMistralSmall, usage: 'Default for all text processing' },
    { name: 'mistral-large', model: openMistralLarge, usage: 'Available for complex tasks' },
  ];

  for (const { name, model, usage } of modelsToTest) {
    try {
      const response = await ai.generate({
        model,
        prompt: 'Say "Hello from Mistral!" in a friendly way.',
      });

      testResults.tests.push({
        model: name,
        status: 'success',
        response: response.text,
        usage,
      });
    } catch (error) {
      testResults.tests.push({
        model: name,
        status: 'failed',
        error: error instanceof Error ? error.message : String(error),
        usage,
      });
    }
  }

  return NextResponse.json(testResults);
}
