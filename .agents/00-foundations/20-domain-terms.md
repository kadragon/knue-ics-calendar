---
id: AG-FOUND-TERMS-001
version: 1.0.0
scope: folder:.agents/00-foundations
status: active
supersedes: []
depends: [AG-FOUND-CORE-001]
last-updated: 2025-10-14
owner: knowledge-manager
---
# Domain Terminology

- **KNUE**: Korea National University of Education; source of academic calendar data.
- **ICS**: iCalendar file format compliant with RFC 5545; output delivered to users.
- **KV**: Cloudflare Key-Value store used to persist the latest calendar snapshot.
- **ETag**: Content-based hash used to inform conditional GET responses.
- **Scheduled Trigger**: Cloudflare cron event that invokes the worker `scheduled` handler.
- **Retry with Jitter**: Backoff strategy implemented in `src/utils/retry.ts` to mitigate scraping failures.
