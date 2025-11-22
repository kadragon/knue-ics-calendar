# PLAN — 2025-11-22-npm-ci-vitest-lock

- **Plan Date**: 2025-11-22T12:04:25+09:00
- **Owner**: Codex

## Objectives
- Align Vitest-related dependencies and lockfile to satisfy SPEC-INFRA-CF-001 acceptance for clean Wrangler builds.

## Work Items
1. Bump `vitest`, `@vitest/ui`, and `@vitest/coverage-v8` devDependencies to `^4.0.13` to match resolved versions — Tests: `npm test` — Rollback: revert package.json and package-lock.json.
2. Regenerate `package-lock.json` via `npm install` to sync versions — Tests: `npm ci` dry-run locally — Rollback: restore previous lockfile.
3. Verify test suite with `npm test` to ensure tooling works after dependency update — Rollback: restore previous dependency versions if failures arise.

## Risk Assessment
- Risk: Potential Vitest minor patch behavior change — Mitigation: run full test suite to confirm.

## Dependencies
- npm registry availability; runtime >= Node 20 per package.json (`engines`), executed with Node 22.16.0 locally to mirror build env.

## Approval Checklist
- [ ] Maintainer review
- [x] Spec alignment confirmed
- [ ] Tests identified
