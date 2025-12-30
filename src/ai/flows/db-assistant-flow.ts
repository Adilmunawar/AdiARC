'use server';

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import fs from 'fs';
import path from 'path';

// Define the input and output schemas
const DbAssistantInputSchema = z.object({
    prompt: z.string(),
    mode: z.enum(['normal', 'db']),
});
const DbAssistantOutputSchema = z.string();

// Helper to safely read the schema
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

// The server action called by the UI
export async function askDbAssistant(input: z.infer<typeof DbAssistantInputSchema>): Promise<string> {
    const result = await dbAssistantFlow(input);
    return result;
}

// The Genkit Flow
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

        // Generate the response
        const llmResponse = await ai.generate({
            model: 'gemini-1.5-flash', // Corrected model name
            prompt: prompt,
            system: systemPrompt,
            config: {
              temperature: mode === 'db' ? 0.2 : 0.7, // Lower temp for DB mode to be more precise
            }
        });

        return llmResponse.text;
    }
);
