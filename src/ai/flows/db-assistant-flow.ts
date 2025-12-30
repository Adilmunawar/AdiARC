
'use server';
/**
 * @fileOverview A flow for the Virtual DB Assistant.
 *
 * - askDbAssistant - A function that takes a user's question and returns an AI-generated answer.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import fs from 'fs';
import path from 'path';

// Read the schema file content directly from the filesystem.
const schemaPath = path.join(process.cwd(), 'src', 'ai', 'schema', 'lrims_schema.txt');
const lrimsSchema = fs.readFileSync(schemaPath, 'utf-8');


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
        let systemPrompt = "You are a helpful general assistant.";

        if (mode === 'db') {
            systemPrompt = `You are a virtual database assistant for the Land Records Management Information System (LRIMS). 
Your purpose is to help users understand the database schema, answer questions about it, and generate SQL queries.

You have been provided with the complete database schema below. Use this schema as your single source of truth. 
Do not invent tables or columns that are not in the schema. When generating SQL, use the exact table and column names provided.

When a user asks a question, provide a clear, concise answer based on the schema. If they ask for a query, provide a valid SQL query that works with the given schema.

Here is the LRIMS database schema:
---
${lrimsSchema}
---
`;
        }

        const llmResponse = await ai.generate({
            model: 'gemini-2.5-flash',
            prompt: prompt,
            system: systemPrompt,
            config: {
              temperature: mode === 'db' ? 0.3 : 0.7, 
            }
        });

        return llmResponse.text;
    }
);
