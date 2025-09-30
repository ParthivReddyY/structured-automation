import { NextResponse } from 'next/server';
import { genkit } from 'genkit';
import { googleAI, gemini15Flash, gemini15Pro, gemini20FlashExp } from '@genkit-ai/googleai';

export const runtime = 'nodejs';
export const maxDuration = 60;


export async function GET() {
  const testResults = {
    timestamp: new Date().toISOString(),
    note: 'Gemini is used only for multimodal/image processing. Text processing uses Mistral.',
    tests: [] as Array<{ model: string; status: string; response?: string; error?: string }>,
  };

  const ai = genkit({
    plugins: [
      googleAI({
        apiKey: process.env.GEMINI_API_KEY,
      }),
    ],
  });

  const modelsToTest = [
    { name: 'gemini-2.0-flash-exp', model: gemini20FlashExp },
    { name: 'gemini-1.5-flash', model: gemini15Flash },
    { name: 'gemini-1.5-pro', model: gemini15Pro },
  ];

  for (const { name, model } of modelsToTest) {
    try {
      const response = await ai.generate({
        model,
        prompt: 'Say "Hello from Genkit!" in a friendly way.',
      });

      testResults.tests.push({
        model: name,
        status: 'success',
        response: response.text,
      });
    } catch (error) {
      testResults.tests.push({
        model: name,
        status: 'failed',
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  return NextResponse.json(testResults);
}
