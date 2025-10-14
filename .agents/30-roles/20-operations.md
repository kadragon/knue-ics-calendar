---
id: AG-ROLE-OPS-001
version: 1.0.0
scope: folder:.agents/30-roles
status: active
supersedes: []
depends: [AG-ROLES-CORE-001]
last-updated: 2025-10-14
owner: operations-lead
---
# Operations Role

## Responsibilities

- Monitor Cloudflare Worker logs and KV metrics for anomalies.
- Handle incident response for failed cron executions or stale ICS data.
- Coordinate with maintainers to roll back or hotfix via KV snapshot restoration.

## Runbooks

- Keep incident steps documented in `.tasks/ops/` and reference during drills.
- Schedule quarterly verification that cron triggers execute successfully.

## Tooling

- Use `wrangler tail` for live log monitoring during incidents.
- Maintain alerting integrations (email/slack) pointing to Worker health dashboards.
