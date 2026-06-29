import 'dotenv/config';

function get(name: string, fallback?: string): string {
  const v = process.env[name] ?? fallback;
  if (v === undefined) {
    throw new Error(`Missing required env var: ${name}`);
  }
  return v;
}

export const env = {
  port: Number(process.env.PORT ?? 8787),
  geminiApiKey: get('GEMINI_API_KEY', ''),
  geminiModel: process.env.GEMINI_MODEL ?? 'gemini-2.5-flash',
  // Comma-separated allowlist; '*' allows all (fine for a public growth app API).
  corsOrigins: (process.env.CORS_ORIGINS ?? '*').split(',').map((s) => s.trim()),
  nodeEnv: process.env.NODE_ENV ?? 'development',

  /**
   * OPTIONAL free fallback provider (OpenAI-compatible). Activates only if both
   * a base URL and key are set — otherwise we run Gemini-only at zero cost.
   * Recommended free option: Groq.
   *   FALLBACK_BASE_URL=https://api.groq.com/openai/v1
   *   FALLBACK_API_KEY=gsk_...        (free, no credit card)
   *   FALLBACK_MODEL=llama-3.3-70b-versatile
   */
  fallbackBaseUrl: (process.env.FALLBACK_BASE_URL ?? '').replace(/\/$/, ''),
  fallbackApiKey: process.env.FALLBACK_API_KEY ?? '',
  fallbackModel: process.env.FALLBACK_MODEL ?? 'llama-3.3-70b-versatile',

  /**
   * Which provider to try FIRST: 'gemini' (default) or 'fallback'. Gemini's
   * free tier is very limited (~20 req/day on 2.5-flash), so for a real free
   * deployment set LLM_PRIMARY=fallback and point the fallback at Groq
   * (~14,400 req/day, free) — Gemini then becomes the backup.
   */
  llmPrimary: (process.env.LLM_PRIMARY ?? 'gemini').toLowerCase(),
};

export const hasFallback = Boolean(env.fallbackBaseUrl && env.fallbackApiKey);

if (!env.geminiApiKey) {
  console.warn('[env] GEMINI_API_KEY is not set — AI endpoints will fail until configured.');
}
if (hasFallback) {
  console.log(`[env] Fallback LLM enabled: ${env.fallbackModel} @ ${env.fallbackBaseUrl}`);
}
