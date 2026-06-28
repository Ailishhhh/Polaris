# Polaris

**Your AI mentor for any goal.** Name what you want to get good at — trading, art, fitness, coding, exams, a startup, anything — and Polaris turns it into a structured roadmap, mentors you daily, and shows your progress from **0 → 100**.

Polaris is your guiding star. It's chat-first like Claude/ChatGPT/Gemini, but with a moat those tools don't have:

- **Memory** — it remembers your whole journey and references it on every reply.
- **Structure** — vague goals become phases → milestones → today's tasks.
- **Accountability** — daily check-ins, streaks, and nudges that chase you.
- **Progress** — visible momentum so you can feel yourself moving.

ChatGPT answers and forgets. Polaris remembers, structures, and chases.

---

## Tech stack

| Layer | Choice |
| --- | --- |
| App | Expo (SDK 56) + expo-router, TypeScript, Expo Go compatible |
| UI | Design-system-first: theme tokens (light + dark), Fraunces + Inter, Reanimated motion, FlashList, react-native-markdown-display |
| State | Zustand |
| Auth + DB (memory) | Supabase (anonymous + email auth, Postgres with RLS) |
| AI backend | Node/Express on Render calling Google Gemini (`gemini-2.5-flash`) with **SSE streaming** |

> Note: the spec called for SDK 54 to match our other app, but the current Expo Go release runs SDK 56, so the project targets 56. Same architecture, just current.

## Repo layout

```
polaris/
├─ src/
│  ├─ app/              # expo-router routes (auth gate, onboarding, tabs)
│  ├─ components/
│  │  ├─ ui/            # design-system primitives (Text, Button, Surface, MomentumRing…)
│  │  ├─ chat/          # Thread, Composer, MessageBubble, ThinkingIndicator, Markdown
│  │  └─ artifacts/     # RoadmapCard, MilestoneRow, TaskCard (render in-thread + in views)
│  ├─ theme/            # tokens + ThemeProvider + fonts
│  ├─ lib/              # config, supabase, api (streaming), db, memory, haptics
│  ├─ store/            # useAuth, useMentor (orchestrator)
│  └─ types/            # domain model
├─ server/             # Express + Gemini streaming backend (deploy to Render)
└─ supabase/           # schema.sql (tables + RLS + triggers)
```

## The MVP

1. **Conversational onboarding** — the mentor asks your goal + a little about you.
2. **AI-generated roadmap** — phases and milestones, rendered as interactive cards.
3. **Today** — daily tasks plus an adaptive check-in.
4. **Mentor chat** — full markdown, streaming responses, copy/regenerate, complete memory.
5. **Progress** — milestones, streak, and an animated 0→100 momentum ring.

---

## Getting started

### 1. Backend (`server/`)

```bash
cd server
cp .env.example .env          # add your GEMINI_API_KEY (https://aistudio.google.com/apikey)
npm install
npm run dev                   # http://localhost:8787  (GET /health to verify)
```

Deploy to Render with the included `server/render.yaml` (free web service), and set `GEMINI_API_KEY` in the Render dashboard.

### 2. Supabase

1. Create a project at [supabase.com](https://supabase.com).
2. Open the **SQL Editor** and run [`supabase/schema.sql`](./supabase/schema.sql).
3. Enable **Anonymous sign-ins** under Authentication → Providers (used for the one-tap "Start your journey" flow).
4. Grab your Project URL + anon key from Project Settings → API.

### 3. App

```bash
cp .env.example .env          # add Supabase keys + your backend URL
npm install
npx expo start                # scan the QR code with Expo Go
```

For Expo Go on a physical device, set `EXPO_PUBLIC_API_URL` to your machine's LAN IP (e.g. `http://192.168.1.20:8787`) — the phone can't reach your laptop's `localhost`.

## Environment variables

**App** (`.env`)

| Var | Description |
| --- | --- |
| `EXPO_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key |
| `EXPO_PUBLIC_API_URL` | Mentor backend base URL |

**Backend** (`server/.env`)

| Var | Description |
| --- | --- |
| `GEMINI_API_KEY` | Google AI Studio key |
| `GEMINI_MODEL` | defaults to `gemini-2.5-flash` |
| `PORT` | defaults to `8787` |
| `CORS_ORIGINS` | comma-separated, or `*` |

## Scripts

```bash
# app
npx tsc --noEmit       # typecheck
npx expo start         # run

# server
npm run dev            # watch
npm run typecheck
npm run build && npm start
```

## Roadmap (post-MVP)

- Push notifications for daily nudges
- Multiple simultaneous goals (premium)
- RevenueCat paywall for deeper coaching + advanced tracking
- Viral share / invite loops

---

Built with Kiro.
