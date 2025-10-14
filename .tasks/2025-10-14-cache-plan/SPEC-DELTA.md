# SPEC-DELTA — 2025-10-14-cache-plan

- **Revision Date**: 2025-10-14
- **Owner**: assistant

## Summary
- Align infra specification with daily cron (`0 1 * * *`) and replace KV hard dependency with Cache API-based delivery while retaining KV (or alternate persistent store) only for generation fallback.

## Acceptance Criteria Updates
- SPEC ID: SPEC-INFRA-CF-001 — Update cron trigger requirement to "daily at 01:00 Asia/Seoul (`0 1 * * *`)." Define that worker must generate ICS on schedule and warm cache immediately after successful build.
- SPEC ID: SPEC-INFRA-CF-001 — Replace requirement "KV binding MUST exist" with "Worker MUST ensure persistent storage for latest ICS (KV or equivalent) and serve requests primarily via Cache API with 24h TTL; cold start fallback must return previous snapshot or 503 with `Retry-After`."
- SPEC ID: SPEC-DOMAIN-ICS-001 — Add acceptance note that content served from cache must present correct `ETag`, `Last-Modified`, and `Cache-Control: public, max-age=86400`.

## Impacted Modules
- `src/index.ts`
- `src/types.ts`
- `src/utils/*` (cache helpers to be added)
- `tests/index.test.ts`

## Verification Plan
- Tests: New `tests/worker-cache.spec.ts` covering Cache API warm/fallback, update existing scheduled handler tests for daily cron behavior.
- Metrics: Confirm via Worker analytics that cron executes within ±5 minutes of 01:00 KST; log review to ensure cache warm path runs after cron.

## Approvals
- Maintainer: TBD
