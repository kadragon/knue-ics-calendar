---
id: AG-WORKFLOW-TDD-001
version: 1.0.0
scope: folder:.agents/20-workflows
status: active
supersedes: []
depends: [AG-WORKFLOW-RSPI-001]
last-updated: 2025-10-14
owner: qa-lead
---
# TDD Practice Guide

## Test First

- Add or update Vitest specs under `test/` before modifying production code.
- For parser adjustments, create fixtures mirroring KNUE HTML snippets.

## Minimal Implementation

- Modify the smallest unit (utility or helper) necessary to satisfy the failing test.
- Avoid introducing new dependencies without documenting rationale in PLAN.md.

## Refactor on Green

- Clean up duplicated parsing logic using helper functions in `src/utils` after tests pass.
- Maintain readability; add brief comments for complex regex or selectors.

## Regression Coverage

- Ensure cron handler logic (`scheduled`) and fetch path guardrails have integration tests.
- Run `npm run test:coverage` when behavior changes to monitor drift from 100% coverage goal.
