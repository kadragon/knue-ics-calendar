# TASKS: Cheerio Integration for Robust HTML Parsing

**Goal**: Replace regex-based HTML parsing with cheerio for better security, maintainability, and CodeQL compliance.

**Motivation**:
- CodeQL "Incomplete multi-character sanitization" warnings persist
- Regex approach fragile for edge cases (badges, icons, extra markup)
- cheerio provides safe, robust DOM parsing in Cloudflare Workers
- Bundle size impact: ~100KB (acceptable for Workers 10MB limit)

---

## Phase 1: Setup & Dependency Management

### Task 1.1: Install cheerio
- [ ] Add cheerio to `package.json`
  ```bash
  npm install cheerio
  ```
- [ ] Verify bundle size impact with `npm ls cheerio`
- [ ] Confirm Cloudflare Workers compatibility
- [ ] Update `package-lock.json`

**Acceptance Criteria**:
- ✅ cheerio installed and available in imports
- ✅ No breaking changes to existing dependencies
- ✅ Build succeeds without warnings

---

## Phase 2: Parser Refactoring

### Task 2.1: Refactor getEventsFromSite() with cheerio

**Current Code** (regex-based):
```typescript
const tds = row.match(/<td[^>]*>([\s\S]*?)<\/td>/g) || [];
const titleTd = tds[1];
let title = titleTd
  .replace(/<td[^>]*>/g, "")
  .replace(/<\/td>/g, "")
  .replace(/&nbsp;/g, " ")
  .replace(/<[^>]*>/g, "")
  .trim();
```

**Target Code** (cheerio-based):
```typescript
import * as cheerio from 'cheerio';

const $ = cheerio.load(row);
const tds = $('td');

if (tds.length < 2) continue;

// Extract date safely
const dateRangeText = tds.eq(0).text().trim();

// Extract title safely (removes all HTML)
let title = tds.eq(1).text().trim();
```

**Implementation Steps**:
1. Add cheerio import to `src/parser.ts`
2. Refactor `getEventsFromSite()` function:
   - Replace regex table/row matching with cheerio
   - Use `$('table')` to find tables
   - Use `$('tbody tr')` to iterate rows
   - Use `.eq()` and `.text()` for safe text extraction
3. Keep existing date/title cleaning logic
4. Maintain same output: `Event[]` array

**Acceptance Criteria**:
- ✅ All text extraction uses cheerio selectors
- ✅ No regex HTML tag removal (`/<[^>]*>/g`)
- ✅ Code is more readable and maintainable
- ✅ CodeQL warnings resolved

---

## Phase 3: Testing & Validation

### Task 3.1: Update parser tests

**Current Tests to Update**:
- `should parse events from HTML response`
- `should handle events with end dates`
- `should extract title when extra markup exists`
- All other parser tests

**Changes Required**:
- Mock HTML structure remains same (cheerio parses it identically)
- Test assertions unchanged
- No breaking changes to test expectations

**New Test Cases** (if needed):
- `should handle malformed HTML gracefully`
- `should extract text from complex DOM structures`

**Acceptance Criteria**:
- ✅ All 63+ tests passing
- ✅ Parser tests specifically verify cheerio behavior
- ✅ No regressions from previous implementation

### Task 3.2: Verify CodeQL warnings resolved

- [ ] Run CodeQL locally or wait for GitHub scan
- [ ] Confirm "Incomplete multi-character sanitization" warnings gone
- [ ] Check for any new security warnings

**Acceptance Criteria**:
- ✅ CodeQL: 0 high/medium security issues
- ✅ No "HTML injection" warnings
- ✅ Clean security scan report

### Task 3.3: Integration testing with real KNUE website

- [ ] Test parser with actual KNUE website HTML
- [ ] Verify events extracted correctly:
  - Single date events: "03 . 01"
  - Date range events: "03 . 04 - 03 . 10"
  - Events with badges: `<a>제목</a><span>NEW</span>`
  - Events with icons: `<a>제목</a><i></i>`
- [ ] Compare with regex-based implementation

**Acceptance Criteria**:
- ✅ Same number of events extracted
- ✅ Event titles match expected values
- ✅ Date ranges parsed correctly
- ✅ No silent failures or missed events

---

## Phase 4: Commit & PR Update

### Task 4.1: Code review and cleanup

- [ ] Code review for readability
- [ ] Remove unnecessary comments
- [ ] Verify TypeScript types are correct
- [ ] Run linting: `npm run lint`
- [ ] Run type checking: `npm run typecheck`

### Task 4.2: Commit changes

**Commit Message Format**:
```
[Refactor](parser) Replace regex with cheerio for robust HTML parsing

- Add cheerio dependency (~100KB)
- Refactor getEventsFromSite() to use cheerio selectors
- Remove regex-based HTML tag stripping
- Resolve CodeQL security warnings
- Maintain 100% backward compatibility

All 63+ tests passing
CodeQL: 0 security warnings

Generated with Claude Code
```

### Task 4.3: Update PR #18

- [ ] Push to `fix/parser-retry-logic` branch
- [ ] Update PR description with cheerio details
- [ ] Comment on PR with summary of changes
- [ ] Await GitHub checks (CodeQL, linting, tests)

**Acceptance Criteria**:
- ✅ All GitHub checks passing
- ✅ CodeQL scan shows 0 issues
- ✅ PR ready for review/merge

---

## File Changes Summary

| File | Change | Impact |
|------|--------|--------|
| `package.json` | Add cheerio | +100KB bundle |
| `src/parser.ts` | Refactor with cheerio | More maintainable |
| `tests/parser.test.ts` | Update to match new logic | No behavior change |
| PR #18 | Document changes | Clear context |

---

## Rollback Plan

If issues arise:
1. Revert to commit before cheerio install
2. Keep regex-based approach with CodeQL exceptions
3. Re-file issue for future security improvements

---

## Success Criteria

✅ **All of the following must be true**:
- [ ] cheerio successfully installed and available
- [ ] Parser refactored to use cheerio selectors
- [ ] 63+ tests passing
- [ ] CodeQL warnings resolved (0 issues)
- [ ] No regressions in event extraction
- [ ] PR #18 updated and ready for merge
- [ ] Bundle size acceptable (<10MB)
- [ ] Cloudflare Workers deployment successful

---

## Timeline Estimate

| Phase | Tasks | Est. Time |
|-------|-------|-----------|
| 1 | Setup & dependency | 5 min |
| 2 | Parser refactoring | 30 min |
| 3 | Testing & validation | 20 min |
| 4 | Commit & PR update | 10 min |
| **Total** | **All** | **~65 min** |

---

## Notes

- Keep existing test structure (no major rewrites)
- Maintain backward compatibility with existing Event interface
- Document cheerio usage for future maintainers
- Consider adding `.text()` method helper if needed for clarity

---

**Status**: 🔵 Ready to implement
**Last Updated**: 2025-10-22
**Owner**: kadragon + Claude Code
