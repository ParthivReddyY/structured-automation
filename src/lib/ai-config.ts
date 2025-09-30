import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { createMistral } from '@ai-sdk/mistral';

const googleAI = createGoogleGenerativeAI({
  apiKey: process.env.GEMINI_API_KEY || '',
});

const mistralAI = createMistral({
  apiKey: process.env.MISTRAL_API_KEY || '',
});

export const aiProviders = {
  gemini: {
    flash: googleAI('gemini-2.0-flash-exp'), 
  },
  mistral: {
    small: mistralAI('mistral-small-latest'),        
    medium: mistralAI('mistral-medium-latest'),      
    large: mistralAI('mistral-large-latest'),        
    open7b: mistralAI('open-mistral-7b'),           
    open8x22b: mistralAI('open-mixtral-8x22b'),     
  },
};

export function getAIModel(provider: 'gemini' | 'mistral', modelType: string = 'flash') {
  if (provider === 'gemini') {
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
