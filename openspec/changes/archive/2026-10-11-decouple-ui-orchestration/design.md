# Design: Decouple UI Orchestration

## Technical Approach

Decompose `src/app/page.tsx` from a 583-line God component into a modular Container-Presentational hierarchy backed by a focused React Context (`UIContext`) and a dedicated persistence hook (`useRecentPatients`).

The top-level shell delegates rendering to three view containers:
1. `CalendarView`: handles calendar grid, date navigation, and session modal triggers.
2. `PatientsView`: manages patient directory, dossier details, and patient modal triggers.
3. `SettingsView`: displays application settings, Google Drive sync status, and diagnostics.

## Architecture Decisions

### Decision: React Context for Ephemeral UI State vs Global State Store (Redux/Zustand)

**Choice**: Lightweight React Context (`UIContext` + `useUIState`).
**Alternatives considered**: Zustand, Redux Toolkit, or Jotai.
**Rationale**: The application is an offline-first client application where persistent data belongs strictly to Dexie (IndexedDB via Repositories). The UI state being managed (active tab, modal open flags, selected session/patient in current viewport) is purely ephemeral UI navigation state. Introducing an external state library is unnecessary overhead.

### Decision: View Containers in `src/ui/views/`

**Choice**: Dedicated view components (`CalendarView`, `PatientsView`, `SettingsView`).
**Alternatives considered**: Next.js App Router sub-routes (`/calendar`, `/patients`, `/settings`).
**Rationale**: The app operates as an offline PWA single-page application with immediate tab transitions and offline service worker caching. View containers provide strict modularity and separation of concerns without introducing multi-route client reloads or service-worker routing complexities.

### Decision: Isolation of Recent Patients Local Storage

**Choice**: Dedicated custom hook `useRecentPatients` with pure helper/unit tests.
**Alternatives considered**: Keeping `localStorage` calls inside `page.tsx` or `SessionSidebar.tsx`.
**Rationale**: Isolating storage access in a hook enables unit testing in Vitest, guards against corrupted JSON or private browsing exceptions, and decouples the sidebar component from persistence concerns.

## Data Flow

```text
               ┌───────────────────────┐
               │    src/app/page.tsx   │
               └───────────┬───────────┘
                           │ (Wraps with UIProvider)
               ┌───────────▼───────────┐
               │       UIContext       │
               │ (activeTab, modals,   │
               │  selectedPatient)     │
               └─────┬───────────┬─────┘
                     │           │
       ┌─────────────▼──┐     ┌──▼─────────────────────────────┐
       │ SessionSidebar │     │ View Container Router          │
       │ (reads tab,    │     │  - CalendarView (useCalendar)  │
       │  recent list)  │     │  - PatientsView (usePatients)  │
       └────────────────┘     │  - SettingsView (useDrive/Set) │
                              └────────────────────────────────┘
```

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `src/ui/hooks/useRecentPatients.ts` | Create | Hook for managing recent patients with safe `localStorage` sync |
| `src/ui/hooks/useRecentPatients.test.ts` | Create | Unit test for recent patients persistence and edge cases |
| `src/ui/context/UIContext.tsx` | Create | React Context providing navigation, modals, and selection states |
| `src/ui/views/CalendarView.tsx` | Create | View container for agenda calendar and session triggers |
| `src/ui/views/PatientsView.tsx` | Create | View container for patient list and clinical history dossiers |
| `src/ui/views/SettingsView.tsx` | Create | View container for Google Drive sync and application settings |
| `src/app/page.tsx` | Modify | Strip monolith logic; render UIProvider, sidebar, active view, and modals |

## Interfaces / Contracts

### `UIState` and `UIActions`

```typescript
export interface UIContextType {
  activeTab: "calendar" | "patients" | "settings";
  setActiveTab: (tab: "calendar" | "patients" | "settings") => void;
  selectedPatientForDetail: Patient | null;
  setSelectedPatientForDetail: (patient: Patient | null) => void;
  patientToEdit: Patient | null;
  isPatientModalOpen: boolean;
  openNewPatientModal: () => void;
  openEditPatientModal: (patient: Patient) => void;
  closePatientModal: () => void;
  isSessionModalOpen: boolean;
  selectedSlot: { date: Date; time?: string } | null;
  selectedSession: Session | null;
  openNewSessionModal: (date?: Date, time?: string) => void;
  openEditSessionModal: (session: Session) => void;
  closeSessionModal: () => void;
}
```

### `useRecentPatients` Contract

```typescript
export interface UseRecentPatientsReturn {
  recentPatientUuids: string[];
  addRecentPatient: (uuid: string) => void;
  clearRecentPatients: () => void;
}
```

## Testing Strategy

| Layer | What to Test | Approach |
|-------|-------------|----------|
| Unit | `useRecentPatients` hook and storage logic | Vitest unit test with simulated `localStorage` and corrupted data edge cases |
| Integration | Regression test for existing domain & services | Run `npx vitest run` across all test suites |
| Build | Type checking and bundle validation | Run `npx next build` or TypeScript compile verification |

## Threat Matrix

N/A — no routing, shell, subprocess, VCS/PR automation, executable-file classification, or process-integration boundary.

## Migration / Rollout

No data migration required. Refactor is backward-compatible with existing Dexie schemas and IndexedDB state.

## Open Questions

- None.
