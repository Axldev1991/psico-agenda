# Proposal: Patient Type Filtering & Clinical Directory Enhancements

## Problem
In clinical psychology practice, therapists treat distinct patient populations (e.g. adults and minors/underage). While the database entity already supports `type: 'adult' | 'underage'` and `birthDate`, the Patient Directory (`PatientManager`) currently only filters by clinical activity status (`active`, `inactive`, `all`). There is no mechanism to quickly filter or view only underage patients vs adult patients, hindering therapists when reviewing cases or planning age-specific sessions.

## Proposed Solution
1. **Domain Layer**:
   - Provide pure utility filtering helper `filterPatients(patients, { status, type, search })` in `src/domain/patient.utils.ts` and companion unit tests.
2. **UI Layer**:
   - Add segmented control / selector for `typeFilter: 'all' | 'adult' | 'underage'` in `PatientManager` and `PatientListHeader`.
   - Maintain full synchronization between search, status tabs, and patient type filter.
   - Respect 16px typography floor and accessible focus styles.
