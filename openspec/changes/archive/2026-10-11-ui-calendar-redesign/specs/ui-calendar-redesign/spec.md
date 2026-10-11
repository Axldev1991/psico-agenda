# UI Calendar & Appointments Specification

## Purpose
Specifies layout, components, accessibility, and visual interactions for the Calendar View, Day View, and Appointment Scheduling Modal following `docs/psico-agenda-guia-de-diseno-02.html`.

## Requirements

### Requirement: Calendar View Header
The calendar header SHALL:
- Display the view title `Agenda` with serif typography (`font-serif`) and subtitle detailing the week interval in natural Spanish (e.g. `Semana del 6 al 12 de octubre de 2026`).
- Include a segmented control for week navigation with previous week (`chev-l` icon), "Hoy" quick jump, and next week (`chev-r` icon).
- Provide a single primary action button `+ Programar turno` with `plus` icon and petroleum styling (`#2C5F6B`).

### Requirement: Week Day Strip
The week strip SHALL:
- Display all 7 days from Monday to Sunday.
- Show abbreviated day name (e.g. `lun`, `mar`), numeric day, and a badge for `Hoy`.
- Render an appointment count badge when slots exist.
- Highlight the currently selected day with clear active styling and `aria-pressed="true"`.

### Requirement: Appointment Cards & State Feedback
Each appointment card SHALL:
- Display start time and calculated end time (+50m).
- Render a colored status bar corresponding to session status (`ok` for confirmed/completed, `warn` for scheduled/pending, `off` for cancelled).
- Render the patient name tagged with `data-sensitive` for privacy blur.
- Display session modality with icon (`pin` for in-person, `video` for remote) and recurrence indicator (`repeat` icon).
- Display a status badge with corresponding icon (`check`, `alert`, `x`).
- Provide direct actions to view patient details (`Ver ficha`), change status, and delete recurrence rules.

### Requirement: Empty Day State
When no appointments are scheduled for the selected day:
- Render a calm empty state with `calendar` icon, heading `No hay turnos para este día`, instructional body `Programá un turno o elegí otro día en el calendario.`, and a secondary action button `Programar turno`.

### Requirement: Mini Month Calendar
The calendar sidebar SHALL:
- Display month navigation with previous/next controls.
- Highlight the current day and selected date.
- Display dot indicators on days with scheduled sessions.

### Requirement: Appointment Scheduling Modal
The appointment modal SHALL:
- Open in an accessible dialog container with title `Programar turno o sesión` and close icon (`x`).
- Provide patient select, recurrence toggle card, date input, and 24-hour time input with helper text.
- When recurrence is checked, dynamically explain the schedule (e.g. "Se repetirá todos los martes a las 16:00").
