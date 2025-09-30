import { genkit } from 'genkit';
import { googleAI, gemini15Flash, gemini15Pro, gemini20FlashExp } from '@genkit-ai/googleai';
import { mistral, openMistralSmall, openMistralLarge, openPixtral, openPixtralLarge } from 'genkitx-mistral';

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
  model: gemini20FlashExp, // Default model - using Gemini as primary (more reliable)
});

// Export model references for easy access
export const models = {
  // Gemini models (backup for multimodal if needed)
  gemini: {
    flash20: gemini20FlashExp, // Gemini 2.0 Flash Experimental
    flash: gemini15Flash,      // Gemini 1.5 Flash
    pro: gemini15Pro,          // Gemini 1.5 Pro
  },
  // Mistral models (primary models)
  mistral: {
    small: openMistralSmall,      // ✅ Fast, cost-effective (Primary for text)
    large: openMistralLarge,      // ✅ Best quality for complex text
    pixtral: openPixtral,         // ✅ Multimodal - image/document OCR (12B)
    pixtralLarge: openPixtralLarge, // ✅ Multimodal - advanced vision (124B)
  },
};

// Export model references for direct usage
export const mistralSmall = openMistralSmall;
export const mistralLarge = openMistralLarge;
export const pixtral = openPixtral;
export const pixtralLarge = openPixtralLarge;
export const geminiFlash = gemini20FlashExp;
export { gemini20FlashExp };

// Export configured AI instance for use across the application
export default ai;
