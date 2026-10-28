# Design: Therapist Vacation & Absence Periods

## Architecture
- **Clean Architecture Boundaries:**
  - `src/domain/availability.types.ts`: define `AbsencePeriod`.
  - `src/domain/availability.service.ts`: pure functions `isDateInAbsence`, period overlap checks, 100% unit tested.
  - `src/domain/agenda.service.ts`: enrich `CalendarSlot` with `absence` and `isSuspended` attributes.
  - `src/domain/billing.service.ts`: filter out `isSuspended` slots from projected revenue calculations.
  - `src/infrastructure/db/dexie-settings.repository.ts`: backward-compatible JSON storage of `absencePeriods` in settings.
  - `src/ui/`: presentation components consuming `useAvailabilitySettings()`.

## UI/UX Considerations
- **16px floor**: Body text and inputs in the absence period manager maintain the 16px baseline standard.
- **14px badges**: Status tags ("Suspendido por receso", "🏖️ Vacaciones") use compact badges.
- **Accessibility**: Clear contrast ratios on tinted columns and strikethrough text with aria-label annotations.
