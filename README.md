# The Studio

An AI-team command center for a solo creator brand: an idea backlog (video, micro-SaaS, gadget, and newsletter research), five specialized AI roles that draft and distribute that content, and lightweight tracking for channels and performance. You stay the face of the brand and the approver of everything published; the roster drafts, you decide.

## System architecture

- **Framework**: Next.js 14 (App Router), TypeScript, Tailwind CSS
- **Database**: PostgreSQL via Prisma ORM
- **Auth**: NextAuth (Credentials provider, JWT sessions) — single founder account for the MVP
- **AI**: Anthropic API, called server-side only, never from the client
- **Deployment target**: Vercel + a managed Postgres (Neon/Supabase/Vercel Postgres)

```
Browser (dashboard UI)
   -> Next.js Route Handlers (/api/*)
       -> Prisma -> Postgres        (ideas, drafts, roles, runs, digest, channels, metrics)
       -> Anthropic API             (research / copy / digest / analytics generation)
```

Every AI action goes through one of two entry points:
1. **A role-specific generator** (`/api/ideas/research`, `/api/ideas/[id]/generate-copy`, `/api/newsletter-digest/research`) — structured, JSON-in/JSON-out, writes directly to the relevant tables.
2. **The generic role runner** (`/api/roles/[key]/run`) — a free-form "ask this teammate something" box used on the Roster and Analytics pages.

Every call is logged to `AgentRun` (role, input, output, model, timestamp) so there's a full audit trail of what the AI team produced and when.

## The AI roster

| Role | Key | Does |
|---|---|---|
| Researcher | `researcher` | Proposes video / micro-SaaS / gadget / newsletter ideas on demand |
| Designer | `designer` | Writes visual creative briefs (not image generation — Phase 2) |
| Copywriter | `copywriter` | Drafts scripts and product copy from an idea |
| Social Manager | `social_manager` | Turns one idea into tailored drafts per platform |
| Data Analyst | `data_analyst` | Summarizes logged metric snapshots in plain language |

Role prompts live in `src/lib/ai/roles.ts` — edit the `systemPrompt` strings there to tune voice or add a new role, then re-run the seed.

## Database schema

See `prisma/schema.prisma`. Core tables: `Idea`, `SocialCopyDraft`, `AgentRole`, `AgentRun`, `NewsletterDigestItem`, `Channel`, `MetricSnapshot`, `User`.

## Setup

```bash
npm install
cp .env.example .env   # fill in DATABASE_URL, NEXTAUTH_SECRET, ANTHROPIC_API_KEY, ADMIN_EMAIL, ADMIN_PASSWORD
npx prisma migrate dev --name init
npm run db:seed        # seeds the 5 roles, 6 channels, your admin login, and starter ideas
npm run dev
```

Visit `http://localhost:3000/login` and sign in with `ADMIN_EMAIL` / `ADMIN_PASSWORD`.

## What's MVP vs. Phase 2

Built now (the core loop, per the sequential/validate-first approach this brand runs on):
- Idea backlog with AI research generation, by type
- Per-idea, per-platform copy drafting and approval workflow
- Weekly newsletter digest research and include/skip triage
- Channel setup tracking
- Manual metrics logging with an AI-generated summary
- Full audit log of every AI generation

Deliberately deferred, so the MVP stayed shippable instead of speculative:
- **Actual publishing** to social platforms (each one needs its own OAuth app and API — real integration work, not a config flag)
- **Image generation** for the Designer role (the role writes the creative brief; wiring it to an image model is a follow-on)
- **Live analytics ingestion** (currently manual entry; connecting real platform APIs is Phase 2)
- **Multi-user / team accounts** (single founder account for now; the schema doesn't block adding this later)

## Deploying

1. Push this repo to GitHub.
2. Import into Vercel, add the environment variables from `.env.example`.
3. Provision a Postgres database (Neon or Vercel Postgres both work) and set `DATABASE_URL`.
4. Run `npx prisma migrate deploy` against production, then `npm run db:seed` once to create your admin login.
