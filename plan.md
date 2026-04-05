# Plan

## Review Backlog

### PR #87 — refactor: extract utils and add multi-year fetch with Gist sync (2026-04-06)

- [ ] Gist 파일명을 환경변수로 설정 가능하게 하거나 기존 파일명 감지 (source: Codex) — src/gist.ts:22
- [ ] 콘텐츠 변경 시에만 Gist 업데이트 (etag 비교) (source: Claude) — src/index.ts:161-172
- [ ] gistId URL 삽입 시 hex 포맷 검증 추가 (source: Claude) — src/gist.ts:12
