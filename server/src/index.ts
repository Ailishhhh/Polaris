import express from 'express';
import cors from 'cors';
import { env } from './env.js';
import { api } from './routes/api.js';
import { rateLimit, requireAuth } from './middleware.js';

const app = express();

app.use(
  cors({
    origin: env.corsOrigins.includes('*') ? true : env.corsOrigins,
  }),
);
app.use(express.json({ limit: '1mb' }));

app.get('/health', (_req, res) => {
  res.json({ ok: true, model: env.geminiModel, env: env.nodeEnv });
});

// Every AI route requires a valid Supabase session and is rate-limited per user.
app.use('/api', requireAuth, rateLimit({ windowMs: 10 * 60 * 1000, max: 80 }), api);

app.listen(env.port, () => {
  console.log(`Polaris mentor backend listening on :${env.port} (model: ${env.geminiModel})`);
});
