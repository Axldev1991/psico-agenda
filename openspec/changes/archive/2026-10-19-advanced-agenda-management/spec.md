# Specification: Advanced Agenda Management

## Purpose

Specifies domain models, expansion rules, and interactions for multi-day recurrences, custom cadences, single-slot rescheduling, and atomic two-patient turn swapping.

## Requirements

### Requirement: Flexible Recurrence Cadences & Multi-Day Scheduling
The system SHALL expand recurrence rules according to standard RFC 5545 RRule strings supporting:
1. Weekly frequency with 1 to 6 selected weekdays (`FREQ=WEEKLY;BYDAY=MO,TH`).
2. Biweekly frequency (`FREQ=WEEKLY;INTERVAL=2;BYDAY=...`).
3. Monthly frequency (`FREQ=MONTHLY;INTERVAL=1;BYDAY=...`).

#### Scenario: Patient scheduled for 2 days per week
- GIVEN a patient `p-1` with recurrence rule `FREQ=WEEKLY;BYDAY=MO,TH` at `16:00`
- WHEN `computeAgendaSlots` expands appointments for a 2-week interval
- THEN appointments are generated for every Monday and Thursday at 16:00 in that interval

#### Scenario: Patient scheduled biweekly (every 14 days)
- GIVEN a patient `p-2` with recurrence rule `FREQ=WEEKLY;INTERVAL=2;BYDAY=TU` starting on Tuesday week 1
- WHEN `computeAgendaSlots` expands appointments for a 4-week interval
- THEN appointments are generated only on Tuesday week 1 and Tuesday week 3 (skipping week 2 and week 4)

---

### Requirement: Eventual vs Permanent Turn Rescheduling
The system SHALL support moving an appointment with explicit eventual or permanent scope.

#### Scenario: Eventual Reschedule to an open slot
- GIVEN a recurring appointment for Patient A on Tuesday `2026-10-20` at 16:00
- WHEN therapist moves this appointment to Wednesday `2026-10-21` at 18:00 with scope `eventual`
- THEN an override session is saved in DB for Tuesday with status `cancelled`
- AND a new session is saved in DB for Wednesday `2026-10-21` at 18:00 for Patient A
- AND the following week (Tuesday `2026-10-27`), Patient A appears at their regular 16:00 slot

#### Scenario: Permanent Reschedule to a new day/time
- GIVEN a recurring appointment for Patient A currently on Tuesday at 16:00
- WHEN therapist reschedules to Friday at 15:00 with scope `permanent`
- THEN Patient A's `RecurrenceRule` is updated to Friday at 15:00
- AND all future weeks project appointments on Friday at 15:00

---

### Requirement: Atomic Two-Patient Turn Swap ("Enroque")
The system SHALL support exchanging appointment slots between two patients.

#### Scenario: Eventual Swap for a specific week
- GIVEN Patient A scheduled for Tuesday `2026-10-20` at 16:00
- AND Patient B scheduled for Thursday `2026-10-22` at 17:00
- WHEN therapist executes an eventual swap between Patient A and Patient B
- THEN Patient A is scheduled for Thursday `2026-10-22` at 17:00
- AND Patient B is scheduled for Tuesday `2026-10-20` at 16:00
- AND during the following week, Patient A remains on Tuesday and Patient B remains on Thursday

#### Scenario: Permanent Swap
- GIVEN Patient A with rule `Tuesday 16:00` and Patient B with rule `Thursday 17:00`
- WHEN therapist executes a permanent swap
- THEN Patient A's `RecurrenceRule` becomes `Thursday 17:00`
- AND Patient B's `RecurrenceRule` becomes `Tuesday 16:00`

---

### Requirement: Visual Free Slot Discovery
The system SHALL compute and expose all available unbooked time slots within working hours (e.g. 08:00 to 20:00) during a given day to allow quick single-click selection when rescheduling.
