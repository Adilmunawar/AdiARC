
'use server';
import { genkit, AIServiceError } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';

export const ai = genkit({
  plugins: [
    googleAI(),
  ],
});

export { AIServiceError };
