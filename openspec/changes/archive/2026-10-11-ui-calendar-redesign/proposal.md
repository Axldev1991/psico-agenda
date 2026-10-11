# Proposal: UI Calendar & Appointments Redesign (Fase 3)

## Motivation
The calendar and appointment scheduling workflows are the core daily operational surface of Psico-Agenda. The current implementation in `CalendarGrid.tsx` and `SessionModal.tsx` uses legacy color tokens (`brand-sand`, `brand-indigo`), emoji icons (☕, ⏰, 📄, 🗑, 🎉), and lacks proper alignment with `docs/psico-agenda-guia-de-diseno-02.html`.

This change refactors the calendar view, the week strip, daily appointment cards, the empty state, the mini calendar sidebar, and the appointment scheduling modal into modular, accessible components adhering to SRP, DRY, and design guide 02.

## Proposed Scope
1. **Calendar Header (`CalendarHeader.tsx`)**:
   - Title "Agenda" (Newsreader serif 500) and subtitle with week range.
   - Week navigation segmented control: previous (Icon `chev-l`), "Hoy", next (Icon `chev-r`).
   - Primary action: "+ Programar turno" (Icon `plus`).
2. **Week Navigation Strip (`WeekStrip.tsx`)**:
   - 7 columns for Monday through Sunday.
   - Day name, day number, "Hoy" badge, and appointment count pill.
   - Clear active day styling with primary petroleum contrast.
3. **Daily Appointments List (`AppointmentList.tsx`)**:
   - Section header with date and appointment count.
   - Appointment card (`AppointmentCard.tsx`):
     - Time range (`HH:mm` to `HH:mm + 50m`).
     - Modality icon (`pin` for presencial, `video` for videollamada).
     - Clinical state indicator bar and badges (`badge--ok`, `badge--warn`, `badge--off`).
     - Patient name with `data-sensitive` blur support.
     - Action menu: "Ver ficha", status update dropdown, and recurring rule removal.
   - Meaningful empty state (`AppointmentEmptyState.tsx`):
     - Calendar icon, explanatory message, and secondary "+ Programar turno" button.
4. **Mini Calendar (`MiniMonthCalendar.tsx`)**:
   - Clean month-to-month navigation with `chev-l` and `chev-r`.
   - Days grid with appointment indicator dots and selected week/day highlight.
5. **Appointment Modal (`SessionModal.tsx`)**:
   - Redesigned per guide 02: clean inputs, 24h format helper, recurrence checkbox card with visual feedback and schedule explanation.
