# Implementation Tasks: Therapist Vacation & Absence Periods

- [x] **Phase 1: Domain & Types (TDD)**
  - [x] Add `AbsencePeriod` to `src/domain/availability.types.ts`.
  - [x] Implement `isDateInAbsence` in `src/domain/availability.service.ts` and add unit tests in `src/domain/availability.service.test.ts`.
  - [x] Update `findAvailableSlots` in `src/domain/agenda.service.ts` to respect `absencePeriods`.
  - [x] Update `computeAgendaSlots` in `src/domain/agenda.service.ts` to tag recurring slots with `isSuspended: true` and `absence: period`.
  - [x] Update `calculateProjectedMonthlyRevenue` in `src/domain/billing.service.ts` to exclude suspended sessions. Add unit test in `billing.service.test.ts`.

- [x] **Phase 2: Persistence & Repository Integration**
  - [x] Ensure `dexie-settings.repository.ts` stores and retrieves `absencePeriods`.
  - [x] Update tests in `dexie-settings.repository.test.ts`.

- [x] **Phase 3: Settings UI for Absence Management**
  - [x] Create `AbsencePeriodsManager.tsx` with date picker and reason input.
  - [x] Integrate into `AvailabilitySettingsTab.tsx`.

- [x] **Phase 4: Calendar & SessionModal UI Integration**
  - [x] Pass `absencePeriods` to `CalendarGrid` and style days in receso with banner and tinted column.
  - [x] Render suspended sessions with strikethrough styling and badge in `CalendarEventCard.tsx`.
  - [x] Add absence warning banner in `SessionModal.tsx` when a manual exception falls in a vacation range.

- [x] **Phase 5: Verification & E2E Testing**
  - [x] Run `npx tsc --noEmit` (0 errors).
  - [x] Run `npx vitest run` (100% green, 110 passed).
  - [x] Add Playwright E2E test verifying absence period creation, struck-through sessions in calendar, and billing exclusion (18 passed).
