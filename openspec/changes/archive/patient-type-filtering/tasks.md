# Implementation Tasks: Patient Type Filtering & Clinical Directory Enhancements

- [x] **Phase 1: SDD Artifacts & Memory Initialization**
  - [x] Create Proposal, Spec, Design, and Tasks.
- [x] **Phase 2: Domain Logic & TDD**
  - [x] Add `filterPatients` and types in `src/domain/patient.utils.ts`.
  - [x] Add unit tests in `src/domain/patient.utils.test.ts` covering status, type, search, and sorting combinations.
- [x] **Phase 3: UI Integration**
  - [x] Update `src/ui/components/patients/PatientListHeader.tsx` to include the patient type filter.
  - [x] Update `src/ui/components/PatientManager.tsx` to connect `typeFilter` and use `filterPatients`.
- [x] **Phase 4: Verification & Memory Persistence**
  - [x] Run `npx vitest run` (73/73 tests passing) and `npx tsc --noEmit` (0 errors).
  - [x] Run `npm run test:e2e` (14/14 Playwright specs passing).
  - [x] Save SDD cycle to Engram via `mem_save`.
  - [x] Archive SDD change.
