import type { NextFunction, Request, Response } from 'express';
import { authEnabled, env } from './env.js';

/** Attach the verified user id to the request. */
export interface AuthedRequest extends Request {
  userId?: string;
}

// Small in-memory token -> userId cache so we don't hit Supabase every request.
const tokenCache = new Map<string, { userId: string; exp: number }>();
const TOKEN_TTL_MS = 5 * 60 * 1000;

/**
 * Verifies the caller's Supabase access token (works for anonymous AND
 * permanent users) by asking Supabase who it belongs to. Rejects missing or
 * invalid tokens so the public API can't be abused. If Supabase isn't
 * configured (local dev), it no-ops.
 */
export async function requireAuth(req: AuthedRequest, res: Response, next: NextFunction) {
  if (!authEnabled) return next();

  const header = req.headers.authorization;
  const token = header?.startsWith('Bearer ') ? header.slice(7).trim() : null;
  if (!token) {
    res.status(401).json({ error: 'Authentication required' });
    return;
  }

  const cached = tokenCache.get(token);
  if (cached && cached.exp > Date.now()) {
    req.userId = cached.userId;
    return next();
  }

  try {
    const r = await fetch(`${env.supabaseUrl}/auth/v1/user`, {
      headers: { apikey: env.supabaseAnonKey, Authorization: `Bearer ${token}` },
    });
    if (!r.ok) {
      res.status(401).json({ error: 'Invalid or expired session' });
      return;
    }
    const user = (await r.json()) as { id?: string };
    if (!user.id) {
      res.status(401).json({ error: 'Invalid session' });
      return;
    }
    // Keep the cache from growing unbounded.
    if (tokenCache.size > 5000) tokenCache.clear();
    tokenCache.set(token, { userId: user.id, exp: Date.now() + TOKEN_TTL_MS });
    req.userId = user.id;
    next();
  } catch (err) {
    console.error('[auth] verification error', err);
    res.status(401).json({ error: 'Could not verify session' });
  }
}

// Sliding-window rate limiter keyed by user (falls back to IP).
const hits = new Map<string, number[]>();

export function rateLimit({ windowMs, max }: { windowMs: number; max: number }) {
  return (req: AuthedRequest, res: Response, next: NextFunction) => {
    const key = req.userId || req.ip || 'anon';
    const now = Date.now();
    const recent = (hits.get(key) ?? []).filter((t) => t > now - windowMs);
    if (recent.length >= max) {
      res.status(429).json({ error: 'Too many requests — slow down a moment.' });
      return;
    }
    recent.push(now);
    hits.set(key, recent);
    if (hits.size > 10000) {
      // occasional cleanup
      for (const [k, v] of hits) if (v.every((t) => t <= now - windowMs)) hits.delete(k);
    }
    next();
  };
}
