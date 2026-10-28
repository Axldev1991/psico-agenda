# Implementation Tasks: Therapist Weekly Availability & Session Duration Settings

- [x] **Phase 1: Domain Modeling & TDD**
  - [x] Create `src/domain/availability.types.ts` with `TimeRange`, `DaySchedule`, `WeeklyAvailability`, and `AvailabilitySettings`.
  - [x] Create test suite `src/domain/availability.service.test.ts` testing range validation, non-overlapping constraints, schedule copying, slot containment, and default settings.
  - [x] Implement pure domain functions in `src/domain/availability.service.ts` to make tests 100% green.
  - [x] Update `src/domain/agenda.service.ts` to incorporate `weeklyAvailability` into `findAvailableSlots` and verify with tests.

- [x] **Phase 2: Persistence & Infrastructure**
  - [x] Update `src/repositories/settings.repository.ts` with `getAvailabilitySettings` and `saveAvailabilitySettings`.
  - [x] Implement methods in `src/infrastructure/db/dexie-settings.repository.ts` storing availability in IndexedDB / local storage.
  - [x] Add unit test verification for repository methods in `src/infrastructure/db/dexie-settings.repository.test.ts`.

- [x] **Phase 3: Hooks & UI Components**
  - [x] Create `src/ui/hooks/useAvailabilitySettings.ts` for reactive state, error tracking, and persistence.
  - [x] Create `src/ui/components/settings/DayScheduleRow.tsx` with toggle, range inputs, add/remove range buttons.
  - [x] Create `src/ui/components/settings/CopyScheduleModal.tsx` for 1-click day cloning.
  - [x] Create `src/ui/components/settings/AvailabilitySettingsTab.tsx` with session duration selector and weekly schedule list.
  - [x] Integrate tab into `src/ui/components/SettingsPanel.tsx`.

- [x] **Phase 4: Verification & Engram Persistence**
  - [x] Verify `npx tsc --noEmit` (0 errors).
  - [x] Verify `npx vitest run` (95/95 passing tests).
  - [x] Verify E2E suite passes with dedicated spec `tests/e2e/availability-settings.spec.ts`.
  - [x] Save milestone in Engram.
