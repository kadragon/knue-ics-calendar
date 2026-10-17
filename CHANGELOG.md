# Changelog

## Unreleased

- [done] Remove GitHub Gist sync; the worker serves ICS directly (2026-10-17)
- [done] Verify January and February ICS events across academic years (2026-10-10)

## Implementation inventory migrated from tasks.md

These entries confirm that code and test files exist, not that tests or production
verification have passed.

### ICS academic-year boundary handling

- `src/utils/academic-year.ts`: `getAcademicYear` and
      `getAcademicYearsToFetch`, using `Asia/Seoul` for academic-year calculation.
- `src/utils/events.ts`: `deduplicateEvents`.
- `src/index.ts`: Fetch two academic years in parallel, merge, deduplicate,
      and sort events in `generateAndSaveIcs`.
- Tests added in `tests/utils/academic-year.test.ts`,
      `tests/utils/events.test.ts`, and `tests/index.test.ts`.

### GitHub Gist serving option

- `src/gist.ts`: Update ICS through the GitHub Gist PATCH API.
- `src/types.ts`: Optional `GITHUB_TOKEN`, `GIST_ID`, and `GIST_FILENAME`.
- `src/index.ts`: After saving to KV, push changed content through
      `ctx.waitUntil`; Gist failures are non-fatal.
- Tests added in `tests/gist.test.ts` and `tests/index.test.ts`.

