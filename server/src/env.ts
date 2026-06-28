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
};

if (!env.geminiApiKey) {
  console.warn('[env] GEMINI_API_KEY is not set — AI endpoints will fail until configured.');
}
