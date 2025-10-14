---
id: SPEC-INDEX-001
version: 1.0.0
scope: global
status: active
supersedes: []
depends: []
last-updated: 2025-10-14
owner: project-admin
---
# Specification Index

Authoritative references for KNUE ICS Calendar behavior. Update this index when adding or deprecating spec files.

## Domain

- `.spec/domain/calendar-events.spec.md` — Event schema and ICS output rules (SPEC-DOMAIN-ICS-001).
- `.spec/domain/parser-extraction.spec.md` — HTML parsing constraints (SPEC-DOMAIN-PARSER-001).

## Infrastructure

- `.spec/infra/cloudflare-worker.spec.md` — Worker runtime, cron, KV requirements (SPEC-INFRA-CF-001).

## Process

- `.spec/process/rspi.spec.md` — Task workflow artifacts (SPEC-PROCESS-RSPI-001).

## Change Management

- Update corresponding `.agents/` policy when a spec meaningfully alters operational guidance.
- Record spec revisions in relevant `.tasks/<id>/SPEC-DELTA.md` with version bumps.
