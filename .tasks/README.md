# Task Workspace Guide

All task execution artifacts live under `.tasks/` using English language records. Follow `.spec/process/rspi.spec.md` for required documents and use templates in `.tasks/templates/` when starting new work.

## Folder Structure

- `<task-id>/` — Active task folder containing the five mandatory artifacts.
- `_archive/YYYY/Q/<task-id>/` — Archived tasks once complete; update `TASKS_ARCHIVE_INDEX.md` accordingly.
- `templates/` — Canonical templates for RSP-I artifacts.

## Usage

1. Duplicate templates into a new task folder named with ISO date and slug (e.g., `2025-10-14-refresh-selectors`).
2. Maintain chronological updates in `PROGRESS.md` with ISO-8601 timestamps.
3. Record spec adjustments in `SPEC-DELTA.md`, referencing spec IDs (e.g., SPEC-DOMAIN-PARSER-001).
4. Upon closure, summarize outcomes in `TASK_SUMMARY.md` and move folder into `_archive`.

## References

- Process spec: `.spec/process/rspi.spec.md`
- Policies: `.agents/20-workflows/00-rspi.md`, `.agents/10-policies/00-source-control.md`
