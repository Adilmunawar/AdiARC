
'use server';

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import OpenAI from 'openai';
import wav from 'wav';

// Configuration for OpenRouter
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const MODEL_ID = "google/gemini-flash-1.5";

// Initialize OpenAI Client for OpenRouter - only if the key is present
const openai = OPENROUTER_API_KEY ? new OpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: OPENROUTER_API_KEY,
  maxRetries: 0,
  timeout: 30 * 1000,
  defaultHeaders: {
    "HTTP-Referer": "https://adilarc.vercel.app",
    "X-Title": "Property Consultant",
  }
}) : null;

const MessageSchema = z.object({
    role: z.enum(['user', 'assistant', 'system']),
    content: z.string(),
});

const DbAssistantInputSchema = z.object({
    history: z.array(MessageSchema),
    mode: z.enum(['normal', 'db']),
});

const DbAssistantOutputSchema = z.object({
    text: z.string(),
    audioData: z.string().optional(),
});


export async function askDbAssistant(input: z.infer<typeof DbAssistantInputSchema>): Promise<z.infer<typeof DbAssistantOutputSchema>> {
    const result = await dbAssistantFlow(input);
    return result;
}

async function toWav(
  pcmData: Buffer,
  channels = 1,
  rate = 24000,
  sampleWidth = 2
): Promise<string> {
  return new Promise((resolve, reject) => {
    const writer = new wav.Writer({
      channels,
      sampleRate: rate,
      bitDepth: sampleWidth * 8,
    });

    let bufs: any[] = [];
    writer.on('error', reject);
    writer.on('data', function (d) {
      bufs.push(d);
    });
    writer.on('end', function () {
      resolve(Buffer.concat(bufs).toString('base64'));
    });

    writer.write(pcmData);
    writer.end();
  });
}

const dbAssistantFlow = ai.defineFlow(
    {
        name: 'dbAssistantFlow',
        inputSchema: DbAssistantInputSchema,
        outputSchema: DbAssistantOutputSchema,
    },
    async ({ history, mode }) => {
        if (!openai) {
            const errorMessage = "OpenRouter API key is not configured. Please set OPENROUTER_API_KEY in your environment variables.";
            console.error(errorMessage);
            return { text: errorMessage };
        }

        let systemPrompt = `You are an expert AI Property Consultant specializing in Pakistani property law and real estate. Your name is Property Consultant.
You MUST always respond in URDU.
Your expertise includes:
- Property transfer procedures (sale, gift, inheritance).
- Taxation (Capital Gains Tax, Stamp Duty, etc.) for property transactions in Punjab, Sindh, KPK, and Balochistan.
- Terminology used in property documents (e.g., Fard, Inteqal, Khewat, Khatuni).
- Legal regulations for buying and selling property for residents and overseas Pakistanis.
- General advice on property verification and due diligence.

When a user asks a question, provide a clear, accurate, and concise answer in URDU. Be polite and professional.`;
        
        if (mode === 'db') {
            systemPrompt = `You are a virtual assistant and an expert in Islamic inheritance law, specifically for land partitions (Wirasat) under Sunni Hanafi jurisprudence.
You MUST always respond in URDU.
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

When a user asks for a partition calculation, provide a step-by-step breakdown in URDU of how you arrived at the shares and then give the final share for each heir. Be precise and clear.
`;
        }

        const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
            {
                role: "system",
                content: systemPrompt
            },
            ...history // Pass the entire conversation history
        ];

        try {
            const completion = await openai.chat.completions.create({
                model: MODEL_ID,
                messages: messages,
                temperature: mode === 'db' ? 0.2 : 0.7,
                max_tokens: 4096,
            });

            const responseText = completion.choices[0]?.message?.content || "AI سے کوئی جواب موصول نہیں ہوا۔";
            
            let audioData;
            try {
                const { media } = await ai.generate({
                    model: 'googleai/gemini-2.5-flash-preview-tts',
                    config: {
                        responseModalities: ['AUDIO'],
                        speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Algenib' } } },
                    },
                    prompt: responseText,
                });
                if (media) {
                    const audioBuffer = Buffer.from(media.url.substring(media.url.indexOf(',') + 1), 'base64');
                    const wavBase64 = await toWav(audioBuffer);
                    audioData = 'data:audio/wav;base64,' + wavBase64;
                }
            } catch (ttsError) {
                console.error("TTS Error:", ttsError);
                // Don't block the response if TTS fails
            }

            return { text: responseText, audioData };

        } catch (error: any) {
            console.error("OpenAI/OpenRouter API Error:", error);
            const errorMessage = `AI سروس سے منسلک ہوتے وقت ایک خرابی پیش آگئی: ${error.message || 'Please check the server logs.'}`;
            return { text: errorMessage };
        }
    }
);
