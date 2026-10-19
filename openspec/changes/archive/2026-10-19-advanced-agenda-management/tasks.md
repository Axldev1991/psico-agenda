# Tasks: Advanced Agenda Management

## Review Workload Forecast

| Field | Value |
|---|---|
| Estimated changed lines | ~350 lines |
| 400-line budget risk | Low |
| Chained PRs recommended | No |
| Suggested split | Single work unit |
| Delivery strategy | single-pr |
| Chain strategy | direct |

## Phase 1: Domain Service & Pure Helpers (TDD)

- [x] 1.1 Implement `buildRRuleString` in `src/domain/agenda.service.ts` supporting multi-day (`BYDAY=MO,TH`), biweekly (`INTERVAL=2`), and monthly cadences.
- [x] 1.2 Implement `findAvailableSlots` in `src/domain/agenda.service.ts` to calculate unbooked clinical slots.
- [x] 1.3 Add comprehensive unit tests in `src/domain/agenda.service.test.ts` for multi-day, biweekly skips, monthly recurrences, and free slot calculation.

## Phase 2: Hook & State Operations (useCalendar)

- [x] 2.1 Update `addRecurrence` in `src/ui/hooks/useCalendar.ts` to accept multi-day array and cadence parameters.
- [x] 2.2 Implement `rescheduleSlot` in `src/ui/hooks/useCalendar.ts` (handling eventual exception vs permanent rule update).
- [x] 2.3 Implement `swapSlots` in `src/ui/hooks/useCalendar.ts` (handling eventual cross-session creation vs permanent rule exchange).

## Phase 3: UI Components & Workflows

- [x] 3.1 Upgrade `SessionModal.tsx` with multi-day weekday pill selectors and cadence dropdown (Semanal, Quincenal, Mensual).
- [x] 3.2 Create `RescheduleModal.tsx` for moving to free slot or swapping patients with eventual/permanent toggle.
- [x] 3.3 Add "Reagendar" button to `AppointmentCard.tsx` and integrate modal into `CalendarView.tsx`.

## Phase 4: Verification & Quality Gate

- [x] 4.1 Run `npx vitest run`.
- [x] 4.2 Run `npx tsc --noEmit`.
- [x] 4.3 Verify production build `npm run build`.

## Phase 5: Archive & Engram Persistence

- [x] 5.1 Document verification and archive change in `openspec/changes/archive/`.
- [x] 5.2 Persist archive memory in Engram.
