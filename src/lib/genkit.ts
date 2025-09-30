import { genkit } from 'genkit';
import { googleAI, gemini15Flash, gemini15Pro, gemini20FlashExp } from '@genkit-ai/googleai';
import { mistral, openMistralSmall, openMistralLarge } from 'genkitx-mistral';

// Initialize Genkit with both Google AI and Mistral plugins
export const ai = genkit({
  plugins: [
    googleAI({
      apiKey: process.env.GEMINI_API_KEY,
    }),
    mistral({
      apiKey: process.env.MISTRAL_API_KEY,
    }),
  ],
  model: openMistralSmall, // Default model - using Mistral Small (cost-effective & fast)
});

// Export model references for easy access
export const models = {
  // Gemini models (for multimodal/image support when needed)
  gemini: {
    flash20: gemini20FlashExp, // Gemini 2.0 Flash Experimental
    flash: gemini15Flash,      // Gemini 1.5 Flash
    pro: gemini15Pro,          // Gemini 1.5 Pro
  },
  // Mistral models (primary models for text processing)
  mistral: {
    small: openMistralSmall,   // ✅ Fast, cost-effective (Primary)
    large: openMistralLarge,   // ✅ Best quality
  },
};

// Export model references for direct usage
export const mistralSmall = openMistralSmall;
export const mistralLarge = openMistralLarge;
export { gemini20FlashExp };

// Export configured AI instance for use across the application
export default ai;
