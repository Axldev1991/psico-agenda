# Design: UI Patients View & Manager Redesign (Fase 4)

## Architecture & Decomposition
Decompose monolithic `PatientManager.tsx` into modular components under `src/ui/components/patients/`:
1. `PatientStatusTabs.tsx`: Tabs for active, inactive, and all patients with count badges.
2. `PatientListHeader.tsx`: Title, subtitle with active tab count, search bar with `search` stroke icon, and primary "+ Nuevo paciente" button.
3. `PatientTable.tsx`: Full responsive table for desktop and clean stacked cards for mobile, complete with `data-sensitive` attributes.
4. `PatientEmptyState.tsx`: Meaningful empty state differentiating between empty search query and empty database.
5. `PatientManager.tsx`: Coordinator composing the subcomponents.
6. `PatientModal.tsx`: Modernized creation/editing dialog styled with design tokens.
