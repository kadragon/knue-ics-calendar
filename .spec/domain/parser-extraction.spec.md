---
id: SPEC-DOMAIN-PARSER-001
version: 1.0.0
scope: global
status: active
supersedes: []
depends: [SPEC-DOMAIN-ICS-001]
last-updated: 2025-10-14
owner: tech-lead
---
# KNUE Calendar Parser Specification

## Overview

Defines scraping requirements for `getEventsFromSite(year)` located in `src/parser.ts`.

## Source Constraints

- Target URL pattern: `https://www.knue.ac.kr/<path>/sub.do?key=<id>&page=1` (exact path documented in parser constants).
- HTML structure assumption: events listed in table rows with separate columns for date range and description.
- Changes to selectors MUST be reflected here before code updates.

## Extraction Rules

1. Identify rows with class `.sche_table tbody tr` (fallback: `.sche_table tr` when `tbody` absent).
2. Date column MUST parse both single-day (`YYYY.MM.DD`) and range (`YYYY.MM.DD ~ YYYY.MM.DD`) formats.
3. Titles should strip leading/trailing whitespace and remove suffixes `[휴업]`, `(수업보강)`.
4. Skip rows where title contains `휴업`, `방학`, or is empty after sanitization.
5. Map remaining rows to event schema fields per `.spec/domain/calendar-events.spec.md`.
6. Detect cross-year ranges (e.g., December to January) and normalize `endDate` to correct calendar year.

## Error Handling

- On HTTP errors (>=500), trigger retry with exponential backoff parameters from `src/utils/retry.ts`.
- On parsing anomalies (e.g., unknown date format), log warning with `rowIndex` and continue processing.
- Throw only when the entire document cannot be parsed (e.g., selector missing) to surface to scheduled handler.

## Acceptance Criteria

- Vitest fixtures MUST include examples for single-day events, multi-day ranges, and cross-year spans.
- Parser returns deterministic ordering sorted by `startDate`, then `title`.
- Sanitized titles MUST be ASCII except for necessary Korean characters from source.

## Verification

- `test/parser.test.ts` to validate fixture-driven parsing and sanitization.
- Snapshot test for canonical list of events per academic year fixture.

## Traceability

- Depends on `.agents/10-policies/10-typescript-style.md` for coding standards.
- Aligns with `.agents/20-workflows/10-tdd-practice.md` for testing discipline.
