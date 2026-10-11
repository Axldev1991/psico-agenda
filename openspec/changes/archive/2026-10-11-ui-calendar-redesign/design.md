# Design: UI Calendar & Appointments Redesign (Fase 3)

## Architecture & Decomposition
Following Single Responsibility Principle (SRP) and avoiding monolith components:
- Break down `CalendarGrid.tsx` (390 lines) into focused components inside `src/ui/components/calendar/`:
  1. `CalendarHeader.tsx`: Title, subtitle, week range, segmented prev/today/next, and primary "Programar turno" button.
  2. `WeekStrip.tsx`: 7-day strip with day abbreviation, day number, today pill, holiday emoji/tag, and count badge.
  3. `AppointmentCard.tsx`: Individual appointment row with `.when`, `.bar`, `.who` (with `data-sensitive`), `.what` (modality + recurring icon), status badge, and actions.
  4. `AppointmentEmptyState.tsx`: Visual empty state with action trigger.
  5. `MiniMonthCalendar.tsx`: Month picker with session dots and active day selection.
- Refactor `CalendarGrid.tsx` to act purely as the layout coordinator composing these 5 components.
- Redesign `SessionModal.tsx` to match the design guide specifications.
