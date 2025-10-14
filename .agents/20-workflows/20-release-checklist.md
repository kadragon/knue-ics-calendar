---
id: AG-WORKFLOW-REL-001
version: 1.0.0
scope: folder:.agents/20-workflows
status: active
supersedes: []
depends: [AG-WORKFLOW-RSPI-001]
last-updated: 2025-10-14
owner: release-manager
---
# Release Checklist

1. Confirm `.spec/` acceptance criteria remain satisfied; update if behavior changed.
2. Run `npm test` and capture results in `.tasks/<id>/PROGRESS.md`.
3. Execute `npm run build` to validate Wrangler configuration.
4. Verify KV bindings and cron schedules in `wrangler.toml` match target environment.
5. Announce planned deploy window to maintainers; obtain approval.
6. Deploy via `npm run deploy` (or `deploy:prod` for production) and monitor logs for first cron execution.
7. Post-release, verify `events.ics` returns `200` with fresh `ETag` and correct cache headers.
8. Update `.tasks/<id>/TASK_SUMMARY.md` and archive artifacts per retention policy.
