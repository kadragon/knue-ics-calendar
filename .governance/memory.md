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