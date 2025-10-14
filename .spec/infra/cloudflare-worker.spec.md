---
id: SPEC-INFRA-CF-001
version: 1.0.0
scope: global
status: active
supersedes: []
depends: [SPEC-DOMAIN-ICS-001]
last-updated: 2025-10-14
owner: platform-lead
---
# Cloudflare Worker Infrastructure Specification

## Runtime

- Worker entry point: `src/index.ts` packaged via Wrangler with module syntax.
- Production environment uses Cloudflare Workers standard runtime (no Node compatibility).
- KV binding `KNUE_CAL_KV` MUST exist in each environment; bindings declared in `wrangler.toml`.

## Triggers

- HTTP endpoint: `GET /events.ics` responds with latest calendar snapshot.
- Scheduled Cron: `crons = ["0 1 * * *"]` (daily 01:00 Asia/Seoul). Update this spec before modifying `wrangler.toml`.

## Configuration

- Environment variables:
  - `LOG_LEVEL`: default `info`; allow `debug` only during active troubleshooting.
- Persistent storage:
  - A Cloudflare KV namespace (or equivalent durable store) MUST retain the latest generated ICS for cold-start recovery.
- Edge caching:
  - Worker MUST serve `/events.ics` via Cloudflare Cache API using a single canonical cache key.
  - Cached responses MUST include `Cache-Control: public, max-age=86400`, `ETag`, and `Last-Modified`.
  - On successful cron execution, the Worker MUST warm the cache immediately after persisting the new ICS.
- Wrangler commands:
  - `npm run build` performs `wrangler deploy --dry-run`.
  - `npm run deploy` pushes to default environment.
  - `npm run deploy:prod` pushes with `--env production`.

## Observability

- Use `wrangler tail` for streaming logs; ensure log messages follow `{ level, message, context }` structure.
- Critical errors MUST include `error` and `stack` fields when available.

## Acceptance Criteria

- Deploying with `npm run build` completes without warnings or errors.
- Cron trigger executes within ±5 minutes of schedule; first run after deploy successfully regenerates ICS.
- Persistent store reads/writes remain under plan limits (document actual quotas in `.tasks/ops/PROGRESS.md`).
- HTTP response latency p95 < 200ms for cache hits (measured via Worker analytics).
- 304 responses MUST match the latest cached `ETag`.

## Verification

- Pre-deploy checklist defined in `.agents/20-workflows/20-release-checklist.md` MUST be satisfied.
- Smoke test: `curl https://<worker-domain>/events.ics` returns status 200 and non-empty body.

## Traceability

- Policy Link: `.agents/10-policies/20-cloudflare-workers.md`
- Workflow Link: `.agents/20-workflows/20-release-checklist.md`
