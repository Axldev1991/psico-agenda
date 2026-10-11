# Tasks: Decouple UI Orchestration

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | ~450 lines (predominantly deletions in page.tsx) |
| 400-line budget risk | Medium |
| Chained PRs recommended | No |
| Suggested split | Single refactoring unit |
| Delivery strategy | auto-chain |
| Chain strategy | size-exception |

Decision needed before apply: No
Chained PRs recommended: No
Chain strategy: size-exception
400-line budget risk: Medium

### Suggested Work Units

| Unit | Goal | Likely PR | Focused test command | Runtime harness | Rollback boundary |
|------|------|-----------|----------------------|-----------------|-------------------|
| 1 | Extract recent patients hook and UI context | PR 1 | `npx vitest run src/ui/hooks/useRecentPatients.test.ts` | Local browser PWA | Revert `src/ui/hooks/` and `src/ui/context/` |
| 2 | Decompose views and slim down page.tsx | PR 1 | `npx vitest run` | Local browser PWA | Revert `src/ui/views/` and `src/app/page.tsx` |

## Phase 1: Foundation (Hooks & Context)

- [x] 1.1 Create `src/ui/hooks/useRecentPatients.ts` with safe `localStorage` sync and error fallback.
- [x] 1.2 Create `src/ui/hooks/useRecentPatients.test.ts` with unit tests covering initial load, deduplication, and corrupt storage.
- [x] 1.3 Create `src/ui/context/UIContext.tsx` providing `UIContext`, `UIProvider`, and `useUIState` hook.

## Phase 2: View Containers

- [x] 2.1 Create `src/ui/views/CalendarView.tsx` consuming `useCalendar` and coordinating calendar grid and session triggers.
- [x] 2.2 Create `src/ui/views/PatientsView.tsx` consuming `usePatients` and coordinating patient management and dossier details.
- [x] 2.3 Create `src/ui/views/SettingsView.tsx` consuming `useGoogleDrive` and `useSettings` for preferences and sync diagnostics.

## Phase 3: Page Refactor & Wiring

- [x] 3.1 Refactor `src/app/page.tsx` to provide `UIProvider` and mount `SessionSidebar`, active view container, and global modals.
- [x] 3.2 Update `src/ui/components/SessionSidebar.tsx` if needed to consume `UIContext` and `useRecentPatients`.

## Phase 4: Verification & Regression Tests

- [x] 4.1 Run `npx vitest run` to verify all test suites pass.
- [x] 4.2 Verify build cleanliness with `npx next build` or type check.
