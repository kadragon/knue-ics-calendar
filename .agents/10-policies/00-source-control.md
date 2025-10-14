---
id: AG-POLICY-SCM-001
version: 1.0.0
scope: folder:.agents/10-policies
status: active
supersedes: []
depends: [AG-POLICY-GLOBAL-001]
last-updated: 2025-10-14
owner: engineering-lead
---
# Source Control Policy

## Branching

- Never commit directly to `main`; use `feat/*`, `fix/*`, `chore/*`, `docs/*`, or `refactor/*`.
- Branch names should include concise scope (e.g., `feat/parser-stability`).

## Commits

- Use format `[Structural] (scope) summary [task-id]` or `[Behavioral] (scope) summary [task-id]`.
- One logical change per commit; keep behavioral changes separated from refactors.
- Rebase before merge; resolve conflicts locally.

## Reviews

- Require at least one maintainer review before merge.
- Attach Vitest results and, when relevant, Wrangler deploy previews.

## Traceability

- Link commits to `.spec/` updates when behavior changes.
- Record decisions in `.tasks/<id>/PROGRESS.md` for auditability.
