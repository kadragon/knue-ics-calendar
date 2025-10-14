# RESEARCH — 2025-10-14-cache-plan

- **Date Opened**: 2025-10-14
- **Owner**: assistant
- **Related Specs**: SPEC-INFRA-CF-001

## Goals
- Understand current ICS generation, storage, and delivery flow to evaluate Cache API migration feasibility.
- Identify constraints (cron cadence, TTL, environment bindings) that must be preserved or updated.

## Findings
- Worker serves `.ics` requests exclusively by loading `latest` key from `env.KNUE_CAL_KV`; absence yields `503` and warning log, so any cache alternative must keep a fallback for cold starts (`src/index.ts:6`). Evidence: `src/index.ts:8-42`.
- Scheduled handler reruns daily (wrangler cron `0 1 * * *`) to rebuild the ICS via `getEventsFromSite` and stores the string back to KV; current logic ensures empty parse results do not overwrite prior snapshot (`src/index.ts:47-82`). Evidence: same file.
- `CACHE_CONFIG.maxAge` already sets `Cache-Control` to 86400 seconds for HTTP responses; Cache API must at minimum mirror this TTL (`src/constants.ts:20`).
- Unit tests assume KV presence and validate both fetch and scheduled behavior using `MockKVNamespace`, meaning test harness will need new abstractions when we introduce Cache API logic (`tests/index.test.ts:6-200`).
- Infra spec still states cron cadence `0 */6 * * *` and mandates KV binding existence, so spec updates are required to align with new cron (`wrangler.toml:10`, `.spec/infra/cloudflare-worker.spec.md:16`).

## Evidence Log
- [x] Source: `src/index.ts` — Reviewed fetch and scheduled handlers.
- [x] Source: `src/constants.ts` — Confirmed current cache TTL setting.
- [x] Source: `tests/index.test.ts` — Noted KV-dependent test scaffolding.
- [x] Source: `wrangler.toml` — Observed placement mode and cron schedule updates.
- [x] Source: `.spec/infra/cloudflare-worker.spec.md` — Updated cron + cache requirements.

## Open Questions
- How will we persist ICS between cache expirations if Cache API purges before next daily rebuild (e.g., manual purge or edge eviction)?
- Do we need a storage-of-record (KV or R2) for audit/history, or is regenerated daily data sufficient?
- What is acceptable stale tolerance if Cache API TTL drifts due to worker execution delays?

## Next Actions
- Draft SPEC-DELTA to reconcile cron schedule and define Cache API behavior expectations.
- Design test strategy for Cache API workflow (mock caches, TTL validation) before implementation.
