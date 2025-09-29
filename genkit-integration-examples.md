# Genkit Integration Examples for Your Project

## Project Structure Integration

Based on your current Next.js project structure, here's how you can integrate Google Genkit:

```
structured-automation/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   └── genkit/          # New: Genkit API routes
│   │   │       ├── chat/
│   │   │       │   └── route.ts
│   │   │       ├── analyze/
│   │   │       │   └── route.ts
│   │   │       └── generate/
│   │   │           └── route.ts
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── lib/
│   │   ├── utils.ts
│   │   └── genkit/              # New: Genkit configurations
│   │       ├── flows.ts
│   │       ├── config.ts
│   │       └── tools.ts
│   └── components/              # New: AI-powered components
│       ├── ui/
│       └── ai/
│           ├── ChatInterface.tsx
│           ├── ContentGenerator.tsx
│           └── DataAnalyzer.tsx
├── genkit/                      # New: Genkit flows directory
│   ├── flows/
│   │   ├── chat.ts
│   │   ├── analysis.ts
│   │   └── generation.ts
│   └── prompts/
│       ├── chat.prompt
│       ├── analysis.prompt
│       └── generation.prompt
└── package.json
```

## 1. Installation & Setup

### Install Dependencies
```bash
npm install genkit @genkit-ai/nextjs @genkit-ai/google-genai @genkit-ai/openai
npm install -D @types/node
```

### Environment Variables
```bash
# .env.local
GOOGLE_GENAI_API_KEY=your_google_api_key
OPENAI_API_KEY=your_openai_key
```

## 2. Core Configuration

### `src/lib/genkit/config.ts`
```typescript
import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';
import { openAI } from '@genkit-ai/openai';

export const ai = genkit({
  plugins: [
    googleAI(),
    openAI()
  ],
  model: googleAI.model('gemini-2.5-flash'), // Default model
});

export const models = {
  fast: googleAI.model('gemini-2.5-flash'),
  smart: googleAI.model('gemini-1.5-pro'),
  openai: openAI.model('gpt-4'),
  embeddings: googleAI.embedder('text-embedding-004')
};
```

## 3. Genkit Flows

### `genkit/flows/chat.ts`
```typescript
import { ai, models } from '../../src/lib/genkit/config';
import { z } from 'zod';

const ChatInputSchema = z.object({
  message: z.string(),
  context?: z.string(),
  conversationHistory?: z.array(z.object({
    role: z.enum(['user', 'assistant']),
    content: z.string()
  }))
});

export const chatFlow = ai.defineFlow(
  'chat',
  ChatInputSchema,
  async ({ message, context, conversationHistory = [] }) => {
    const systemPrompt = `You are a helpful AI assistant for a structured automation system. 
    ${context ? `Context: ${context}` : ''}
    
    Previous conversation:
    ${conversationHistory.map(msg => `${msg.role}: ${msg.content}`).join('\n')}`;

    const { text } = await ai.generate({
      model: models.fast,
      prompt: `${systemPrompt}\n\nUser: ${message}\nAssistant:`,
      config: {
        maxOutputTokens: 1000,
        temperature: 0.7
      }
    });

    return { 
      response: text,
      timestamp: new Date().toISOString()
    };
  }
);
```

### `genkit/flows/analysis.ts`
```typescript
import { ai, models } from '../../src/lib/genkit/config';
import { z } from 'zod';

const AnalysisInputSchema = z.object({
  data: z.string(),
  analysisType: z.enum(['sentiment', 'summary', 'insights', 'classification']),
  options?: z.object({
    categories?: z.array(z.string()),
    outputFormat?: z.enum(['json', 'text'])
  })
});

const AnalysisOutputSchema = z.object({
  result: z.string(),
  confidence: z.number().min(0).max(1),
  metadata: z.record(z.any())
});

export const analysisFlow = ai.defineFlow(
  'analysis',
  AnalysisInputSchema,
  async ({ data, analysisType, options }) => {
    const prompts = {
      sentiment: `Analyze the sentiment of the following text and provide a detailed breakdown:`,
      summary: `Provide a concise summary of the following content:`,
      insights: `Extract key insights and patterns from the following data:`,
      classification: `Classify the following content into the provided categories: ${options?.categories?.join(', ') || 'general categories'}`
    };

    const { text } = await ai.generate({
      model: models.smart,
      prompt: `${prompts[analysisType]}\n\nData: ${data}`,
      output: options?.outputFormat === 'json' ? {
        schema: AnalysisOutputSchema
      } : undefined
    });

    return {
      analysis: text,
      type: analysisType,
      processedAt: new Date().toISOString()
    };
  }
);
```

### `genkit/flows/generation.ts`
```typescript
import { ai, models } from '../../src/lib/genkit/config';
import { z } from 'zod';

const GenerationInputSchema = z.object({
  template: z.string(),
  variables: z.record(z.string()),
  style?: z.enum(['formal', 'casual', 'technical', 'creative']),
  length?: z.enum(['short', 'medium', 'long'])
});

export const contentGenerationFlow = ai.defineFlow(
  'contentGeneration',
  GenerationInputSchema,
  async ({ template, variables, style = 'formal', length = 'medium' }) => {
    // Replace variables in template
    let processedTemplate = template;
    Object.entries(variables).forEach(([key, value]) => {
      processedTemplate = processedTemplate.replace(
        new RegExp(`{{${key}}}`, 'g'), 
        value
      );
    });

    const styleGuides = {
      formal: 'Use professional, formal language',
      casual: 'Use friendly, conversational tone',
      technical: 'Use precise technical language with proper terminology',
      creative: 'Use engaging, creative language with vivid descriptions'
    };

    const lengthGuides = {
      short: 'Keep it concise (100-200 words)',
      medium: 'Provide moderate detail (300-500 words)',
      long: 'Be comprehensive and detailed (600+ words)'
    };

    const { text } = await ai.generate({
      model: models.fast,
      prompt: `Generate content based on the following template and requirements:
      
      Template: ${processedTemplate}
      Style: ${styleGuides[style]}
      Length: ${lengthGuides[length]}
      
      Generate the content now:`,
      config: {
        temperature: 0.8,
        maxOutputTokens: length === 'long' ? 2000 : length === 'medium' ? 1000 : 500
      }
    });

    return {
      generatedContent: text,
      metadata: {
        style,
        length,
        template: template,
        variables: Object.keys(variables)
      }
    };
  }
);
```

## 4. API Routes

### `src/app/api/genkit/chat/route.ts`
```typescript
import { streamFlow } from '@genkit-ai/nextjs';
import { chatFlow } from '../../../../../genkit/flows/chat';

export const POST = streamFlow(chatFlow);
```

### `src/app/api/genkit/analyze/route.ts`
```typescript
import { runFlow } from '@genkit-ai/nextjs';
import { analysisFlow } from '../../../../../genkit/flows/analysis';

export const POST = runFlow(analysisFlow);
```

### `src/app/api/genkit/generate/route.ts`
```typescript
import { runFlow } from '@genkit-ai/nextjs';
import { contentGenerationFlow } from '../../../../../genkit/flows/generation';

export const POST = runFlow(contentGenerationFlow);
```

## 5. React Components

### `src/components/ai/ChatInterface.tsx`
```typescript
'use client';

import { useState } from 'react';
import { streamFlow } from '@genkit-ai/nextjs/client';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMessage: Message = {
      role: 'user',
      content: input,
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const stream = streamFlow('chat', {
        message: input,
        conversationHistory: messages
      });

      let assistantResponse = '';
      for await (const chunk of stream) {
        assistantResponse += chunk;
        // Update UI with streaming response
        setMessages(prev => {
          const newMessages = [...prev];
          const lastMessage = newMessages[newMessages.length - 1];
          
          if (lastMessage?.role === 'assistant') {
            lastMessage.content = assistantResponse;
          } else {
            newMessages.push({
              role: 'assistant',
              content: assistantResponse,
              timestamp: new Date().toISOString()
            });
          }
          
          return newMessages;
        });
      }
    } catch (error) {
      console.error('Chat error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-96 border rounded-lg">
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message, index) => (
          <div
            key={index}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                message.role === 'user'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-200 text-gray-800'
              }`}
            >
              {message.content}
            </div>
          </div>
        ))}
      </div>
      
      <div className="border-t p-4">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
            placeholder="Type your message..."
            className="flex-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={isLoading}
          />
          <button
            onClick={sendMessage}
            disabled={isLoading || !input.trim()}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}
```

### `src/components/ai/ContentGenerator.tsx`
```typescript
'use client';

import { useState } from 'react';

interface GenerationOptions {
  template: string;
  variables: Record<string, string>;
  style: 'formal' | 'casual' | 'technical' | 'creative';
  length: 'short' | 'medium' | 'long';
}

export function ContentGenerator() {
  const [options, setOptions] = useState<GenerationOptions>({
    template: 'Write a {{type}} about {{topic}} for {{audience}}',
    variables: {
      type: 'blog post',
      topic: 'AI automation',
      audience: 'developers'
    },
    style: 'formal',
    length: 'medium'
  });
  const [result, setResult] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const generateContent = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/genkit/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(options)
      });

      const data = await response.json();
      setResult(data.generatedContent);
    } catch (error) {
      console.error('Generation error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-2">Template</label>
          <textarea
            value={options.template}
            onChange={(e) => setOptions(prev => ({ ...prev, template: e.target.value }))}
            className="w-full px-3 py-2 border rounded-lg"
            rows={3}
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Variables (JSON)</label>
          <textarea
            value={JSON.stringify(options.variables, null, 2)}
            onChange={(e) => {
              try {
                const variables = JSON.parse(e.target.value);
                setOptions(prev => ({ ...prev, variables }));
              } catch (error) {
                // Invalid JSON, ignore
              }
            }}
            className="w-full px-3 py-2 border rounded-lg font-mono text-sm"
            rows={3}
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Style</label>
          <select
            value={options.style}
            onChange={(e) => setOptions(prev => ({ 
              ...prev, 
              style: e.target.value as GenerationOptions['style'] 
            }))}
            className="w-full px-3 py-2 border rounded-lg"
          >
            <option value="formal">Formal</option>
            <option value="casual">Casual</option>
            <option value="technical">Technical</option>
            <option value="creative">Creative</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Length</label>
          <select
            value={options.length}
            onChange={(e) => setOptions(prev => ({ 
              ...prev, 
              length: e.target.value as GenerationOptions['length'] 
            }))}
            className="w-full px-3 py-2 border rounded-lg"
          >
            <option value="short">Short</option>
            <option value="medium">Medium</option>
            <option value="long">Long</option>
          </select>
        </div>
      </div>

      <button
        onClick={generateContent}
        disabled={isLoading}
        className="w-full px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50"
      >
        {isLoading ? 'Generating...' : 'Generate Content'}
      </button>

      {result && (
        <div>
          <label className="block text-sm font-medium mb-2">Generated Content</label>
          <div className="p-4 bg-gray-50 border rounded-lg">
            <pre className="whitespace-pre-wrap text-sm">{result}</pre>
          </div>
        </div>
      )}
    </div>
  );
}
```

## 6. Usage in Your Main Page

### Update `src/app/page.tsx`
```typescript
import { ChatInterface } from '@/components/ai/ChatInterface';
import { ContentGenerator } from '@/components/ai/ContentGenerator';

export default function Home() {
  return (
    <main className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Structured Automation with AI</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div>
          <h2 className="text-2xl font-semibold mb-4">AI Chat Assistant</h2>
          <ChatInterface />
        </div>
        
        <div>
          <h2 className="text-2xl font-semibold mb-4">Content Generator</h2>
          <ContentGenerator />
        </div>
      </div>
    </main>
  );
}
```

## 7. Development Commands

### Package.json Scripts
```json
{
  "scripts": {
    "dev": "next dev",
    "genkit:dev": "genkit start -- npm run dev",
    "genkit:ui": "genkit start --ui-port 4001",
    "build": "next build",
    "start": "next start"
  }
}
```

### Running with Genkit
```bash
# Start Next.js with Genkit developer tools
npm run genkit:dev

# Or start Genkit UI separately
npm run genkit:ui
```

## 8. Advanced Integration Scenarios

### RAG Implementation for Documentation
```typescript
// genkit/flows/rag-docs.ts
import { ai, models } from '../../src/lib/genkit/config';
import { z } from 'zod';

const DocsQuerySchema = z.object({
  query: z.string(),
  documentType?: z.enum(['api', 'tutorial', 'reference'])
});

export const docsRAGFlow = ai.defineFlow(
  'docsRAG',
  DocsQuerySchema,
  async ({ query, documentType }) => {
    // 1. Generate query embedding
    const queryEmbedding = await ai.embed({
      embedder: models.embeddings,
      content: query
    });

    // 2. Retrieve relevant documents (implement your vector store)
    // const documents = await vectorStore.retrieve(queryEmbedding);

    // 3. Generate response with context
    const response = await ai.generate({
      model: models.smart,
      prompt: `
        Answer the following question based on the documentation:
        
        Question: ${query}
        Document Type: ${documentType || 'any'}
        
        Please provide a helpful and accurate response.
      `
    });

    return response;
  }
);
```

### Batch Processing Flow
```typescript
// genkit/flows/batch-processing.ts
export const batchProcessingFlow = ai.defineFlow(
  'batchProcessing',
  z.object({
    items: z.array(z.string()),
    operation: z.enum(['summarize', 'translate', 'classify'])
  }),
  async ({ items, operation }) => {
    const results = await Promise.all(
      items.map(async (item, index) => {
        const result = await ai.generate({
          model: models.fast,
          prompt: `${operation} the following: ${item}`
        });
        
        return {
          index,
          input: item,
          output: result.text,
          operation
        };
      })
    );

    return { 
      results,
      summary: {
        total: items.length,
        processed: results.length,
        operation
      }
    };
  }
);
```

This comprehensive integration guide shows you how to add Google Genkit to your existing Next.js project with practical examples tailored to your structure. The examples cover chat interfaces, content generation, analysis tools, and advanced features like RAG and batch processing.