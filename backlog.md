# Backlog

Migrated from `tasks.md`. Completed implementation notes are in `CHANGELOG.md`.
Deployment and external configuration have not been verified.

## Pending

### GitHub Gist subscription setup and verification

Goal: Allow calendar subscription through a Gist raw URL.

Done when: ICS generation updates the configured Gist when event content changes,
and the raw URL can be used to subscribe to the calendar.

- [ ] Confirm the target Gist and filename; set `GIST_FILENAME` if needed.
- [ ] Configure Cloudflare secrets: `wrangler secret put GITHUB_TOKEN` and
      `wrangler secret put GIST_ID`.
- [ ] Run the Gist and worker integration tests.
- [ ] Verify the Gist updates after changed ICS generation and confirm subscription
      through its raw URL.

## Original design reference

Both tasks originally referenced `.claude/plans/staged-coalescing-muffin.md`.
That file is absent from this checkout; the reference is retained for provenance.
