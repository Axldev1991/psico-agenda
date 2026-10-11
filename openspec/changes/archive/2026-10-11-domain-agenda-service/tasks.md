# Tasks: Pure Domain Agenda Service

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | ~250 lines |
| 400-line budget risk | Low |
| Chained PRs recommended | No |
| Suggested split | Single PR / work unit |
| Delivery strategy | auto-chain |
| Chain strategy | stacked-to-main |

Decision needed before apply: No
Chained PRs recommended: No
Chain strategy: stacked-to-main
400-line budget risk: Low

### Suggested Work Units

| Unit | Goal | Likely PR | Focused test command | Runtime harness | Rollback boundary |
|------|------|-----------|----------------------|-----------------|-------------------|
| 1 | Pure domain service with unit tests | PR 1 | `npx vitest run src/domain/agenda.service.test.ts` | Node / Vitest | Revert `src/domain/agenda.*` |
| 2 | Hook integration in useCalendar | PR 1 | `npx vitest run` | Local PWA browser | Revert `src/ui/hooks/useCalendar.ts` |

## Phase 1: Domain Types & TDD Tests

- [x] 1.1 Create `src/domain/agenda.types.ts` defining `CalendarSlot` and `ComputeAgendaSlotsParams`.
- [x] 1.2 Create `src/domain/agenda.service.test.ts` with unit tests for recurrence rules, DB session overrides, manual appointments, holidays, and chronological sorting (RED).

## Phase 2: Domain Service Implementation

- [x] 2.1 Implement `computeAgendaSlots` in `src/domain/agenda.service.ts` to pass all tests (GREEN).

## Phase 3: UI Hook Integration

- [x] 3.1 Refactor `src/ui/hooks/useCalendar.ts` to delegate slot computation to `computeAgendaSlots` via `useMemo`.
- [x] 3.2 Update `src/ui/components/CalendarGrid.tsx` type imports to consume `CalendarSlot` from `src/domain/agenda.types`.

## Phase 4: Verification & Regression Tests

- [x] 4.1 Run `npx vitest run` to ensure all unit and domain tests pass cleanly.
- [x] 4.2 Run `npx tsc --noEmit` to verify type safety across the entire codebase.
