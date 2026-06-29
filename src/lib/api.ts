import { fetch as expoFetch } from 'expo/fetch';
import { config } from './config';
import { getAccessToken } from './supabase';
import type { ChatRole, GoalContext, MentorMemory, OnboardingSketch, Roadmap } from '@/types';

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
  /** Non-token/error SSE events (e.g. the onboarding 'profile' event). */
  onEvent?: (evt: { type: string; [key: string]: unknown }) => void;
  signal?: AbortSignal;
}

export interface ChatTurn {
  role: ChatRole;
  content: string;
}

/**
 * Core SSE consumer. POSTs to a streaming endpoint and feeds tokens to the
 * handlers as they arrive. Uses `expo/fetch` because the global fetch in React
 * Native can't stream a response body. Resolves with the full accumulated text.
 */
async function consumeStream(
  path: string,
  body: unknown,
  handlers: StreamHandlers,
): Promise<string> {
  const headers = await authHeaders();
  let full = '';

  try {
    const res = await expoFetch(`${config.apiUrl}${path}`, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
      signal: handlers.signal,
    });

    if (!res.ok || !res.body) {
      throw new ApiError(`Request to ${path} failed (${res.status})`, res.status);
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
          } else if (evt.type !== 'done') {
            handlers.onEvent?.(evt as { type: string; [key: string]: unknown });
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
 * Streams a mentor reply. Sends the memory packet + recent history so the
 * mentor always responds with full context. Resolves with the complete text.
 */
export async function streamMentorReply(
  params: { memory: MentorMemory; history: ChatTurn[]; message: string },
  handlers: StreamHandlers,
): Promise<string> {
  return consumeStream('/api/chat', params, handlers);
}

/** Proactive "what to focus on now" one-liner for the Today surface (streamed). */
export function streamBriefing(memory: MentorMemory, handlers: StreamHandlers): Promise<string> {
  return consumeStream('/api/briefing', { memory }, handlers);
}

/** Generative how-to coaching for a tapped milestone (streamed). */
export function streamCoach(
  params: { memory: MentorMemory; milestoneTitle: string; milestoneDescription?: string },
  handlers: StreamHandlers,
): Promise<string> {
  return consumeStream('/api/coach', params, handlers);
}

/** Reflective progress insight for the Progress surface (streamed). */
export function streamInsight(memory: MentorMemory, handlers: StreamHandlers): Promise<string> {
  return consumeStream('/api/insight', { memory }, handlers);
}

/**
 * Organic onboarding: streams a natural reply and surfaces the silently-inferred
 * profile sketch via `onProfile` as the mentor learns who the user is.
 */
export function streamOnboarding(
  params: { history: ChatTurn[]; message: string },
  handlers: StreamHandlers & { onProfile?: (sketch: OnboardingSketch) => void },
): Promise<string> {
  return consumeStream('/api/onboard', params, {
    ...handlers,
    onEvent: (evt) => {
      if (evt.type === 'profile' && evt.profile) {
        handlers.onProfile?.(evt.profile as OnboardingSketch);
      }
      handlers.onEvent?.(evt);
    },
  });
}

export interface RoadmapDraftPhase {
  title: string;
  description: string;
  milestones: { title: string; description: string }[];
}

/**
 * POST JSON to the backend with an abort timeout and a clear, actionable error
 * if the server can't be reached (the #1 local-dev failure: API_URL pointing at
 * localhost so the phone can't reach the laptop, or a firewall blocking it).
 */
async function postJson<T>(path: string, body: unknown, timeoutMs = 60000): Promise<T> {
  const headers = await authHeaders();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(`${config.apiUrl}${path}`, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    if (!res.ok) {
      throw new ApiError(`Backend returned ${res.status} for ${path}`, res.status);
    }
    return (await res.json()) as T;
  } catch (err) {
    if (err instanceof ApiError) throw err;
    const name = err instanceof Error ? err.name : '';
    if (name === 'AbortError') {
      throw new ApiError(
        `The mentor backend didn't respond in time. Make sure it's running and that ` +
          `EXPO_PUBLIC_API_URL (${config.apiUrl}) is reachable from your phone.`,
      );
    }
    throw new ApiError(
      `Couldn't reach the mentor backend at ${config.apiUrl}. Check it's running and on the same network.`,
    );
  } finally {
    clearTimeout(timer);
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
  return postJson('/api/roadmap', params, 90000);
}

/** Generates today's tasks from the roadmap + recent progress. */
export async function generateDailyTasks(params: {
  memory: MentorMemory;
}): Promise<{ title: string; detail: string; milestoneHint: string | null }[]> {
  const data = await postJson<{
    tasks: { title: string; detail: string; milestoneHint: string | null }[];
  }>('/api/tasks', params);
  return data.tasks;
}

/** Sends a daily check-in and gets an adaptive mentor reply (non-streamed). */
export async function sendCheckIn(params: {
  memory: MentorMemory;
  mood: number | null;
  note: string;
}): Promise<{ reply: string }> {
  return postJson<{ reply: string }>('/api/checkin', params);
}

/** Folds the latest exchange into long-term memory (rolling summary + facts). */
export async function consolidateMemory(params: {
  recentTurns: ChatTurn[];
  currentSummary?: string | null;
  currentLearned?: string[] | null;
}): Promise<{ summary: string; learned: string[] }> {
  return postJson('/api/consolidate', params, 30000);
}

export type { Roadmap };
