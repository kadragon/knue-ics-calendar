---
id: SPEC-PROCESS-RSPI-001
version: 1.0.0
scope: global
status: active
supersedes: []
depends: []
last-updated: 2025-10-14
owner: delivery-lead
---
# RSP-I Process Specification

## Purpose

Establishes acceptance criteria for the Research → Spec → Plan → Implement workflow applied to KNUE ICS Calendar tasks.

## Mandatory Artifacts

1. `RESEARCH.md`: captures hypotheses, evidence with sources, and open questions.
2. `SPEC-DELTA.md`: enumerates acceptance criteria updates referencing `.spec/` IDs.
3. `PLAN.md`: outlines implementation steps, tests, dependencies, and rollback.
4. `PROGRESS.md`: chronological log of execution, test results, and decisions.
5. `TASK_SUMMARY.md`: concise closure report archived post-completion.

## Process Gates

- Transition from Research to Spec requires at least one confirmed data source or constraint update.
- Plan must enumerate automated tests to be created/updated and cite relevant specs/policies.
- Implement phase cannot begin without approved Plan when change impacts production behavior.

## Acceptance Criteria

- Every task folder under `.tasks/` contains the 5 mandatory artifacts before closure.
- Implement phase logs include timestamps (ISO-8601) and Vitest execution evidence.
- Completed tasks move to `.tasks/_archive/YYYY/Q/<task-id>/` with updated `TASKS_ARCHIVE_INDEX.md` entry.

## Verification

- Maintainer review checklist ensures artifacts exist and link back to relevant `.spec/` documents.
- Spot audits once per quarter documented in `.tasks/ops/PROGRESS.md`.

## Traceability

- Workflow Link: `.agents/20-workflows/00-rspi.md`
- Role Link: `.agents/30-roles/00-maintainer.md`
