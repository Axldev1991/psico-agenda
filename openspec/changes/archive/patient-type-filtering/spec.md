# Specification: Patient Type Filtering & Clinical Directory Enhancements

## Requirements

### REQ-1: Domain Pure Filtering Function
- Define `PatientFilterParams`:
  - `status?: 'active' | 'inactive' | 'all'`
  - `type?: 'adult' | 'underage' | 'all'`
  - `searchTerm?: string`
- Function `filterPatients(patients: Patient[], params: PatientFilterParams): Patient[]`
  - Must filter by status (defaulting missing status to 'active').
  - Must filter by type when type is not 'all'. Missing type defaults to 'adult'.
  - Must perform case-insensitive and diacritic-insensitive search against `fullName`.
  - Must return results sorted alphabetically by `fullName`.
  - Must remain a pure domain function with 100% unit test coverage.

### REQ-2: UI Segmented / Filter Control
- In `PatientListHeader` (or directory toolbar), present a type filter control with options:
  - "Todos" (all)
  - "Adultos" (adult)
  - "Infanto-juveniles" (underage)
- The subtitle count must dynamically reflect the filtered count and label accurately.
- Accessible font size (minimum 14px for compact badge/pills, 16px baseline for interactive text).
