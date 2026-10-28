# Specification: Assisted Available Slot Selection & Exception Override in Session Modal

## Requirements

### REQ-1: Available Slots Computation & Pill Selection
- When a valid date is selected in `SessionModal`:
  - Invoke `findAvailableSlots({ targetDate, bookedSlots, slotDurationMinutes, weeklyAvailability })`.
  - Render available slots as selectable pills (e.g. "09:00", "10:00", "11:00", "16:00").
  - Clicking a slot pill sets `sessionTime` to that slot's `time` and visually marks the pill as active/selected.
  - If no available slots are found for that day, display an informative banner with an action to enable exception mode.

### REQ-2: Exception Override Toggle
- Provide an accessible toggle: `[ ] Horario personalizado / Excepción`.
- When checked:
  - Display the manual `<input type="time">`.
  - Allow the therapist to choose any valid time.
  - When unchecked:
    - Display slot pills and hide the manual time input (unless no slots exist).

### REQ-3: Preventive Collision Detection
- When exception mode is active and a manual time is entered:
  - Check whether the interval `[slotStart, slotStart + duration]` overlaps with any active (non-cancelled) booked appointment for that day.
  - If an overlap exists, display a warning banner: *"Atención: Se superpone con el turno de [Paciente] ([Hora inicio] a [Hora fin])"*.
  - The warning MUST be informative and prevent accidental double-booking without blocking form submission.

### REQ-4: Configured Session Duration
- Use `defaultSessionDurationMinutes` from `AvailabilitySettings` when creating recurrences or calculating slot intervals instead of a hardcoded 50 minutes.
