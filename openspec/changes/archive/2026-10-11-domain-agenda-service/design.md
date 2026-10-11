# Design: Pure Domain Agenda Service

## Technical Approach

Extract all agenda computation rules from `src/ui/hooks/useCalendar.ts` into a pure, deterministic domain module:
- `src/domain/agenda.types.ts`: Domain models for slots and computation inputs.
- `src/domain/agenda.service.ts`: Functional domain service exposing `computeAgendaSlots(...)`.
- `src/domain/agenda.service.test.ts`: Comprehensive Vitest unit tests.

The React hook `useCalendar.ts` becomes a thin reactive consumer that collects live queries from repositories and passes them to `computeAgendaSlots` wrapped in `useMemo`.

## Architecture Decisions

### Decision: Pure Functional Module vs Stateful Domain Class

**Choice**: Pure export functions (`computeAgendaSlots`).
**Alternatives considered**: Class `AgendaService` or instance-based service locator.
**Rationale**: Computing calendar slots is a deterministic projection: given a set of recurring rules, persisted sessions, patient metadata, and an interval, it calculates an array of slots. Pure functions have no hidden state, zero initialization overhead, and are trivially testable with standard assertion libraries.

### Decision: Location in `src/domain/`

**Choice**: Place in `src/domain/agenda.service.ts` alongside domain entities.
**Alternatives considered**: Putting it in `src/ui/utils/` or `src/infrastructure/`.
**Rationale**: Business rules regarding what constitutes an appointment, how recurring series interact with individual session exceptions, and how holidays flag clinical sessions are core domain rules, not UI helpers or infrastructure adapters.

## Data Flow

```text
 ┌──────────────────────┐   ┌──────────────────────┐   ┌──────────────────────┐
 │   recurrenceRules    │   │      dbSessions      │   │       patients       │
 │      (IndexedDB)     │   │      (IndexedDB)     │   │      (IndexedDB)     │
 └──────────┬───────────┘   └──────────┬───────────┘   └──────────┬───────────┘
            │                          │                          │
            └──────────────────────────┼──────────────────────────┘
                                       │
                                       ▼
                       ┌──────────────────────────────┐
                       │  computeAgendaSlots(params)  │ (Pure Domain Service)
                       │   - RRule date expansion     │
                       │   - DB exception overrides   │
                       │   - Manual session merge     │
                       │   - Holiday lookup           │
                       │   - Chronological sort       │
                       └──────────────┬───────────────┘
                                       │
                                       ▼
                                CalendarSlot[]
                                       │
                        ┌──────────────┴──────────────┐
                        ▼                             ▼
                 CalendarGrid.tsx            useCalendar.ts
```

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `src/domain/agenda.types.ts` | Create | Pure types for `CalendarSlot` and `ComputeAgendaSlotsParams` |
| `src/domain/agenda.service.ts` | Create | Pure computation functions for agenda slots |
| `src/domain/agenda.service.test.ts` | Create | 100% TDD unit test suite |
| `src/ui/hooks/useCalendar.ts` | Modify | Replaces manual `getWeeklyAgenda` with `useMemo` call to domain service |

## Interfaces / Contracts

```typescript
export interface CalendarSlot {
  uuid?: string;
  patientUuid: string;
  patientName: string;
  dateTime: Date;
  durationMinutes: number;
  status: 'scheduled' | 'completed' | 'cancelled' | 'missed';
  price: number;
  notes?: string;
  isRecurrent: boolean;
  holiday?: Holiday;
}

export interface ComputeAgendaSlotsParams {
  intervalStart: Date;
  intervalEnd: Date;
  recurrenceRules: RecurrenceRule[];
  dbSessions: Session[];
  patients: Patient[];
  holidays?: Holiday[];
}

export function computeAgendaSlots(params: ComputeAgendaSlotsParams): CalendarSlot[];
```

## Testing Strategy

| Layer | What to Test | Approach |
|-------|-------------|----------|
| Unit (TDD) | Weekly recurring rule expansion | Vitest with mock recurrence rules and patient data |
| Unit (TDD) | Cancelled session override | Verify DB session overrides recurrence template |
| Unit (TDD) | Custom price & notes preservation | Verify override values take priority |
| Unit (TDD) | Standalone manual sessions | Verify non-recurrent sessions appear correctly |
| Unit (TDD) | Holiday matching | Verify holiday property is attached when dates match |
| Unit (TDD) | Chronological sorting | Verify slots are returned in ascending timestamp order |
| Integration | Hook & CalendarGrid rendering | Full `npx vitest run` & `tsc --noEmit` validation |

## Threat Matrix

N/A — no routing, shell, subprocess, VCS/PR automation, executable-file classification, or process-integration boundary.

## Migration / Rollout

No migration required. Contract is backward-compatible with existing Dexie schemas.

## Open Questions

- None.
