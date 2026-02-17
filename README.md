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

SSE is simpler, uses standard HTTP, reconnects automatically, and fits perfectly since data only flows server→client. It Scale Much better than WebSockets. WebSockets would be overkill for this use case.

## Fairness / Anti-Abuse

Two mechanisms to reduce repeat and abusive voting:

### 1. Browser Fingerprint + Database Unique Constraint

A deterministic hash is generated client-side from browser signals (user agent, screen dimensions, timezone, hardware concurrency, etc.) and sent with the vote. The database enforces a `UNIQUE(poll_id, voter_fingerprint)` constraint — if the same fingerprint tries to vote twice on the same poll, the insert is rejected at the DB level (Prisma `P2002` error).

**Prevents:** Same browser voting twice on the same poll. The constraint is enforced server-side regardless of client behavior, so even race conditions between concurrent requests are safe.

### 2. IP-Based Rate Limiting

`express-rate-limit` middleware scoped per IP per poll — max 3 votes per IP per poll per hour. A separate limiter caps poll creation at 10 per IP per day. In production, `trust proxy` is restricted to `"loopback"` so external clients can't spoof their IP via `X-Forwarded-For`.

**Prevents:** Scripted vote flooding from a single IP. Even if someone forges fingerprints, they're capped at 3 per hour from one address.

## Edge Cases Handled

- **Duplicate vote race condition** — Two near-simultaneous votes from the same fingerprint: the DB unique constraint rejects the second, not application-level locking.
- **Invalid option submission** — Server verifies the `optionId` actually belongs to the given `pollId` before inserting. Prevents cross-poll vote injection.
- **SSE reconnection** — Client auto-reconnects on connection drop with a retry loop, so users don't get stale results after network blips.
- **Proxy IP spoofing** — `trust proxy` only enabled in production, restricted to loopback. Clients can't forge `X-Forwarded-For` to bypass rate limits.
- **Payload abuse** — 10KB body limit on all JSON endpoints.
- **Input validation** — Zod schemas validate all inputs server-side (UUID format for IDs, string lengths, alphanumeric fingerprint format). Client-side validation mirrors this but is not relied upon.
- **Poll not found / invalid link** — 404 handling for non-existent polls with a fallback UI.

## Known Limitations / Future Improvements

- **Fingerprint** A server-side fingerprint (e.g. hashing IP + User-Agent on the backend) or integrating FingerprintJS Pro would be harder to spoof.
- **Rate limit.** Swapping to a Redis-backed store (`rate-limit-redis`) would survive restarts and work across multiple server instances.

- **SSE Scalability** Each viewer holds an open connection to the single server. Redis Pub/Sub for broadcast coordination would allow multiple backend instances.

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

