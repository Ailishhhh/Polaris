import { fetch as expoFetch } from 'expo/fetch';
import { config } from './config';
import { getAccessToken } from './supabase';
import type { ChatRole, GoalContext, MentorMemory, Roadmap } from '@/types';

/**
 * Client for the Polaris mentor backend (Node/Express on Render). The chat
 * endpoint streams tokens over SSE; roadmap/checkin return structured JSON.
 *
 * We use `expo/fetch` because it supports streaming response bodies in React
 * Native, which the global fetch does not.
 */

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status?: number,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

async function authHeaders(): Promise<Record<string, string>> {
  const token = await getAccessToken();
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export interface StreamHandlers {
  onToken: (chunk: string) => void;
  onDone?: (full: string) => void;
  onError?: (err: Error) => void;
  signal?: AbortSignal;
}

export interface ChatTurn {
  role: ChatRole;
  content: string;
}

/**
 * Streams a mentor reply. Sends the memory packet + recent history so the
 * mentor always responds with full context. Resolves with the complete text.
 */
export async function streamMentorReply(
  params: { memory: MentorMemory; history: ChatTurn[]; message: string },
  handlers: StreamHandlers,
): Promise<string> {
  const headers = await authHeaders();
  let full = '';

  try {
    const res = await expoFetch(`${config.apiUrl}/api/chat`, {
      method: 'POST',
      headers,
      body: JSON.stringify(params),
      signal: handlers.signal,
    });

    if (!res.ok || !res.body) {
      throw new ApiError(`Chat request failed (${res.status})`, res.status);
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    // eslint-disable-next-line no-constant-condition
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });

      // SSE frames are separated by a blank line.
      const frames = buffer.split('\n\n');
      buffer = frames.pop() ?? '';

      for (const frame of frames) {
        const line = frame.trim();
        if (!line.startsWith('data:')) continue;
        const payload = line.slice(5).trim();
        if (payload === '[DONE]') continue;
        try {
          const evt = JSON.parse(payload) as { type: string; value?: string; message?: string };
          if (evt.type === 'token' && evt.value) {
            full += evt.value;
            handlers.onToken(evt.value);
          } else if (evt.type === 'error') {
            throw new ApiError(evt.message ?? 'stream error');
          }
        } catch (e) {
          if (e instanceof ApiError) throw e;
          // Ignore malformed keep-alive frames.
        }
      }
    }

    handlers.onDone?.(full);
    return full;
  } catch (err) {
    const error = err instanceof Error ? err : new Error(String(err));
    handlers.onError?.(error);
    throw error;
  }
}

/**
 * Asks the backend to turn a goal + onboarding context into a structured
 * roadmap (phases -> milestones). Returns parsed JSON.
 */
export async function generateRoadmap(params: {
  goalTitle: string;
  category: string;
  context: GoalContext;
}): Promise<{ overview: string; phases: RoadmapDraftPhase[] }> {
  const headers = await authHeaders();
  const res = await fetch(`${config.apiUrl}/api/roadmap`, {
    method: 'POST',
    headers,
    body: JSON.stringify(params),
  });
  if (!res.ok) throw new ApiError(`Roadmap generation failed (${res.status})`, res.status);
  return (await res.json()) as { overview: string; phases: RoadmapDraftPhase[] };
}

export interface RoadmapDraftPhase {
  title: string;
  description: string;
  milestones: { title: string; description: string }[];
}

/** Generates today's tasks from the roadmap + recent progress. */
export async function generateDailyTasks(params: {
  memory: MentorMemory;
}): Promise<{ title: string; detail: string; milestoneHint: string | null }[]> {
  const headers = await authHeaders();
  const res = await fetch(`${config.apiUrl}/api/tasks`, {
    method: 'POST',
    headers,
    body: JSON.stringify(params),
  });
  if (!res.ok) throw new ApiError(`Task generation failed (${res.status})`, res.status);
  const data = (await res.json()) as {
    tasks: { title: string; detail: string; milestoneHint: string | null }[];
  };
  return data.tasks;
}

/** Sends a daily check-in and gets an adaptive mentor reply (non-streamed). */
export async function sendCheckIn(params: {
  memory: MentorMemory;
  mood: number | null;
  note: string;
}): Promise<{ reply: string }> {
  const headers = await authHeaders();
  const res = await fetch(`${config.apiUrl}/api/checkin`, {
    method: 'POST',
    headers,
    body: JSON.stringify(params),
  });
  if (!res.ok) throw new ApiError(`Check-in failed (${res.status})`, res.status);
  return (await res.json()) as { reply: string };
}

export type { Roadmap };
