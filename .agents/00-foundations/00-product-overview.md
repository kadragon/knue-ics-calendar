---
id: AG-FOUND-OVERVIEW-001
version: 1.0.0
scope: folder:.agents/00-foundations
status: active
supersedes: []
depends: [AG-FOUND-CORE-001]
last-updated: 2025-10-14
owner: product-owner
---
# Product Overview

## Mission

Deliver an always-fresh RFC 5545 calendar derived from the KNUE academic schedule via a Cloudflare Worker.

## Key Capabilities

- Scrape KNUE academic calendar HTML and normalize events.
- Store the latest calendar snapshot in KV for low-latency edge delivery.
- Serve `events.ics` with strong caching (ETag + configurable max-age).
- Scheduled Cron job keeps data synchronized without manual intervention.

## Primary Entry Points

- HTTPS `GET /events.ics`: returns the latest generated ICS document.
- Scheduled trigger (cron) defined in `wrangler.toml`: regenerates and persists the ICS payload.

## Tech Stack

- Runtime: Cloudflare Workers (Node compatibility disabled).
- Language: TypeScript with strict compiler options (tsconfig).
- Libraries: `axios`, `cheerio`, `ical-generator` for data acquisition and ICS production.
- Tooling: Vitest for tests, Wrangler for local dev and deployment.

## Data Contracts

- KV namespace binding `KNUE_CAL_KV` stores the `latest` ICS content.
- Event schema defined in `src/types.ts` governs internal transformations.
- `.spec/` documents hold canonical format requirements (create or update before altering behavior).
