import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { createMistral } from '@ai-sdk/mistral';

// Create provider instances with API keys
const googleAI = createGoogleGenerativeAI({
  apiKey: process.env.GEMINI_API_KEY || '',
});

const mistralAI = createMistral({
  apiKey: process.env.MISTRAL_API_KEY || '',
});

// Configure AI SDK providers with API keys from environment variables
// Using only verified working models from test results
export const aiProviders = {
  // Gemini models via AI SDK (only 2.0 models work with v1beta API)
  gemini: {
    flash: googleAI('gemini-2.0-flash-exp'), // ✅ Verified working
    // Note: gemini-1.5-flash and gemini-1.5-pro not available in v1beta API
  },
  // Mistral models via AI SDK (verified working models)
  mistral: {
    small: mistralAI('mistral-small-latest'),        // ✅ Verified working
    medium: mistralAI('mistral-medium-latest'),      // ✅ Verified working
    large: mistralAI('mistral-large-latest'),        // ✅ Verified working
    open7b: mistralAI('open-mistral-7b'),           // ✅ Verified working
    open8x22b: mistralAI('open-mixtral-8x22b'),     // ✅ Verified working
    // Note: open-mixtral-8x7b has capacity issues and is excluded
  },
};

// Helper to get model by provider and type
export function getAIModel(provider: 'gemini' | 'mistral', modelType: string = 'flash') {
  if (provider === 'gemini') {
    // Only gemini-2.0-flash-exp is available in v1beta API
    return aiProviders.gemini.flash;
  }
  
  if (provider === 'mistral') {
    if (modelType === 'large') return aiProviders.mistral.large;
    if (modelType === 'medium') return aiProviders.mistral.medium;
    if (modelType === 'open7b') return aiProviders.mistral.open7b;
    if (modelType === 'open8x22b') return aiProviders.mistral.open8x22b;
    return aiProviders.mistral.small; // Default to small
  }
  
  return aiProviders.gemini.flash; // Default fallback
}

export default aiProviders;
