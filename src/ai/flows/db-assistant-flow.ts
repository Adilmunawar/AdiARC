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

const DbAssistantInputSchema = z.object({
    prompt: z.string(),
    mode: z.enum(['normal', 'db']),
});

const DbAssistantOutputSchema = z.string();


export async function askDbAssistant(input: z.infer<typeof DbAssistantInputSchema>): Promise<string> {
    const result = await dbAssistantFlow(input);
    return result;
}

const dbAssistantFlow = ai.defineFlow(
    {
        name: 'dbAssistantFlow',
        inputSchema: DbAssistantInputSchema,
        outputSchema: DbAssistantOutputSchema,
    },
    async ({ prompt, mode }) => {
        let systemPrompt = "You are a helpful general assistant named AdiARC. You are polite, professional, and concise.";
        
        if (mode === 'db') {
            systemPrompt = `You are a virtual assistant and an expert in Islamic inheritance law, specifically for land partitions (Wirasat). Your purpose is to help users calculate and understand inheritance shares based on Sunni Hanafi jurisprudence.

You must follow these rules strictly:

1.  **Spouse's Share:**
    *   **Husband (if deceased is female):** Receives 1/2 if there are no descendants (children, grandchildren). Receives 1/4 if there are descendants.
    *   **Wife/Wives (if deceased is male):** Collectively receive 1/4 if there are no descendants. Collectively receive 1/8 if there are descendants. The share is divided equally among all wives.

2.  **Parents' Shares:**
    *   **Mother:** Receives 1/6 if the deceased has descendants or siblings. Receives 1/3 if there are no descendants and no siblings.
    *   **Father:** Receives 1/6 if the deceased has male descendants (son, grandson). If there are only female descendants (daughters), the father receives 1/6 plus any residue. If there are no descendants at all, the father becomes the primary residuary heir (Asaba) and takes all remaining property after other fixed-share heirs are paid.

3.  **Descendants' Shares (Children):**
    *   **Sons & Daughters (Residuaries - Asaba):** If sons exist, they and the daughters share the remainder of the estate in a 2:1 ratio (a son gets double the share of a daughter).
    *   **Daughters Only (No Sons):**
        *   One daughter receives a fixed share of 1/2.
        *   Two or more daughters collectively receive a fixed share of 2/3, divided equally among them.
        *   Any remaining residue after daughters and other fixed-share heirs are paid goes to the next closest male relative (e.g., the father).

4.  **Heir Blocking (Hujub):**
    *   The presence of a son blocks all grandchildren, brothers, and sisters.
    *   The presence of the father blocks all brothers and sisters.

When a user asks for a partition calculation, provide a step-by-step breakdown of how you arrived at the shares and then give the final share for each heir. Be precise and clear.
`;
        }

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
                temperature: mode === 'db' ? 0.2 : 0.7,
                max_tokens: 4096,
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
