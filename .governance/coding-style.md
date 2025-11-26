# Coding Style & Conventions

## Linting & Formatting
- This project uses **[Biome](https://biomejs.dev/)** for linting and formatting.
- **Do NOT** use ESLint or Prettier.
- Run `npm run lint` to check for issues.
- Run `npm run format` or `npm run fix` to auto-fix issues.

## TypeScript
- Strict mode is enabled.
- Prefer `import type` for type-only imports (enforced by Biome).
- No non-null assertions (`!`) unless absolutely necessary (and suppressed).

## Git Hooks
- Husky is set up to run checks. (Note: I haven't checked `.husky/pre-commit` yet).
