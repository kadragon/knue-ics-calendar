# SPEC-DELTA — 2025-11-22-npm-ci-vitest-lock

- **Revision Date**: 2025-11-22T12:04:25+09:00
- **Owner**: Codex

## Summary
- No functional spec changes; dependency alignment to satisfy SPEC-INFRA-CF-001 build acceptance.

## Acceptance Criteria Updates
- SPEC ID: SPEC-INFRA-CF-001 — Clarify that dependency lockfile must be consistent to allow `npm run build` / `npm ci` to complete without errors.

## Impacted Modules
- package.json
- package-lock.json

## Verification Plan
- Tests: `npm test` (vitest) must pass after dependency update.
- Build: `npm ci` should complete locally without errors.

## Approvals
- Maintainer: pending
