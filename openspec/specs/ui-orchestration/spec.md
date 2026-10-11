# UI Orchestration Specification

## Purpose

Defines requirements and behaviors for top-level UI navigation, view state encapsulation, modal coordination, and recent patient persistence.

## Requirements

### Requirement: Global Navigation and View Tab State

The application SHALL isolate active view selection (`calendar`, `patients`, `settings`) within a dedicated `UIContext` provider, accessible to any child component without prop drilling.

#### Scenario: Switching active view tab
- GIVEN the application is rendering the `calendar` view
- WHEN the user selects the `patients` tab in the sidebar
- THEN `activeTab` transitions to `"patients"`
- AND the view container updates to display `PatientsView` without re-mounting unrelated global providers

---

### Requirement: Modal Lifecycle Management

The UI state manager SHALL maintain independent visibility and target context for application modals (`PatientModal` and `SessionModal`).

#### Scenario: Opening patient creation modal
- GIVEN the user is on any view tab
- WHEN `openNewPatientModal()` is invoked
- THEN `patientModalOpen` becomes `true`
- AND `patientToEdit` is set to `null`

#### Scenario: Opening patient edit modal
- GIVEN a valid patient entity
- WHEN `openEditPatientModal(patient)` is invoked
- THEN `patientModalOpen` becomes `true`
- AND `patientToEdit` is populated with that patient entity

#### Scenario: Closing modals cleanly
- GIVEN any active modal is open
- WHEN the user triggers dismiss/close
- THEN modal visibility is set to `false` and editing state is cleared

---

### Requirement: Recent Patients Persistence

The system SHALL encapsulate `localStorage` tracking for recently accessed patients into a reusable `useRecentPatients` hook.

#### Scenario: Adding a patient to recent history
- GIVEN a patient with UUID `p-123`
- WHEN the user views this patient's clinical history
- THEN `p-123` is placed at the front of the recent patients list
- AND the list is persisted to `localStorage` under `psico_agenda_recent_patients`
- AND duplicate entries are deduplicated keeping only the latest access

#### Scenario: Resilient storage handling
- GIVEN `localStorage` contains corrupted JSON or is unavailable
- WHEN `useRecentPatients` initializes
- THEN it falls back to an empty array without crashing the application

---

### Requirement: Modular View Containers

The top-level `src/app/page.tsx` SHALL delegate view rendering to self-contained view components (`CalendarView`, `PatientsView`, `SettingsView`), keeping `page.tsx` under 150 lines.

#### Scenario: Rendering top-level layout
- GIVEN the application loads
- WHEN `page.tsx` renders
- THEN it provides `UIProvider` and renders a shell with `SessionSidebar`, the active view container, and global modals.
