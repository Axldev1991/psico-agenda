# Tasks: Drive Sync Conflict Resolution

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | ~200 lines |
| 400-line budget risk | Low |
| Chained PRs recommended | No |
| Suggested split | Single work unit |
| Delivery strategy | auto-chain |
| Chain strategy | stacked-to-main |

Decision needed before apply: No
Chained PRs recommended: No
Chain strategy: stacked-to-main
400-line budget risk: Low

### Suggested Work Units

| Unit | Goal | Likely PR | Focused test command | Runtime harness | Rollback boundary |
|------|------|-----------|----------------------|-----------------|-------------------|
| 1 | Pure session merger & tests | PR 1 | `npx vitest run src/infrastructure/drive/drive-sync-merger.test.ts` | Node / Vitest | Revert `src/infrastructure/drive/drive-sync-merger.*` |
| 2 | Service integration & tests | PR 1 | `npx vitest run src/infrastructure/drive/drive-sync.service.test.ts` | Node / Vitest | Revert `src/infrastructure/drive/drive-sync.service.*` |

## Phase 1: Foundation (Pure Merger & TDD)

- [x] 1.1 Create `src/infrastructure/drive/drive-sync-merger.ts` implementing `mergeSessionsByLWW`.
- [x] 1.2 Create `src/infrastructure/drive/drive-sync-merger.test.ts` with comprehensive unit tests for local newer, remote newer, disjoint sets, and date fallbacks.

## Phase 2: Service Integration

- [x] 2.1 Refactor `DriveSyncService.downloadPatientHistory` to use `mergeSessionsByLWW` instead of wiping local sessions.
- [x] 2.2 Refactor `DriveSyncService.preloadAllForOffline` to use `mergeSessionsByLWW`.
- [x] 2.3 Refactor `DriveSyncService.performSync` to reconcile downloaded and uploaded sessions bidirectionally without data loss.

## Phase 3: Integration Verification

- [x] 3.1 Add integration test in `src/infrastructure/drive/drive-sync.service.test.ts` verifying offline-created sessions survive sync.
- [x] 3.2 Run `npx vitest run` to verify all test suites pass.
- [x] 3.3 Run `npx tsc --noEmit` to verify zero TypeScript errors.
