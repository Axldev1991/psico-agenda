# Proposal: Assisted Available Slot Selection & Exception Override in Session Modal

## Problem
Currently, when scheduling a new appointment in `SessionModal`, the therapist must manually enter both the date and the time via a free-form `<input type="time">`. There is no visual guidance showing open, unbooked slots within the therapist's working hours, leading to friction or scheduling outside availability by mistake. At the same time, clinical practice strictly requires therapist sovereignty: the professional must retain the freedom to schedule emergency or exceptional appointments outside standard working hours without the system rigidly blocking them.

## Proposed Solution
1. **Assisted Slot Selection**:
   - In `SessionModal`, upon selecting a date, compute and display available open consultation slots as clickable pills using `findAvailableSlots` with the therapist's configured `weeklyAvailability` and `defaultSessionDurationMinutes`.
   - Selecting a pill automatically populates `sessionTime`.
2. **Exception Mode**:
   - Provide an "Agendar fuera de disponibilidad habitual" toggle/link.
   - When enabled (or automatically if no slots exist on that date), expose the manual `<input type="time">` to allow any arbitrary time.
3. **Collision Warning**:
   - If an exception time overlaps with an already booked patient on that day, display a non-blocking preventive warning: *"Atención: Se superpone con [Paciente] (HH:mm - HH:mm)"*.
4. **Dynamic Duration**:
   - Replace the hardcoded 50-minute duration with `defaultSessionDurationMinutes` from `AvailabilitySettings`.
