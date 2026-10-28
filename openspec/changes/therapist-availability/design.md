# Technical Design: Therapist Weekly Availability & Session Duration Settings

## Architecture & Layering

### 1. Domain Layer (`src/domain/availability.types.ts` & `src/domain/availability.service.ts`)
- Pure functions and interfaces without external dependencies:
  - `timeToMinutes(time: string): number`
  - `validateTimeRange(range: TimeRange): boolean`
  - `validateDayRanges(ranges: TimeRange[]): { valid: boolean; error?: string }`
  - `copySchedule(weekly: WeeklyAvailability, fromDay: number, toDays: number[]): WeeklyAvailability`
  - `isSlotWithinAvailability(slotStart: Date, durationMinutes: number, schedule: DaySchedule): boolean`
  - `getDefaultAvailabilitySettings(): AvailabilitySettings`
- Companion test suite: `src/domain/availability.service.test.ts` with 100% test coverage.
- Update `src/domain/agenda.service.ts` to consume `weeklyAvailability` in `findAvailableSlots`.

### 2. Infrastructure Layer (`src/infrastructure/db/dexie-settings.repository.ts`)
- Store settings under a dedicated key `'therapist_availability'` in `app_settings` / `settings` table.
- Implement `getAvailabilitySettings()` with fallback to `getDefaultAvailabilitySettings()`.
- Implement `saveAvailabilitySettings()`.

### 3. Application / Hooks Layer (`src/ui/hooks/useAvailabilitySettings.ts`)
- Encapsulate loading, reactive state, validation errors, and save operations.
- Expose helpers: `updateDay(day, schedule)`, `copyDay(fromDay, targetDays)`, `updateDuration(minutes)`, `save()`.

### 4. UI Layer (`src/ui/components/settings/AvailabilitySettingsTab.tsx`)
- Tab in `SettingsPanel.tsx`.
- Sub-components:
  - `DayScheduleRow.tsx`: Day toggle, range rows, add range button, copy modal/popover trigger.
  - `CopyScheduleModal.tsx`: Day selection pills (Lun, Mar, Mié, Jue, Vie, Sáb, Dom) with "Aplicar" button.
  - Duration picker: Segmented pill buttons (30m, 45m, 50m, 60m).
- 16px baseline typography adherence.
