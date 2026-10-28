# Proposal: Therapist Weekly Availability & Session Duration Settings

## Problem
In clinical psychology practice, therapists have non-uniform working schedules across weekdays. Some days involve split shifts (e.g. morning 09:00–13:00 and afternoon 15:00–19:00), partial days, or days off. Configuring hours day-by-day from scratch is cumbersome, while a single uniform schedule is too rigid. Furthermore, consultation slots and rescheduling assistants currently assume hardcoded default hours (08:00–20:00) and fixed durations without user-configurable session length.

## Proposed Solution
1. **Domain Layer**:
   - Introduce `src/domain/availability.types.ts` and `src/domain/availability.service.ts` with pure types and functions:
     - `TimeRange` (`start`, `end`) and `DaySchedule` (`enabled`, `ranges: TimeRange[]`).
     - `WeeklyAvailability` (mapping days of the week 0–6 to `DaySchedule`).
     - Pure validation utilities: ensuring `start < end` and no overlapping ranges within the same day.
     - Pure cloning helper: `copyDayScheduleToDays(weekly, fromDay, targetDays)`.
     - Update `findAvailableSlots` in `src/domain/agenda.service.ts` to evaluate candidate slots against the configured `WeeklyAvailability` and session duration.
2. **Infrastructure Layer (Persistence)**:
   - Store therapist availability configuration and default session duration (`sessionDurationMinutes`) in IndexedDB via `ISettingsRepository` / Dexie.
3. **UI Layer**:
   - Add a dedicated "Disponibilidad" (Availability) tab inside `SettingsPanel`.
   - Provide day-by-day schedule toggles, split-shift range additions/removals, and a one-click "Copiar a..." multi-day copy action.
   - Provide session duration configuration selector (e.g. 30, 45, 50, 60 minutes).
   - Ensure accessible typography (16px base, 14px floor for compact badges/pills).
