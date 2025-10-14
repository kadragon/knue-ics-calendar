---
id: AG-POLICY-TS-001
version: 1.0.0
scope: folder:.agents/10-policies
status: active
supersedes: []
depends: [AG-POLICY-GLOBAL-001]
last-updated: 2025-10-14
owner: tech-lead
---
# TypeScript Style Policy

## Compilation

- Maintain strict compiler options in `tsconfig.json`; do not relax without spec approval.
- Favor explicit return types for exported functions.

## Code Style

- Prefer small, pure functions for parsing and transformation logic defined in SPEC-DOMAIN-PARSER-001 and SPEC-DOMAIN-ICS-001.
- Avoid `any`; leverage discriminated unions defined in `src/types.ts`.
- Use constants from `src/constants.ts` rather than magic numbers.
- For logging, call `log(level, message, context)`; do not use `console.*` directly.

## Error Handling

- Wrap external calls with retry helpers as provided in `src/utils/retry.ts`.
- Surface actionable messages using structured logging fields (e.g., `{ eventId, year }`).

## Testing

- Add matching unit tests in `test/` for new modules; co-locate helper mocks under `test/helpers`.
- Mock network calls with axios stubs; do not hit live KNUE endpoints during tests.
