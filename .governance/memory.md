# Memory

## Session 1 (Initialization)
- Initialized project structure for SDD/TDD.
- Detected Cloudflare Worker project with TypeScript, Vitest, ESLint.
- Setting up CI/CD workflow.

## Session 1 (CI Setup)
- Created GitHub Actions workflow `.github/workflows/ci.yml`.
- Workflow includes `lint`, `typecheck`, `build`, and `test` steps running on Node 20.
- `build` step uses `wrangler deploy --dry-run --outdir dist` to verify bundling.
- Verified all commands pass locally.

## Session 1 (Biome Migration)
- Migrated from ESLint/Prettier to **Biome** for performance and simplicity.
- Removed `eslint`, `prettier` and related plugins.
- Added `biome.json` and updated `package.json` scripts.
- `npm run lint` now runs `biome check .`.
- Fixed existing lint/format issues (mostly `import type`, template literals, and optional chaining).
- **Decision**: Kept `tsc` for `typecheck`. Biome currently does not support semantic type checking, only linting/formatting.

## Session 2 (On-Demand ICS Generation)
- Removed cron-based scheduled generation in favor of on-demand generation with 24-hour caching.
- **Architecture**:
  - HTTP cache (Cloudflare Cache): Fast repeated requests within browser cache window
  - KV cache: 24-hour TTL validation via `isCacheValid(updatedAt)`
  - On-demand generation: Only when KV cache missing or stale
  - Graceful degradation: Serve stale cache if generation fails
- **Key patterns**:
  - `isCacheValid()`: Compare `Date.now()` vs metadata timestamp, check against `CACHE_CONFIG.kvTtl`
  - `generateAndSaveIcs()`: Extracted reusable generation logic (used by both fetch handler and would be used by any future scheduled trigger)
  - Error handling: Try fresh generation first, fall back to stale cache, return 503 only if both fail
- **Testing**: All 61 tests passing, includes 4 new tests for cache behavior
- **Removed**: `scheduled()` handler, `[triggers] crons` from wrangler.toml
