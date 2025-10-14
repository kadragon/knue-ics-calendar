---
id: SPEC-DOMAIN-ICS-001
version: 1.0.0
scope: global
status: active
supersedes: []
depends: []
last-updated: 2025-10-14
owner: product-owner
---
# KNUE Calendar Events → ICS Specification

## Overview

Defines the canonical structure and acceptance criteria for transforming KNUE academic events into an RFC 5545-compliant ICS document served at `/events.ics`.

## Inputs

- **Source HTML**: Academic calendar page from the official KNUE website for the target academic year.
- **Current Year**: Derived from `new Date().getFullYear()` unless overridden by tests.
- **Existing KV Snapshot**: Used only as fallback when parsing fails (must not change on error).

## Event Schema

Each event parsed from HTML MUST provide:

- `title` (string): Clean, human-readable summary with holiday/makeup markers removed.
- `startDate` (ISO-8601 date): Start of the academic event.
- `endDate` (ISO-8601 date, optional): Inclusive end date for multi-day events.
- `category` (enum): `academic`, `exam`, `holiday`, `maintenance`.
- `sourceId` (string): Stable identifier derived from source markup (e.g., table row + title hash).

## Transformations

1. Strip holidays and makeup-class markers unless explicitly listed in `.spec/domain/parser-extraction.spec.md` exceptions.
2. When `endDate` is present and differs from `startDate`, create an ICS event spanning the full duration (all-day).
3. Ensure generated ICS uses UTC timestamps and sets `DTSTART`/`DTEND` with `VALUE=DATE` for all-day events.
4. Populate `UID` from `sourceId` + `@knue-ics-calendar` suffix.
5. Include `X-WR-CALNAME: KNUE Academic Calendar` and `X-WR-TIMEZONE: Asia/Seoul` headers once per file.

## Output

- ICS string encoded in UTF-8 and stored under KV key `latest`.
- HTTP response must expose headers:
  - `Content-Type: text/calendar; charset=utf-8`
  - `Content-Disposition: attachment; filename="events.ics"`
  - `Cache-Control: public, max-age={CACHE_CONFIG.maxAge}`
  - `ETag`: Value returned by `generateEtag` on the file contents.

## Acceptance Criteria

- Parsing a representative KNUE calendar sample produces at least one `academic` event matching known semester dates.
- All ICS events pass validation using `ical-generator` internal checks (throws on invalid data).
- Requests with `If-None-Match` header equal to stored `ETag` respond `304 Not Modified` with empty body.
- When parsing yields zero events, no KV update occurs; the prior `latest` snapshot remains accessible.

## Verification

- Unit tests under `test/parser.test.ts` and `test/utils/calendar.test.ts` MUST cover transformations above.
- Integration test hitting the fetch handler with seeded KV MUST confirm headers and status codes.
- Manual validation: import generated `events.ics` into Apple Calendar and Google Calendar without errors.

## Traceability

- Policy Link: `.agents/10-policies/20-cloudflare-workers.md`
- Workflow Link: `.agents/20-workflows/00-rspi.md`
