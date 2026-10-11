# Proposal: Decouple UI Orchestration and Page Monolith

## Intent

The main application page (`src/app/page.tsx`) currently acts as a monolithic orchestrator (583+ lines) coordinating multiple heterogeneous concerns:
1. Navigation and active view tabs (`calendar`, `patients`, `settings`).
2. Global modal states (`PatientModal`, `SessionModal`).
3. Active patient selection and dossier detail inspection.
4. Recent patient history persistence via `localStorage`.
5. Direct wiring of Google Drive sync status and diagnostic actions.

This tight coupling makes UI components difficult to test in isolation, complicates the addition of new agenda capabilities (such as eventual vs. permanent sessions and availability settings), and violates the Single Responsibility Principle (SRP). The goal is to modularize UI orchestration, extract view-specific state management, and establish clear Container-Presentational boundaries.

## Scope

### In Scope
- Extract navigation, active view, and modal coordination into dedicated UI state abstractions or context providers (`NavigationContext` / `UIStateContext`).
- Decouple `src/app/page.tsx` into a lightweight, clean entry point that delegates to modular view containers.
- Encapsulate `localStorage` recent patients synchronization into a dedicated hook (`useRecentPatients`).
- Ensure all existing features and tests remain functional without UI regressions.

### Out of Scope
- Full migration of Next.js multi-page routing (`/agenda`, `/pacientes`), preserving single-page PWA offline-first architecture for now.
- Changes to underlying repositories (`src/repositories/`) or infrastructure (`src/infrastructure/`).
- Implementation of eventual vs. permanent agenda slots (reserved for subsequent agenda milestone).

## Capabilities

### New Capabilities
- `ui-orchestration`: Modular state management for global navigation, active modal lifecycle, and view switching.

### Modified Capabilities
<!-- None -->

## Approach

1. **State Isolation**: Create `useRecentPatients` to isolate recent patient ID persistence and retrieval.
2. **UI Navigation & Modals Context**: Create a lightweight `UIProvider` / `useUIState` hook handling active view tabs, modal visibility (`patientModalOpen`, `sessionModalOpen`), and selected patient tracking.
3. **View Container Decomposition**: Separate the page layout into distinct view containers (e.g., `CalendarView`, `PatientsView`, `SettingsView`) that consume granular hooks instead of drilling props through a single 580-line component.
4. **Thin Page Entrypoint**: Refactor `src/app/page.tsx` down to under 150 lines, serving purely as the top-level layout and provider wrapper.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `src/ui/hooks/useRecentPatients.ts` | New | Dedicated hook for recent patients local storage sync |
| `src/ui/context/UIContext.tsx` | New | Global UI state (active tab, modal states, selected patient) |
| `src/ui/views/` | New | View-specific container wrappers (Calendar, Patients, Settings) |
| `src/app/page.tsx` | Modified | Reduced from 583 lines to lightweight layout shell |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| State desynchronization between tabs and modals | Low | Centralize modal and selection state in typed context/hooks |
| Regression in existing tests | Low | Run `npx vitest run` before and after each refactoring step |

## Rollback Plan

Revert git changes to `src/app/page.tsx` and delete newly added UI context/view files.

## Dependencies

- None (pure frontend refactoring using existing React 19 / Next.js 16 stack).

## Success Criteria

- [ ] `src/app/page.tsx` reduced to < 150 lines with clear Separation of Concerns.
- [ ] Modals and view states managed through modular hooks/context without prop drilling.
- [ ] All Vitest tests pass cleanly.
- [ ] No regression in calendar navigation, patient dossiers, or Drive sync.
