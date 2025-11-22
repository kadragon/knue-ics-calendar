# RESEARCH — 2025-11-22-npm-ci-vitest-lock

- **Date Opened**: 2025-11-22T12:04:25+09:00
- **Owner**: Codex
- **Related Specs**: SPEC-INFRA-CF-001

## Goals
- Understand why `npm ci` fails during Wrangler build.
- Identify dependency/lockfile mismatch preventing installation.

## Findings
- Build log reports `npm ci` failure: lock file's `vitest@4.0.13` does not satisfy `vitest@4.0.10`, indicating package-lock and package.json are out of sync for Vitest packages.
- package.json devDependencies pin Vitest packages with range `^4.0.10`, while package-lock includes mixed versions (root Vitest 4.0.13, some @vitest/* at 4.0.10/4.0.13), leading npm 10 to deem the lockfile invalid for clean install.

## Evidence Log
- [x] Source: provided Wrangler build log — shows `npm ci` EUSAGE and Vitest version mismatch errors.
- [x] Source: package.json — devDependencies `vitest`, `@vitest/ui`, `@vitest/coverage-v8` set to `^4.0.10`.
- [x] Source: package-lock.json — `node_modules/vitest` at `4.0.13` while some @vitest/* entries remain at `4.0.10`.

## Open Questions
- None; resolution path is to resync package.json and package-lock for Vitest suite.

## Next Actions
- Update Vitest-related devDependencies to the latest compatible patch (4.0.13) for consistency.
- Regenerate package-lock.json to reflect aligned versions.
- Run `npm test` to verify the toolchain after the update.
