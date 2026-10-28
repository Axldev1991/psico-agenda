# Specification: Therapist Weekly Availability & Session Duration Settings

## Requirements

### REQ-1: Domain Model & Validation
- **Types**:
  - `TimeRange`: `{ start: string; end: string }` where time is formatted as `"HH:mm"`.
  - `DaySchedule`: `{ enabled: boolean; ranges: TimeRange[] }`.
  - `WeeklyAvailability`: `Record<number, DaySchedule>` for days 0 (Sunday) to 6 (Saturday).
  - `AvailabilitySettings`: `{ weekly: WeeklyAvailability; defaultSessionDurationMinutes: number; intervalStepMinutes: number }`.
- **Validation**:
  - `validateTimeRange(range: TimeRange): boolean`: returns true only if `start < end` in 24h `"HH:mm"` format.
  - `validateDayRanges(ranges: TimeRange[]): { valid: boolean; error?: string }`: returns true only if every range is valid and ranges do not overlap.
- **Copy Utility**:
  - `copySchedule(weekly: WeeklyAvailability, fromDay: number, toDays: number[]): WeeklyAvailability`: returns a new immutable `WeeklyAvailability` with `DaySchedule` deeply cloned to the specified target days.

### REQ-2: Integration with Available Slots Computation
- In `findAvailableSlots`:
  - Accept optional `weeklyAvailability?: WeeklyAvailability`.
  - When provided, candidate slots for `targetDate` must only be offered if:
    1. The target day of week is `enabled`.
    2. The full consultation interval `[slotStart, slotStart + duration]` falls completely within at least one configured `TimeRange` of that day.
  - Use `slotDurationMinutes` from settings (or params) when checking fit.

### REQ-3: Settings Persistence (IndexedDB)
- Extend `ISettingsRepository` and `DexieSettingsRepository` with:
  - `getAvailabilitySettings(): Promise<AvailabilitySettings>`
  - `saveAvailabilitySettings(settings: AvailabilitySettings): Promise<void>`
- Provide sensible defaults (e.g., Monday through Friday enabled from 09:00 to 13:00 and 15:00 to 19:00, 50 min session, 60 min step).

### REQ-4: UI Configuration Panel
- Add "Disponibilidad" tab to `SettingsPanel`.
- Session duration selector (30, 45, 50, 60 min).
- Weekly schedule manager:
  - Per day row: Day name, active switch toggle.
  - When active: list of time ranges with inputs, remove button per range, and `+ Agregar franja` button.
  - "Copiar a..." button with multi-select day chips to replicate ranges in 1 click.
- Accessible focus states and minimum 16px font size floor (14px only for micro-badges).
