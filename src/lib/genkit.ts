import { genkit } from 'genkit';
import { googleAI, gemini15Flash, gemini15Pro, gemini20FlashExp } from '@genkit-ai/googleai';

// Initialize Genkit with Google AI plugin
export const ai = genkit({
  plugins: [
    googleAI({
      apiKey: process.env.GEMINI_API_KEY,
    }),
  ],
  model: gemini20FlashExp, // Default model - using 2.0 flash experimental
});

// Export model references for easy access
export const models = {
  gemini: {
    flash20: gemini20FlashExp, // Gemini 2.0 Flash Experimental
    flash: gemini15Flash,      // Gemini 1.5 Flash
    pro: gemini15Pro,          // Gemini 1.5 Pro
  },
};

// Export configured AI instance for use across the application
export default ai;
