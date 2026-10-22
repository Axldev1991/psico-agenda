# Technical Design: Patient Type Filtering & Clinical Directory Enhancements

## Architecture & Layering

### 1. Domain Layer (`src/domain/patient.utils.ts`)
- Export `PatientTypeFilter = 'all' | 'adult' | 'underage'`
- Export interface `PatientFilterParams`:
  ```ts
  export interface PatientFilterParams {
    status?: 'active' | 'inactive' | 'all';
    type?: PatientTypeFilter;
    searchTerm?: string;
  }
  ```
- Implement `filterPatients(patients: Patient[], params: PatientFilterParams): Patient[]` leveraging `sortPatientsAlphabetically` and normalized string matching.

### 2. UI Components
- **`src/ui/components/patients/PatientListHeader.tsx`**:
  - Add props `typeFilter: PatientTypeFilter` and `onTypeFilterChange: (type: PatientTypeFilter) => void`.
  - Render an accessible selector/pill group next to the search input.
- **`src/ui/components/PatientManager.tsx`**:
  - Manage state `const [typeFilter, setTypeFilter] = useState<PatientTypeFilter>('all')`.
  - Delegate filtering to pure domain `filterPatients(patients, { statusFilter, typeFilter, searchTerm })`.
