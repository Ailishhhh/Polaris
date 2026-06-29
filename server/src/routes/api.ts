import { Router, type Request, type Response } from 'express';
import {
  generateJson,
  memorySchema,
  roadmapSchema,
  sketchSchema,
  streamText,
  tasksSchema,
  toContents,
} from '../gemini.js';
import {
  checkinSystemPrompt,
  briefingSystemPrompt,
  coachSystemPrompt,
  consolidatePrompt,
  extractSketchPrompt,
  insightSystemPrompt,
  mentorSystemPrompt,
  onboardSystemPrompt,
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
 * Streams a single-shot mentor message over SSE given a system instruction and
 * one user prompt. Shared by the proactive AI surfaces (briefing/coach/insight).
 */
async function streamSSE(
  res: Response,
  systemInstruction: string,
  userPrompt: string,
  tag: string,
) {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders?.();

  const send = (obj: unknown) => res.write(`data: ${JSON.stringify(obj)}\n\n`);
  const ping = setInterval(() => res.write(': ping\n\n'), 15000);

  try {
    await streamText(systemInstruction, toContents([{ role: 'user', content: userPrompt }]), (token) =>
      send({ type: 'token', value: token }),
    );
    send({ type: 'done' });
    res.write('data: [DONE]\n\n');
  } catch (err) {
    console.error(`[${tag}] error`, err);
    send({ type: 'error', message: 'The mentor hit a snag. Try again.' });
  } finally {
    clearInterval(ping);
    res.end();
  }
}

function partOfDay(): string {
  const h = new Date().getHours();
  if (h < 12) return 'morning';
  if (h < 18) return 'afternoon';
  return 'evening';
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


/**
 * POST /api/briefing — a proactive, ambient one-liner for the Today surface.
 * Body: { memory }  (SSE stream)
 */
api.post('/briefing', async (req: Request, res: Response) => {
  const { memory } = req.body as { memory: MentorMemory };
  if (!memory) {
    res.status(400).json({ error: 'memory is required' });
    return;
  }
  await streamSSE(
    res,
    briefingSystemPrompt(memory, partOfDay()),
    'Give me my briefing for right now.',
    'briefing',
  );
});

/**
 * POST /api/coach — generative how-to coaching for a tapped milestone.
 * Body: { memory, milestoneTitle, milestoneDescription }  (SSE stream)
 */
api.post('/coach', async (req: Request, res: Response) => {
  const { memory, milestoneTitle, milestoneDescription } = req.body as {
    memory: MentorMemory;
    milestoneTitle: string;
    milestoneDescription?: string;
  };
  if (!memory || !milestoneTitle) {
    res.status(400).json({ error: 'memory and milestoneTitle are required' });
    return;
  }
  await streamSSE(
    res,
    coachSystemPrompt(memory),
    `Coach me on this milestone: "${milestoneTitle}"${
      milestoneDescription ? ` — ${milestoneDescription}` : ''
    }. How do I actually get this done?`,
    'coach',
  );
});

/**
 * POST /api/insight — a reflective progress insight for the Progress surface.
 * Body: { memory }  (SSE stream)
 */
api.post('/insight', async (req: Request, res: Response) => {
  const { memory } = req.body as { memory: MentorMemory };
  if (!memory) {
    res.status(400).json({ error: 'memory is required' });
    return;
  }
  await streamSSE(res, insightSystemPrompt(memory), 'Reflect on my progress so far.', 'insight');
});


/**
 * POST /api/onboard — organic onboarding. Streams a natural conversational
 * reply, then emits a structured profile-sketch extraction event so the client
 * can quietly learn the user's goal/level/time without a form.
 * Body: { history: ChatTurn[], message: string }  (SSE stream)
 *
 * Events: { type: 'token', value } ...  then { type: 'profile', profile } then { type: 'done' }
 */
api.post('/onboard', async (req: Request, res: Response) => {
  const { history, message } = req.body as { history: ChatTurn[]; message: string };
  if (!message) {
    res.status(400).json({ error: 'message is required' });
    return;
  }

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders?.();

  const send = (obj: unknown) => res.write(`data: ${JSON.stringify(obj)}\n\n`);
  const ping = setInterval(() => res.write(': ping\n\n'), 15000);

  const turns: ChatTurn[] = [...recentHistory(history), { role: 'user', content: message }];

  try {
    // 1) Stream the natural reply.
    const reply = await streamText(onboardSystemPrompt(), toContents(turns), (token) =>
      send({ type: 'token', value: token }),
    );

    // 2) Silently extract what we now know (non-fatal if it fails).
    try {
      const transcript = [...turns, { role: 'assistant' as const, content: reply }]
        .map((t) => `${t.role === 'assistant' ? 'Polaris' : 'User'}: ${t.content}`)
        .join('\n');
      const profile = await generateJson(
        extractSketchPrompt(),
        `Conversation so far:\n${transcript}\n\nExtract what is known now.`,
        sketchSchema,
      );
      send({ type: 'profile', profile });
    } catch (extractErr) {
      console.warn('[onboard] extraction failed (non-fatal)', extractErr);
    }

    send({ type: 'done' });
    res.write('data: [DONE]\n\n');
  } catch (err) {
    console.error('[onboard] error', err);
    send({ type: 'error', message: 'The mentor hit a snag. Try again.' });
  } finally {
    clearInterval(ping);
    res.end();
  }
});


/**
 * POST /api/consolidate — fold the latest exchange into long-term memory.
 * Body: { recentTurns: ChatTurn[], currentSummary?: string, currentLearned?: string[] }
 * Returns: { summary, learned }
 */
api.post('/consolidate', async (req: Request, res: Response) => {
  const { recentTurns, currentSummary, currentLearned } = req.body as {
    recentTurns: ChatTurn[];
    currentSummary?: string;
    currentLearned?: string[];
  };
  if (!Array.isArray(recentTurns) || recentTurns.length === 0) {
    res.status(400).json({ error: 'recentTurns is required' });
    return;
  }
  try {
    const convo = recentTurns
      .map((t) => `${t.role === 'assistant' ? 'Polaris' : 'User'}: ${t.content}`)
      .join('\n');
    const prompt = `Existing summary:\n${currentSummary || '(none yet)'}\n\nExisting facts:\n${
      (currentLearned ?? []).map((f) => `- ${f}`).join('\n') || '(none yet)'
    }\n\nLatest conversation:\n${convo}\n\nProduce the updated memory.`;
    const data = await generateJson<{ summary: string; learned: string[] }>(
      consolidatePrompt(),
      prompt,
      memorySchema,
    );
    res.json(data);
  } catch (err) {
    console.error('[consolidate] error', err);
    res.status(502).json({ error: 'Failed to consolidate memory' });
  }
});
