# Tasks: Clinical Notes Persistence & Drive Sync Verification

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | ~150-250 lines |
| 400-line budget risk | Low |
| Chained PRs recommended | No |
| Suggested split | Single work unit |
| Delivery strategy | single-pr |
| Chain strategy | direct |

## Phase 1: Test Suite Implementation

- [x] 1.1 Create `src/infrastructure/drive/clinical-notes-persistence.integration.test.ts` testing the happy-path note authoring, local persistence, and Drive JSON + `.doc` upload.
- [x] 1.2 Add DLP Guard verification test: assert patient with `isHistoryLoaded: false` cannot push notes to Drive.
- [x] 1.3 Add Offline / API failure resilience test: assert API rejection leaves local Dexie data 100% intact.
- [x] 1.4 Add multi-session chronological compilation test: assert multiple therapy sessions are cleanly assembled in `Historial_Clinico.doc`.

## Phase 2: Verification & Quality Gate

- [x] 2.1 Run `npx vitest run src/infrastructure/drive/clinical-notes-persistence.integration.test.ts`.
- [x] 2.2 Run full project suite `npx vitest run`.
- [x] 2.3 Run TypeScript type check `npx tsc --noEmit`.
- [x] 2.4 Verify production build `npm run build`.

## Phase 3: Archive & Engram Persistence

- [x] 3.1 Document verification report and archive change in `openspec/changes/archive/`.
- [x] 3.2 Persist archive memory in Engram.
