# Proposal: Advanced Agenda Management (Multi-Day Recurrence, Rescheduling & Patient Swap)

## Intent

Psychology practices operate in dynamic real-world circumstances where fixed weekly schedules must flexibly adapt:
1. Patients frequently require flexible cadences: attending 2 or more days per week (e.g., Monday and Thursday for intensive therapy), biweekly (every 14 days for maintenance), or monthly.
2. Unplanned schedule changes require rescheduling either:
   - **Eventually (one-off exception)**: Moving this week's appointment to an open slot without altering the regular recurrence.
   - **Permanently (schedule mutation)**: Changing the patient's habitual day and time from now on.
3. Two patients frequently need to swap their appointment slots ("enroque de turnos") due to conflicting schedules, either for a single week or as a permanent trade.

The goal is to implement robust domain modeling and UI workflows for **Multi-Day & Custom Recurrence**, **Slot Rescheduling (Eventual vs Permanent)**, and **Atomic Two-Patient Turn Swapping** without data loss or calendar ghosting.

## Scope

### In Scope
- **Domain & Recurrence Engine**:
  - Extend recurrence rule generators to handle multi-day selection (`BYDAY=MO,TH`), biweekly intervals (`INTERVAL=2`), and monthly cadences.
  - Add domain functions in `agenda.service.ts` for computing available free slots within the working interval.
  - Implement pure domain helpers for calculating eventual exceptions and atomic patient slot swaps.
- **UI & Modal Enhancements**:
  - `SessionModal`: Redesign recurrence selector to support:
    - Days of week multi-select pill checkboxes (L, M, M, J, V, S).
    - Cadence dropdown: Semanal (1 sem), Quincenal (14 días), Mensual (1 mes).
  - `RescheduleModal` (new component):
    - Choice 1: Mover a horario disponible (with visual slot picker).
    - Choice 2: Intercambiar con otro paciente (Turn Swap selector).
    - Scope toggle: "Solo este turno (Eventual)" vs "De ahora en adelante (Permanente)".
  - `AppointmentCard`: Add "Reagendar" action button opening the modal.
- **Testing**:
  - Unit tests in `agenda.service.test.ts` for multi-day RRule expansion, biweekly skips, and swap calculations.
  - Integration tests for eventual vs permanent rescheduling persistence in Dexie.

### Out of Scope
- Integration with external Google Calendar iCal exports.
- Automated WhatsApp notifications (covered in future communication milestone).

## Capabilities

### New Capabilities
- `advanced-agenda-recurrence`: Support for multi-day selection, biweekly (interval=2), and monthly therapy cadences.
- `turn-rescheduling-and-swap`: Pure domain and UI workflows for moving slots and atomically swapping two patients' appointments (eventual vs permanent).

### Modified Capabilities
- `agenda-domain-service`: Extend `computeAgendaSlots` to handle multi-day and swap overrides seamlessly.

## Success Criteria

- [ ] A patient can be scheduled for multiple days per week (e.g. MO and TH).
- [ ] A patient can be scheduled biweekly (every 14 days) and monthly.
- [ ] Rescheduling a slot eventually creates a local override without altering future weeks.
- [ ] Swapping two patients eventually exchanges their slots for that specific week only.
- [ ] Permanent changes update `RecurrenceRule` records cleanly.
- [ ] All Vitest tests pass with 100% coverage on new domain logic.
- [ ] `tsc --noEmit` and Next.js build pass with 0 errors.
