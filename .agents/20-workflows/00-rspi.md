---
id: AG-WORKFLOW-RSPI-REF-001
version: 1.0.0
scope: folder:.agents/20-workflows
status: active
supersedes: []
depends: [AG-WORKFLOW-RSPI-001]
last-updated: 2025-10-14
owner: delivery-lead
---
# RSP-I Workflow (Project Adaptation)

## Research

- Audit KNUE site changes; capture selectors, date formats, and anomalies in `.tasks/<id>/RESEARCH.md`.
- Document environment constraints (KV quotas, Worker limits) before proposing changes.

## Spec

- Update `.spec/` or `.tasks/<id>/SPEC-DELTA.md` with precise acceptance criteria (input HTML samples, expected ICS output fragments) in alignment with SPEC-PROCESS-RSPI-001.
- Include cache and retry expectations when behavior shifts.

## Plan

- Record plan in `.tasks/<id>/PLAN.md` with tests to write, modules to touch, and rollback steps (e.g., revert KV key to previous snapshot) referencing SPEC-PROCESS-RSPI-001.
- Flag any required approvals (e.g., cron change) as workflow gates.

## Implement

- Follow TDD: write failing Vitest case, implement minimal code, refactor on green.
- Update `.tasks/<id>/PROGRESS.md` after each major checkpoint.
- Run `npm test` and, for infrastructure changes, perform `npm run build` dry-run before requesting review.
