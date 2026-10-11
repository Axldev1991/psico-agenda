# Proposal: Pure Domain Agenda Service

## Intent

Currently, agenda slot calculation, recurrence rule expansion (`rrule.js`), exception matching against database records, and holiday tagging are executed directly inside the React hook `useCalendar.ts` (`getWeeklyAgenda`).

This couples core business logic to the React component lifecycle and state hooks, preventing unit testing without mocking React and making it difficult to introduce future agenda features (such as eventual vs. permanent slots, conflict detection, and availability filters).

The goal is to extract all agenda calculation rules into a pure, framework-agnostic Domain Service (`src/domain/agenda.service.ts`), covered by 100% unit tests in Vitest.

## Scope

### In Scope
- Create `src/domain/agenda.types.ts` defining pure types for `CalendarSlot`, slot calculation inputs, and filter options.
- Create `src/domain/agenda.service.ts` with pure calculation functions:
  - `computeAgendaSlots(...)`: Combines recurrence rules, DB session overrides, manual sessions, and holidays for any given date interval.
  - Conflict/collision detection helper.
- Comprehensive Vitest unit tests in `src/domain/agenda.service.test.ts` testing recurring expansion, exception overrides, holiday identification, and sorting.
- Refactor `src/ui/hooks/useCalendar.ts` to delegate slot computation to the new domain service.

### Out of Scope
- Database schema changes in Dexie or repositories.
- UI visual redesign of `CalendarGrid`.
- Drive sync conflict resolution (reserved for a dedicated change).

## Capabilities

### New Capabilities
- `agenda-domain-service`: Pure domain calculation of agenda slots, recurring series expansion, exception resolution, and collision detection.

### Modified Capabilities
<!-- None -->

## Approach

1. **Pure Types**: Define `AgendaSlot` and computation parameter interfaces in `src/domain/agenda.types.ts`.
2. **Pure Service**: Implement `computeAgendaSlots` in `src/domain/agenda.service.ts` taking raw entities (`RecurrenceRule[]`, `Session[]`, `Patient[]`, `Holiday[]`) and an interval (`start`, `end`), returning sorted slots.
3. **Unit Tests (TDD)**: Cover all scenarios (regular recurrence, cancelled session override, manual one-off session, holiday matching, overlapping slots) in `agenda.service.test.ts`.
4. **Hook Delegation**: Refactor `useCalendar.ts` to simply call `computeAgendaSlots` inside a `useMemo`.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `src/domain/agenda.types.ts` | New | Pure domain types for calendar slots and calculation inputs |
| `src/domain/agenda.service.ts` | New | Framework-agnostic agenda slot calculation functions |
| `src/domain/agenda.service.test.ts` | New | Unit tests for recurring rules, exceptions, and sorting |
| `src/ui/hooks/useCalendar.ts` | Modified | Delegate calculation to domain service; simplify hook responsibility |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Divergence in slot date/time calculations | Low | Replicate exact RRule and date-fns logic into pure functions with comprehensive tests |

## Rollback Plan

Revert changes in `src/ui/hooks/useCalendar.ts` and delete new files in `src/domain/`.

## Dependencies

- Existing `date-fns` and `rrule` packages.

## Success Criteria

- [ ] Pure `computeAgendaSlots` function works without any React dependency.
- [ ] 100% test coverage for recurring rules, exception overrides, and holidays in `agenda.service.test.ts`.
- [ ] `useCalendar.ts` reduced in complexity and purely orchestrates state and repository calls.
- [ ] Existing `npx vitest run` suite passes with zero regressions.
