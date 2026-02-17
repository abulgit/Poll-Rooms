# Real-Time Poll Rooms

A full-stack real-time polling app where users create polls, share them via unique links, and see votes update live across all viewers.

## Tech Stack

| Layer | Technology | Why |
|-------|-----------|-----|
| Frontend | React + TypeScript + Vite | Fast dev, type safety, component reuse |
| UI | Tailwind CSS + shadcn/ui | Modern, accessible, minimal custom CSS |
| Backend | Express + TypeScript (Bun runtime) | Bun speed + Express middleware ecosystem |
| Database | PostgreSQL (Neon) | ACID compliance, unique constraints for vote integrity |
| ORM | Prisma | Auto-generated types, migration management |
| Real-time | Server-Sent Events (SSE) | Unidirectional (server→client), auto-reconnect, HTTP-native |

### Why SSE over WebSockets?

SSE is simpler, uses standard HTTP, reconnects automatically, and fits perfectly since data only flows server→client. WebSockets would be overkill for this use case.

## Setup

### Prerequisites

- [Bun](https://bun.sh) v1.0+
- A PostgreSQL database (e.g. [Neon](https://neon.tech) free tier)

### 1. Clone & install

```bash
git clone <repo-url> && cd poll-app

cd server && bun install
cd ../client && bun install
```

### 2. Configure environment

```bash
cp server/.env.example server/.env
```

Edit `server/.env` with your Neon database URLs.

### 3. Run database migrations

```bash
cd server
bun run db:generate
bun run db:migrate
```

### 4. Start development

```bash
# Terminal 1 — Backend
cd server && bun run dev

# Terminal 2 — Frontend
cd client && bun run dev
```

Frontend runs on `http://localhost:5173`, backend on `http://localhost:3000`.

## Anti-Abuse & Security

**Browser Fingerprinting** — Generates a deterministic hash from browser properties (user agent, screen size, timezone, etc.). Enforced via database unique constraint `(poll_id, voter_fingerprint)`. Prevents casual repeat voting.

**IP Rate Limiting** — 3 votes per IP per poll per hour, 10 poll creations per IP per day. Prevents script-based flooding.

**Proxy-aware IP detection** — `trust proxy` is only enabled in production and restricted to loopback, preventing IP spoofing via `X-Forwarded-For`.

**Request Size Limit** — 10KB body limit on all JSON endpoints.

**Known limitations** — Fingerprinting is client-side and can be spoofed via direct API calls. IP rate limits use in-memory storage (reset on restart). Advanced users with VPNs + spoofing tools can bypass both layers. However, these measures stop the majority of casual abuse without adding significant complexity.

## Project Structure

```
├── client/          # React frontend (Vite)
│   └── src/
│       ├── pages/       # CreatePollPage, ViewPollPage, NotFoundPage
│       ├── hooks/       # useRealtimePoll (SSE)
│       ├── lib/         # API client, fingerprint, utilities
│       └── components/  # shadcn/ui components
└── server/          # Express backend (Bun)
    └── src/
        ├── routes/      # polls, votes, stream (SSE)
        ├── services/    # pollService, voteService
        ├── middleware/  # validation, rate limiting, error handling
        └── lib/         # Prisma client, SSE manager, constants
```

## Scaling Strategy

Current setup: Vercel (frontend) + single Azure VM (backend) + Neon PostgreSQL.

This handles low-to-moderate traffic fine. Here's what will breaks first and how to scale it:

**SSE connections are the bottleneck.** Each viewer holds an open HTTP connection on the VM.

To scale beyond that we need to move SSE coordination off the single VM and into a shared system:

1. **Add Redis** — Move SSE broadcast coordination to Redis Pub/Sub. Each server instance subscribes to poll channels and broadcasts to its own local connections. This unlocks horizontal scaling — multiple VMs behind Azure Load Balancer, all sharing state through Redis.

2. **Persistent rate limiting** — Swap `express-rate-limit`'s in-memory store for `rate-limit-redis`. Limits survive restarts and stay consistent across instances.

3. **Cache poll results** — A hot poll gets the same `getPollResults()` query on every SSE connect and every page load. A short-TTL cache (Redis or in-memory, 2-5s) cuts repeated DB queries to near zero.

4. **Reduce DB round-trips** — The vote flow currently does 3 queries (verify option → insert vote → fetch results). The verify step can be dropped — the FK constraint already rejects invalid options. That's a free 33% reduction.

The frontend on Vercel already scales automatically. Neon PostgreSQL auto-scales on the read side. The server is the only piece that needs manual scaling work.
