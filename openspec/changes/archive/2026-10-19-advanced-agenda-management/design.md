# Design: Advanced Agenda Management

## Technical Approach

Extend Clean Architecture domain services and UI components:
1. **Domain (`src/domain/agenda.service.ts`)**:
   - `buildRRuleString`: Pure builder turning UI user preferences (cadence, multiple days of week) into compliant RFC 5545 strings.
   - `findAvailableSlots`: Pure function computing unbooked 50-minute consultation slots within standard clinical hours (e.g., 08:00 to 20:00).
   - `computeAgendaSlots`: Enhanced to handle multi-day RRules seamlessly.
2. **UI & State (`src/ui/hooks/useCalendar.ts`)**:
   - `rescheduleSlot(params)`:
     - If `scope === 'eventual'`: creates an override session with `status: 'cancelled'` at original date/time, and creates a standalone session at the new date/time.
     - If `scope === 'permanent'`: updates the patient's `RecurrenceRule` in Dexie.
   - `swapSlots(params)`:
     - If `scope === 'eventual'`: creates two cross-over sessions in Dexie for that week.
     - If `scope === 'permanent'`: swaps the `rruleString`, `startTime`, and `startDate` between the two patients' `RecurrenceRule` records.
3. **UI Components**:
   - `SessionModal.tsx`: Replace single-day dropdown with weekday pill selectors (L, M, M, J, V, S) allowing multi-day selection, plus frequency selector (Semanal, Quincenal, Mensual).
   - `RescheduleModal.tsx`: Dedicated modal for moving or swapping appointments with real-time available slot suggestions.
   - `AppointmentCard.tsx`: Add "Reagendar" button with calendar/clock icon.

## Data Flow Diagram

```text
┌──────────────────────────────────────────────────────────┐
│                   AppointmentCard                        │
│             [ Reagendar / Mover Turno ]                  │
└────────────────────────────┬─────────────────────────────┘
                             │
                             ▼
┌──────────────────────────────────────────────────────────┐
│                   RescheduleModal                        │
│                                                          │
│  Mode: [ Mover a hueco libre ]  |  [ Intercambiar (Swap)]│
│  Scope: (•) Solo este turno     |  ( ) Permanente        │
└────────────────────────────┬─────────────────────────────┘
                             │
                             ▼
┌──────────────────────────────────────────────────────────┐
│                     useCalendar                          │
│          ┌─────────────────┴─────────────────┐           │
│          ▼                                   ▼           │
│  rescheduleSlot()                         swapSlots()    │
│  - Eventual: create Dexie override       - Eventual:     │
│  - Permanent: update RecurrenceRule        2 DB sessions │
│                                          - Permanent:    │
│                                            2 Rules swap  │
└──────────────────────────────────────────────────────────┘
```

## File Changes

| File | Action | Description |
|---|---|---|
| `src/domain/agenda.service.ts` | Modify | Add `buildRRuleString` and `findAvailableSlots` pure domain functions |
| `src/domain/agenda.service.test.ts` | Modify | Add comprehensive unit tests for multi-day, biweekly, and slot discovery |
| `src/ui/components/calendar/RescheduleModal.tsx` | Create | Modal for moving slots and swapping patients |
| `src/ui/components/SessionModal.tsx` | Modify | Multi-day weekday picker and cadence selection |
| `src/ui/components/calendar/AppointmentCard.tsx` | Modify | Add Reagendar action button |
| `src/ui/hooks/useCalendar.ts` | Modify | Add `rescheduleSlot` and `swapSlots` methods |
