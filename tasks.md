# Tasks

## ICS 연도 경계 버그 수정
> Goal: 이전 학사년도의 1~2월 이벤트가 누락되는 문제 해결
> Design: .claude/plans/staged-coalescing-muffin.md
> Done-when: 2026년 4월 시점에서 2026년 1~2월 이벤트가 ICS에 포함됨

- [ ] `src/utils/academic-year.ts` — 학사년도 계산 함수 (`getAcademicYear`, `getAcademicYearsToFetch`)
- [ ] `src/utils/events.ts` — 이벤트 중복 제거 함수 (`deduplicateEvents`)
- [ ] `src/index.ts` — `generateAndSaveIcs`에서 두 학사년도 병렬 fetch + 병합 + 정렬
- [ ] 테스트 작성 (`academic-year.test.ts`, `events.test.ts`, `index.test.ts` 업데이트)

## GitHub Gist 서빙 옵션
> Goal: ICS 파일을 Gist raw URL로도 구독 가능하게
> Design: .claude/plans/staged-coalescing-muffin.md
> Done-when: ICS 생성 시 Gist 자동 업데이트, raw URL로 캘린더 구독 가능

- [ ] `src/gist.ts` — GitHub API PATCH로 Gist 업데이트
- [ ] `src/types.ts` — `Env`에 `GITHUB_TOKEN?`, `GIST_ID?` 추가
- [ ] `src/index.ts` — KV 저장 후 선택적 Gist push (`ctx.waitUntil`, non-fatal)
- [ ] Cloudflare secret 설정 (`wrangler secret put GITHUB_TOKEN`)
- [ ] 테스트 작성 (`gist.test.ts`)
