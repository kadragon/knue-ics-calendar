---
id: AG-POLICY-CF-001
version: 1.0.0
scope: folder:.agents/10-policies
status: active
supersedes: []
depends: [AG-POLICY-GLOBAL-001]
last-updated: 2025-10-14
owner: platform-lead
---
# Cloudflare Workers Policy

## Configuration

- Keep `wrangler.toml` KV bindings in sync across environments (`preview_id`, `id`).
- Document cron expressions in `.spec/infra/` before changing schedules.
- Align runtime changes with `.spec/infra/cloudflare-worker.spec.md` (SPEC-INFRA-CF-001) prior to implementation.

## Deployment

- Use `npm run build` before deploy to validate Wrangler configuration without publishing.
- Production deploys require maintainer acknowledgment in `.tasks/<id>/PROGRESS.md`.
- Ensure deployment checklist matches the acceptance criteria defined in SPEC-INFRA-CF-001.

## Secrets & Vars

- Store secrets via `wrangler secret put`; never commit `.env` or secret values.
- Ensure `LOG_LEVEL` defaults to `info`; elevate to `debug` only for scoped troubleshooting.

## Runtime Constraints

- Respect Workers CPU/memory limits; avoid synchronous blocking loops in parsers.
- Cache ICS responses with `CACHE_CONFIG.maxAge`; update spec if retention needs shift.
