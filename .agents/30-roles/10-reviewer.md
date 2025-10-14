---
id: AG-ROLE-REVIEWER-001
version: 1.0.0
scope: folder:.agents/30-roles
status: active
supersedes: []
depends: [AG-ROLES-CORE-001]
last-updated: 2025-10-14
owner: qa-lead
---
# Reviewer Role

## Responsibilities

- Validate that pull requests include failing-then-passing tests and updated specs.
- Check that logging, retry, and caching behaviors remain consistent with policies.
- Request proof of `npm test` and `npm run build` for releases.

## Review Focus Areas

- Selector stability in `src/parser.ts`.
- ICS output regressions via snapshot or structural tests.
- Performance implications (KV usage, Worker CPU time).

## Approvals

- Block merge if policies or workflows are skipped; document decisions in review comments referencing `.agents/` rules.
