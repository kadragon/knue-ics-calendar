# ical-generator v6 → v9 메이저 업그레이드 계획

## 개요
- **현재 버전**: 6.0.1
- **대상 버전**: 9.0.0 (latest)
- **주요 변경사항**: Node.js 18 제거, 타임존 라이브러리 개선, API 미세 변경
- **영향도**: 낮음 (우리 코드가 사용하는 API는 대부분 호환 유지)

## Breaking Changes 분석

### v7.0.0 (2024-03-17)
- ✅ **영향 없음**: `location()` 메서드 title 필드 optional화
  - 우리 코드는 location을 사용하지 않음

### v8.0.0 (2024-08-26)
- ✅ **영향 없음**: Node.js v19/v21 지원 제거
  - 현재 사용 중인 Node.js 버전과 무관

### v9.0.0 (2025-05-12)
- ⚠️ **검토 필요**: Node.js v18 지원 제거
  - 환경에서 사용 중인 Node.js 버전 확인 필요
- ✅ **영향 없음**: ENUM 순서 변경 (에러 메시지에만 영향)
- ✅ **선택사항**: @date-fnz/tz 타임존 라이브러리 지원
  - 현재 Asia/Seoul 사용 중이므로 필수는 아님

## 우리 코드가 사용하는 API 호환성

| API | 사용처 | 호환성 | 비고 |
|-----|--------|--------|------|
| `new ICalCalendar(config)` | calendar.ts | ✅ 호환 | 생성자 인터페이스 유지 |
| `.createEvent(eventObject)` | calendar.ts | ✅ 호환 | start, end, summary, allDay 유지 |
| `.toString()` | calendar.ts, index.ts | ✅ 호환 | ICS 문자열 생성 유지 |
| `.events()` | calendar.test.ts | ✅ 호환 | 이벤트 조회 유지 |
| `.name()` | calendar.test.ts | ✅ 호환 | 캘린더 이름 조회 유지 |
| `.timezone()` | calendar.test.ts | ✅ 호환 | 타임존 조회 유지 |

## 업그레이드 실행 계획

### 1단계: 테스트 기반 검증 (RED)
```bash
npm install ical-generator@9.0.0 --save
npm test  # 기존 테스트 실행해서 실패 여부 확인
```

### 2단계: 코드 수정 (GREEN)
- 테스트 실패 시에만 코드 수정
- 예상: 대부분 패스할 것으로 예상

### 3단계: 전체 검증
```bash
npm test                    # 모든 단위 테스트
npm run test:coverage       # 커버리지 확인
npm run lint                # 린트 체크
npm run typecheck           # 타입 체크
npm run build              # 빌드 검증
```

### 4단계: 배포 전 수동 테스트
- 실제 KNUE 캘린더 데이터로 생성된 ICS 파일 검증
- 주요 캘린더 앱(Google Calendar, Outlook 등)에서 정상 동작 확인

## 예상 작업량
- **예상 시간**: 30분 ~ 1시간
- **위험도**: 낮음 (API 호환성 높음)
- **롤백 난이도**: 쉬움 (package.json 수정 후 npm install)

## 성공 기준 (DoD)
- [ ] 모든 테스트 통과 (npm test)
- [ ] 커버리지 유지 (라인: 80%, 브랜치: 70%)
- [ ] 린트 & 타입 체크 통과
- [ ] 빌드 성공
- [ ] ICS 파일 형식 검증 완료
