# Specification: Vacation & Recess Periods

## Data Structures
```typescript
export interface AbsencePeriod {
  id: string;
  startDate: string; // ISO format "YYYY-MM-DD"
  endDate: string;   // ISO format "YYYY-MM-DD"
  reason: string;    // e.g. "Vacaciones de verano", "Congreso de Psicología"
}

// Stored within AvailabilitySettings:
export interface AvailabilitySettings {
  weekly: WeeklyAvailability;
  defaultSessionDurationMinutes: number;
  intervalStepMinutes: number;
  absencePeriods?: AbsencePeriod[];
}
```

## Functional Requirements
1. **Domain Logic (`src/domain/availability.service.ts`):**
   - `isDateInAbsence(date: Date, absences: AbsencePeriod[]): AbsencePeriod | undefined`
   - `findAvailableSlots`: if target date falls in an active absence period, immediately return `[]`.
2. **Agenda Projection (`src/domain/agenda.service.ts`):**
   - `CalendarSlot` receives an optional `absence?: AbsencePeriod` and `isSuspended?: boolean`.
   - When generating slots, if a recurring occurrence falls into an active absence period:
     - Mark `isSuspended: true` and `absence: period`.
     - Status remains identifiable for visibility, but flagged as suspended.
3. **Billing Integration (`src/domain/billing.service.ts`):**
   - Sessions where `isSuspended === true` MUST be excluded from projected monthly revenue.
4. **UI Settings (`AvailabilitySettingsTab.tsx`):**
   - New section: "Períodos de receso y vacaciones".
   - List configured periods with start date, end date, reason, and delete button.
   - Form/Modal to add a new period with validation (`startDate <= endDate`).
5. **Calendar View (`CalendarGrid.tsx` & `CalendarDayColumn.tsx`):**
   - Header badge indicating absence (e.g., `🏖️ Receso: Vacaciones`).
   - Column background tinted with clinical amber/recess tone.
   - Suspended appointments rendered struck-through (`line-through text-ink-sub/70`) with badge `Suspendido por receso`.
6. **Session Modal Alert (`SessionModal.tsx`):**
   - If user sets manual time on a date during an absence period, show warning banner:
     "⚠️ Atención: Esta fecha coincide con un período de receso configurado ([Motivo] del DD/MM al DD/MM)."
