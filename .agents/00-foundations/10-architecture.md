---
id: AG-FOUND-ARCH-001
version: 1.0.0
scope: folder:.agents/00-foundations
status: active
supersedes: []
depends: [AG-FOUND-CORE-001]
last-updated: 2025-10-14
owner: tech-lead
---
# Architecture Summary

## High-Level Flow

1. `scheduled` handler invokes `getEventsFromSite(year)` in `src/parser.ts`.
2. Parsed events pass through sanitization utilities in `src/utils/`.
3. `createCalendarWithEvents` uses `ical-generator` to produce the ICS payload.
4. Result is saved to `env.KNUE_CAL_KV` at key `latest`.
5. `fetch` handler retrieves KV data, validates cache headers, and responds.

## Modules

- `src/index.ts`: Worker entry; orchestrates fetch and scheduled flows.
- `src/parser.ts`: Scraping logic; relies on `axios` and `cheerio` selectors tied to KNUE markup.
- `src/utils/`: Support utilities for calendar creation, retry logic, ETag hashing, and logging.
- `src/constants.ts`: Central configuration (cache, retry, timeouts).
- `test/`: Vitest suites covering parsers, utilities, and worker endpoints.

## External Integrations

- Cloudflare KV: requires namespace binding `KNUE_CAL_KV` configured in `wrangler.toml`.
- KNUE web portal: HTML structure may change; monitor selectors defined in `parser.ts`.

## Observability

- Structured logging via `log(level, message, context)` in `src/utils/logger.ts`.
- Rely on Cloudflare Worker logs; ensure log level controlled via `LOG_LEVEL` env var.

## Deployment Paths

- `npm run dev`: Local development with `wrangler dev --local`.
- `npm run deploy`: Deploys to default environment.
- `npm run deploy:prod`: Deploys with `--env production` per `wrangler.toml`.
