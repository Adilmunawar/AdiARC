'use server';

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import fs from 'fs';
import path from 'path';

// Configuration for OpenRouter
const OPENROUTER_API_KEY = "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";
const SITE_URL = "https://adilarc.vercel.app";
const SITE_NAME = "AdiARC";
const MODEL_ID = "google/gemma-3-4b-it:free";

const DbAssistantInputSchema = z.object({
    prompt: z.string(),
    mode: z.enum(['normal', 'db']),
});
const DbAssistantOutputSchema = z.string();

function getLrimsSchema() {
    try {
        const schemaPath = path.join(process.cwd(), 'src', 'ai', 'schema', 'lrims_schema.txt');
        if (fs.existsSync(schemaPath)) {
            return fs.readFileSync(schemaPath, 'utf-8');
        }
        return "Schema file not found.";
    } catch (error) {
        console.error("Error reading schema:", error);
        return "Error reading schema file.";
    }
}

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
            const schemaContent = getLrimsSchema();
            systemPrompt = `You are a virtual database assistant for the Land Records Management Information System (LRIMS). 
Your purpose is to help users understand the database schema, answer questions about it, and generate SQL queries.

You have been provided with the complete database schema below. Use this schema as your single source of truth. 
Do not invent tables or columns that are not in the schema. When generating SQL, use the exact table and column names provided.

Here is the LRIMS database schema:
---
${schemaContent}
---
`;
        }

        try {
            const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
                    "HTTP-Referer": SITE_URL,
                    "X-Title": SITE_NAME,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
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
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                console.error("OpenRouter API Error:", errorData);
                return `Error: ${response.statusText}. Please check server logs.`;
            }

            const data = await response.json();
            return data.choices[0]?.message?.content || "No response received from AI.";

        } catch (error) {
            console.error("Fetch Error:", error);
            return "An error occurred while connecting to the AI service.";
        }
    }
);
