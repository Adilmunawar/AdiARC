'use server';

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import OpenAI from 'openai';

// Configuration for OpenRouter
const OPENROUTER_API_KEY = "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";
const MODEL_ID = "google/gemini-2.5-flash";

// Initialize OpenAI Client for OpenRouter
const openai = new OpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: OPENROUTER_API_KEY,
  maxRetries: 0,
  timeout: 30 * 1000,
});

const DbAssistantInputSchema = z.string();
const DbAssistantOutputSchema = z.string();


export async function askDbAssistant(prompt: string): Promise<string> {
    const result = await dbAssistantFlow(prompt);
    return result;
}

const dbAssistantFlow = ai.defineFlow(
    {
        name: 'dbAssistantFlow',
        inputSchema: DbAssistantInputSchema,
        outputSchema: DbAssistantOutputSchema,
    },
    async (prompt) => {
        const systemPrompt = "You are a helpful general assistant named AdiARC. You are polite, professional, and concise.";

        try {
            const completion = await openai.chat.completions.create({
                model: MODEL_ID,
                messages: [
                    {
                        role: "system",
                        content: systemPrompt
                    },
                    {
                        role: "user",
                        content: prompt
                    }
                ],
                temperature: 0.7,
                // Required headers for free models on OpenRouter
                extraHeaders: {
                    "HTTP-Referer": "https://adilarc.vercel.app",
                    "X-Title": "AdiARC",
                }
            });

            return completion.choices[0]?.message?.content || "No response received from AI.";

        } catch (error: any) {
            console.error("OpenAI/OpenRouter API Error:", error);
            // Provide a more specific error message to the user
            return `An error occurred while connecting to the AI service: ${error.message || 'Please check the server logs.'}`;
        }
    }
);
