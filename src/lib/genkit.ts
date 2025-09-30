import { genkit } from 'genkit';
import { googleAI, gemini15Flash, gemini15Pro, gemini20FlashExp } from '@genkit-ai/googleai';
import { mistral, openMistralSmall, openMistralLarge, openPixtral, openPixtralLarge } from 'genkitx-mistral';
export const ai = genkit({
  plugins: [
    googleAI({
      apiKey: process.env.GEMINI_API_KEY,
    }),
    mistral({
      apiKey: process.env.MISTRAL_API_KEY,
    }),
  ],
  model: gemini20FlashExp, 
});

export const models = {
  gemini: {
    flash20: gemini20FlashExp, // Gemini 2.0 Flash Experimental
    flash: gemini15Flash,      // Gemini 1.5 Flash
    pro: gemini15Pro,          // Gemini 1.5 Pro
  },
  mistral: {
    small: openMistralSmall,      // ✅ Fast, cost-effective (Primary for text)
    large: openMistralLarge,      // ✅ Best quality for complex text
    pixtral: openPixtral,         // ✅ Multimodal - image/document OCR (12B)
    pixtralLarge: openPixtralLarge, // ✅ Multimodal - advanced vision (124B)
  },
};

export const mistralSmall = openMistralSmall;
export const mistralLarge = openMistralLarge;
export const pixtral = openPixtral;
export const pixtralLarge = openPixtralLarge;
export const geminiFlash = gemini20FlashExp;
export { gemini20FlashExp };

export default ai;
