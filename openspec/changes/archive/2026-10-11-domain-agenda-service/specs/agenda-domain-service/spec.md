# Agenda Domain Service Specification

## Purpose

Specifies the pure business rules for expanding recurring sessions, resolving database exception overrides, including manual sessions, tagging holidays, and sorting weekly agenda slots.

## Requirements

### Requirement: Pure Recurring Series Expansion

The domain service SHALL expand active `RecurrenceRule` instances into concrete `CalendarSlot` occurrences within a specified date interval.

#### Scenario: Expanding a weekly recurrence rule
- GIVEN a patient with UUID `p-1` and price `$25000`
- AND an active recurrence rule for Tuesdays at `"16:00"` with duration `50` minutes
- WHEN `computeAgendaSlots` is executed for a week containing that Tuesday
- THEN an agenda slot is produced for that Tuesday at 16:00
- AND `slot.isRecurrent` is `true`, `slot.status` is `"scheduled"`, and `slot.price` is `$25000`

---

### Requirement: Database Exception and Override Resolution

When a database session exists for the same patient and day as an expanded recurring slot, the domain service SHALL prioritize the database session values over the default recurrence template.

#### Scenario: Applying a cancelled session override
- GIVEN a recurring slot generated for Wednesday at `"10:00"`
- AND a persisted `Session` in the database for the same patient on that Wednesday with `status: "cancelled"`
- WHEN `computeAgendaSlots` resolves slots
- THEN the resulting slot has `status: "cancelled"`
- AND `slot.uuid` contains the database session UUID

#### Scenario: Preserving custom session price and notes
- GIVEN a recurring slot with default price `$20000`
- AND a persisted `Session` override with `priceAtSession: 30000` and `notes: "Sesión extendida"`
- WHEN `computeAgendaSlots` resolves slots
- THEN the resulting slot has `price: 30000` and `notes: "Sesión extendida"`

---

### Requirement: Isolated Manual Sessions Inclusion

The domain service SHALL include persisted manual (non-recurrent) sessions that fall within the requested date interval without duplicate entries.

#### Scenario: Including a standalone appointment
- GIVEN a persisted session for patient `p-2` on Thursday at `"18:00"` with no matching recurrence rule
- WHEN `computeAgendaSlots` evaluates the week
- THEN a slot is generated with `isRecurrent: false` and the persisted session data

---

### Requirement: Holiday Tagging

The domain service SHALL inspect provided holidays and tag any slot coinciding with a holiday.

#### Scenario: Slot falls on an official holiday
- GIVEN a holiday on `2026-10-12` (Día del Respeto a la Diversidad Cultural)
- AND a slot scheduled for `2026-10-12T15:00:00`
- WHEN `computeAgendaSlots` runs
- THEN `slot.holiday` contains the matching holiday object

---

### Requirement: Chronological Sorting

The domain service SHALL return all calculated slots in strictly ascending chronological order based on `dateTime`.

#### Scenario: Slots are ordered by time
- GIVEN multiple slots generated on Monday at 18:00, Monday at 09:00, and Tuesday at 11:00
- WHEN `computeAgendaSlots` completes
- THEN Monday 09:00 precedes Monday 18:00, which precedes Tuesday 11:00
