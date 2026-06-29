import { GoogleGenAI, Type } from '@google/genai';
import { env, hasFallback } from './env.js';
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

/** Map Gemini-format contents (+ system) to OpenAI-compatible chat messages. */
function toOpenAIMessages(systemInstruction: string, contents: Content[]) {
  return [
    { role: 'system', content: systemInstruction },
    ...contents.map((c) => ({
      role: c.role === 'model' ? 'assistant' : 'user',
      content: c.parts.map((p) => p.text).join(''),
    })),
  ];
}

// ---- Gemini (primary) ----

async function geminiStream(
  systemInstruction: string,
  contents: Content[],
  onToken: (text: string) => void,
): Promise<string> {
  const stream = await ai.models.generateContentStream({
    model: env.geminiModel,
    contents,
    config: { systemInstruction, temperature: 0.8, maxOutputTokens: 1200 },
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

async function geminiJson<T>(
  systemInstruction: string,
  userPrompt: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  responseSchema: any,
): Promise<T> {
  const res = await ai.models.generateContent({
    model: env.geminiModel,
    contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
    config: { systemInstruction, temperature: 0.7, responseMimeType: 'application/json', responseSchema },
  });
  return JSON.parse(res.text ?? '{}') as T;
}

// ---- OpenAI-compatible fallback (e.g. Groq / OpenRouter, free) ----

async function fallbackStream(
  systemInstruction: string,
  contents: Content[],
  onToken: (text: string) => void,
): Promise<string> {
  const res = await fetch(`${env.fallbackBaseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${env.fallbackApiKey}`,
    },
    body: JSON.stringify({
      model: env.fallbackModel,
      messages: toOpenAIMessages(systemInstruction, contents),
      temperature: 0.8,
      max_tokens: 1200,
      stream: true,
    }),
  });
  if (!res.ok || !res.body) throw new Error(`fallback stream failed (${res.status})`);

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let full = '';
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() ?? '';
    for (const line of lines) {
      const s = line.trim();
      if (!s.startsWith('data:')) continue;
      const payload = s.slice(5).trim();
      if (payload === '[DONE]') continue;
      try {
        const j = JSON.parse(payload) as { choices?: { delta?: { content?: string } }[] };
        const t = j.choices?.[0]?.delta?.content;
        if (t) {
          full += t;
          onToken(t);
        }
      } catch {
        // ignore partial frames
      }
    }
  }
  return full;
}

async function fallbackJson<T>(systemInstruction: string, userPrompt: string): Promise<T> {
  const res = await fetch(`${env.fallbackBaseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${env.fallbackApiKey}`,
    },
    body: JSON.stringify({
      model: env.fallbackModel,
      messages: [
        { role: 'system', content: `${systemInstruction}\n\nRespond with ONLY valid minified JSON, no prose.` },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.6,
      response_format: { type: 'json_object' },
    }),
  });
  if (!res.ok) throw new Error(`fallback json failed (${res.status})`);
  const data = (await res.json()) as { choices?: { message?: { content?: string } }[] };
  return JSON.parse(data.choices?.[0]?.message?.content ?? '{}') as T;
}

// ---- Public API: Gemini primary, fallback on failure (if configured) ----

/**
 * Streams a model response token-by-token. Tries Gemini first; if it fails
 * BEFORE emitting anything and a fallback is configured, retries on the
 * fallback provider so a single outage/rate-limit never breaks the experience.
 */
export async function streamText(
  systemInstruction: string,
  contents: Content[],
  onToken: (text: string) => void,
): Promise<string> {
  let emitted = 0;
  const counting = (t: string) => {
    emitted += t.length;
    onToken(t);
  };
  try {
    return await geminiStream(systemInstruction, contents, counting);
  } catch (err) {
    if (hasFallback && emitted === 0) {
      console.warn('[llm] Gemini stream failed, using fallback:', (err as Error)?.message);
      return await fallbackStream(systemInstruction, contents, onToken);
    }
    throw err;
  }
}

/** One-shot structured JSON. Gemini (with schema) primary, fallback on failure. */
export async function generateJson<T>(
  systemInstruction: string,
  userPrompt: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  responseSchema: any,
): Promise<T> {
  try {
    return await geminiJson<T>(systemInstruction, userPrompt, responseSchema);
  } catch (err) {
    if (hasFallback) {
      console.warn('[llm] Gemini JSON failed, using fallback:', (err as Error)?.message);
      return await fallbackJson<T>(systemInstruction, userPrompt);
    }
    throw err;
  }
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

/** Rolling long-term memory: a compact summary + durable facts. */
export const memorySchema = {
  type: Type.OBJECT,
  properties: {
    summary: { type: Type.STRING },
    learned: { type: Type.ARRAY, items: { type: Type.STRING } },
  },
  required: ['summary', 'learned'],
};
