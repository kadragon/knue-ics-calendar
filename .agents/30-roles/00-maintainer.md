---
id: AG-ROLE-MAINTAINER-001
version: 1.0.0
scope: folder:.agents/30-roles
status: active
supersedes: []
depends: [AG-ROLES-CORE-001]
last-updated: 2025-10-14
owner: team-admin
---
# Maintainer Role

## Responsibilities

- Ensure `.spec/` reflects the deployed behavior; drive updates when functionality changes.
- Review pull requests for architecture alignment, testing sufficiency, and policy compliance.
- Manage KV namespace rotations and cron schedule adjustments.

## SLAs

- Review PRs within 2 business days.
- Respond to production incidents within 1 hour of notification.

## Required Skills

- Deep familiarity with Cloudflare Workers runtime limits and KV semantics.
- Ability to troubleshoot scraping issues caused by KNUE site changes.
