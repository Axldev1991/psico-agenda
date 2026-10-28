# Technical Design: Assisted Available Slot Selection & Exception Override in Session Modal

## Architecture & Layering

### 1. Domain Layer (`src/domain/agenda.service.ts`)
- Add a helper function `findConflictingSlot(dateTime: Date, durationMinutes: number, bookedSlots: CalendarSlot[]): CalendarSlot | undefined` to identify any active booked slot collision for collision warning.
- Unit test helper in `src/domain/agenda.service.test.ts`.

### 2. UI Layer (`src/ui/components/SessionModal.tsx`)
- Props:
  - Add optional `bookedSlots?: CalendarSlot[]`.
- State:
  - `isCustomTime: boolean` (default false when slots are available, true if no slots or user toggles).
- Hooks:
  - Consume `useAvailabilitySettings()` to get `settings.weekly` and `settings.defaultSessionDurationMinutes`.
- Memoized calculations:
  - `availableSlots = findAvailableSlots(...)`.
  - `conflictingSlot = isCustomTime ? findConflictingSlot(...) : undefined`.
- Render:
  - When `!isCustomTime && availableSlots.length > 0`: Grid of slot pills + toggle button "Horario personalizado".
  - When `isCustomTime || availableSlots.length === 0`: `<input type="time">` + warning banner if `conflictingSlot` exists.

### 3. Application Integration (`src/app/page.tsx`)
- Pass `bookedSlots={agenda}` to `<SessionModal />`.
- Pass `bookedSlots={agenda}` and `weeklyAvailability={settings.weekly}` to `<RescheduleModal />` for unified availability across all agenda modals.
