import { Router, type Request, type Response } from 'express';
import {
  generateJson,
  roadmapSchema,
  streamText,
  tasksSchema,
  toContents,
} from '../gemini.js';
import {
  checkinSystemPrompt,
  mentorSystemPrompt,
  roadmapSystemPrompt,
  tasksSystemPrompt,
} from '../prompts.js';
import type { ChatTurn, MentorMemory } from '../types.js';

export const api = Router();

/** Trim history so prompts stay bounded; the memory packet carries long-term context. */
function recentHistory(history: ChatTurn[], max = 16): ChatTurn[] {
  return Array.isArray(history) ? history.slice(-max) : [];
}

/**
 * POST /api/chat — streams the mentor's reply over SSE.
 * Body: { memory, history, message }
 */
api.post('/chat', async (req: Request, res: Response) => {
  const { memory, history, message } = req.body as {
    memory: MentorMemory;
    history: ChatTurn[];
    message: string;
  };

  if (!memory || !message) {
    res.status(400).json({ error: 'memory and message are required' });
    return;
  }

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders?.();

  const send = (obj: unknown) => res.write(`data: ${JSON.stringify(obj)}\n\n`);

  // Keep-alive ping so proxies don't close an idle connection mid-thought.
  const ping = setInterval(() => res.write(': ping\n\n'), 15000);

  try {
    const contents = toContents([
      ...recentHistory(history),
      { role: 'user', content: message },
    ]);

    await streamText(mentorSystemPrompt(memory), contents, (token) => {
      send({ type: 'token', value: token });
    });

    send({ type: 'done' });
    res.write('data: [DONE]\n\n');
  } catch (err) {
    console.error('[chat] error', err);
    send({ type: 'error', message: 'The mentor hit a snag. Try again.' });
  } finally {
    clearInterval(ping);
    res.end();
  }
});

/**
 * POST /api/roadmap — turns a goal + context into a structured roadmap.
 * Body: { goalTitle, category, context }
 */
api.post('/roadmap', async (req: Request, res: Response) => {
  const { goalTitle, category, context } = req.body as {
    goalTitle: string;
    category: string;
    context: Record<string, unknown>;
  };
  if (!goalTitle) {
    res.status(400).json({ error: 'goalTitle is required' });
    return;
  }

  try {
    const userPrompt = `Goal: ${goalTitle}\nCategory: ${category}\nContext: ${JSON.stringify(
      context ?? {},
    )}\n\nDesign the roadmap now.`;
    const data = await generateJson(roadmapSystemPrompt(), userPrompt, roadmapSchema);
    res.json(data);
  } catch (err) {
    console.error('[roadmap] error', err);
    res.status(502).json({ error: 'Failed to generate roadmap' });
  }
});

/**
 * POST /api/tasks — generates today's tasks from memory.
 * Body: { memory }
 */
api.post('/tasks', async (req: Request, res: Response) => {
  const { memory } = req.body as { memory: MentorMemory };
  if (!memory) {
    res.status(400).json({ error: 'memory is required' });
    return;
  }
  try {
    const data = await generateJson<{ tasks: unknown[] }>(
      tasksSystemPrompt(memory),
      'Generate the 3 daily tasks now.',
      tasksSchema,
    );
    res.json(data);
  } catch (err) {
    console.error('[tasks] error', err);
    res.status(502).json({ error: 'Failed to generate tasks' });
  }
});

/**
 * POST /api/checkin — adaptive mentor reply to a daily check-in.
 * Body: { memory, mood, note }
 */
api.post('/checkin', async (req: Request, res: Response) => {
  const { memory, mood, note } = req.body as {
    memory: MentorMemory;
    mood: number | null;
    note: string;
  };
  if (!memory) {
    res.status(400).json({ error: 'memory is required' });
    return;
  }
  try {
    let reply = '';
    const contents = toContents([
      {
        role: 'user',
        content: `Daily check-in. Mood: ${mood ?? 'n/a'}/5. Note: ${note || '(none)'}`,
      },
    ]);
    reply = await streamText(checkinSystemPrompt(memory), contents, () => {});
    res.json({ reply });
  } catch (err) {
    console.error('[checkin] error', err);
    res.status(502).json({ error: 'Failed to process check-in' });
  }
});
