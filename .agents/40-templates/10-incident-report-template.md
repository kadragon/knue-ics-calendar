---
id: AG-TEMPLATE-INCIDENT-001
version: 1.0.0
scope: folder:.agents/40-templates
status: active
supersedes: []
depends: [AG-TEMPLATE-CORE-001]
last-updated: 2025-10-14
owner: operations-lead
---
# Incident Report Template

```
# Incident Report — <timestamp / incident-id>

## Summary
- Impact: <affected users/services>
- Duration: <start-end>
- Detection: <monitoring/alert source>

## Timeline
- <ISO-8601 timestamp> — <event detail>

## Root Cause
- <technical and organizational factors>

## Mitigation & Recovery
- <steps taken to restore service>

## Preventive Actions
- <tickets or tasks to avoid recurrence>

## Validation
- `wrangler tail`: <observations>
- Synthetic Check: <result of /events.ics request>

## Approvals
- Maintainer: <name/date>
- Ops Lead: <name/date>
```
