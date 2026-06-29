import { GoogleGenAI, Type } from '@google/genai';
import { env } from './env.js';
import type { ChatTurn } from './types.js';

const ai = new GoogleGenAI({ apiKey: env.geminiApiKey });

type Content = { role: 'user' | 'model'; parts: { text: string }[] };

/** Convert app chat turns into Gemini's content format. */
export function toContents(turns: ChatTurn[]): Content[] {
  return turns
    .filter((t) => t.role !== 'system')
    .map((t) => ({
      role: t.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: t.content }],
    }));
}

/**
 * Streams a model response token-by-token, invoking onToken for each chunk.
 * Returns the full accumulated text.
 */
export async function streamText(
  systemInstruction: string,
  contents: Content[],
  onToken: (text: string) => void,
): Promise<string> {
  const stream = await ai.models.generateContentStream({
    model: env.geminiModel,
    contents,
    config: {
      systemInstruction,
      temperature: 0.8,
      maxOutputTokens: 1200,
    },
  });

  let full = '';
  for await (const chunk of stream) {
    const text = chunk.text;
    if (text) {
      full += text;
      onToken(text);
    }
  }
  return full;
}

/** One-shot structured JSON generation against a response schema. */
export async function generateJson<T>(
  systemInstruction: string,
  userPrompt: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  responseSchema: any,
): Promise<T> {
  const res = await ai.models.generateContent({
    model: env.geminiModel,
    contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
    config: {
      systemInstruction,
      temperature: 0.7,
      responseMimeType: 'application/json',
      responseSchema,
    },
  });
  const text = res.text ?? '{}';
  return JSON.parse(text) as T;
}

// ---- Response schemas ----

export const roadmapSchema = {
  type: Type.OBJECT,
  properties: {
    overview: { type: Type.STRING },
    phases: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          description: { type: Type.STRING },
          milestones: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING },
                description: { type: Type.STRING },
              },
              required: ['title', 'description'],
            },
          },
        },
        required: ['title', 'description', 'milestones'],
      },
    },
  },
  required: ['overview', 'phases'],
};

export const tasksSchema = {
  type: Type.OBJECT,
  properties: {
    tasks: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          detail: { type: Type.STRING },
          milestoneHint: { type: Type.STRING },
        },
        required: ['title', 'detail'],
      },
    },
  },
  required: ['tasks'],
};

/** What we silently infer about the user during organic onboarding. */
export const sketchSchema = {
  type: Type.OBJECT,
  properties: {
    displayName: { type: Type.STRING, nullable: true },
    goalTitle: { type: Type.STRING, nullable: true },
    category: { type: Type.STRING, nullable: true },
    level: { type: Type.STRING, nullable: true },
    weeklyHours: { type: Type.NUMBER, nullable: true },
    motivation: { type: Type.STRING, nullable: true },
    readyToBuild: { type: Type.BOOLEAN },
  },
  required: ['readyToBuild'],
};
