# Implementation Tasks: Assisted Available Slot Selection & Exception Override in Session Modal

- [ ] **Phase 1: Domain Helper & Tests**
  - [ ] Implement `findConflictingSlot(dateTime: Date, durationMinutes: number, bookedSlots: CalendarSlot[]): CalendarSlot | undefined` in `src/domain/agenda.service.ts`.
  - [ ] Add unit tests in `src/domain/agenda.service.test.ts` verifying collision detection.

- [ ] **Phase 2: SessionModal Integration**
  - [ ] Update `src/ui/components/SessionModal.tsx` to consume availability settings and render available slot pills.
  - [ ] Add exception toggle for custom manual time.
  - [ ] Integrate conflict detection warning when a manual time overlaps an existing appointment.
  - [ ] Use `defaultSessionDurationMinutes` from settings for recurrence and slot calculation.

- [ ] **Phase 3: Page & RescheduleModal Unified Wiring**
  - [ ] Pass `bookedSlots={agenda}` to `SessionModal` in `src/app/page.tsx`.
  - [ ] Pass `weeklyAvailability` to `RescheduleModal` in `src/ui/views/CalendarView.tsx`.

- [ ] **Phase 4: Verification & Engram Persistence**
  - [ ] Run `npx tsc --noEmit` (0 errors).
  - [ ] Run `npx vitest run` (100% green).
  - [ ] Add E2E tests for slot pill selection and exception toggle.
  - [ ] Save milestone in Engram.
