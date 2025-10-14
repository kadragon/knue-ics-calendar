---
id: AG-LOADER-GLOBAL-001
version: 1.0.0
scope: global
status: active
supersedes: []
depends: []
last-updated: 2025-10-14
owner: project-admin
---
# Global AGENTS Loader — knue-ics-calendar

> Entry point for project-wide operational policies. Follow this loader before consulting task-specific artifacts.

## Load Order

1. .agents/00-foundations/**
2. .agents/10-policies/**
3. .agents/20-workflows/**
4. .agents/30-roles/**
5. .agents/40-templates/**
6. .agents/90-overrides/** (if present)

## Usage Notes

- All documents in this tree are written in English; user-facing deliverables stay in Korean.
- Prioritize `.spec/` contracts over policies when conflicts arise.
- Always check for local `.agents/<folder>/AGENTS.md` files when working in submodules.
- Update `last-updated` stamps whenever content materially changes.
