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

// Define schemas
const DbAssistantInputSchema = z.object({
    prompt: z.string(),
    mode: z.enum(['normal', 'db']),
});
const DbAssistantOutputSchema = z.string();

// Helper to safely read the schema at runtime
function getLrimsSchema() {
    try {
        const schemaPath = path.join(process.cwd(), 'src', 'ai', 'schema', 'lrims_schema.txt');
        if (fs.existsSync(schemaPath)) {
            return fs.readFileSync(schemaPath, 'utf-8');
        }
        console.error(`Schema file not found at: ${schemaPath}`);
        return "Error: Schema file not found.";
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

When a user asks a question, provide a clear, concise answer based on the schema. If they ask for a query, provide a valid SQL query that works with the given schema.

Here is the LRIMS database schema:
---
${schemaContent}
---
`;
        }

        // Generate the response using the correct model name
        const llmResponse = await ai.generate({
            model: 'gemini-1.5-flash', // FIXED: Changed from 'gemini-2.5-flash'
            prompt: prompt,
            system: systemPrompt,
            config: {
              temperature: mode === 'db' ? 0.2 : 0.7, 
            }
        });

        return llmResponse.text;
    }
);
