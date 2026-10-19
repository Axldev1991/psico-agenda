# Design: Clinical Notes Persistence & Drive Sync Verification

## Technical Approach

Implement an end-to-end integration test suite `src/infrastructure/drive/clinical-notes-persistence.integration.test.ts` that simulates the real runtime journey of a psychologist taking notes and syncing to Google Drive.

The test leverages:
1. `DexiePatientRepository` & `DexieSessionRepository` (or in-memory mock repository layer matching their contract).
2. `DriveSyncService` initialized with real repository instances.
3. Controlled spy/mock of `GoogleDriveRepository` capturing exact payloads sent to `uploadFileToFolder` (inspecting JSON contents, file names, folder names, and Word `.doc` generation).

## Architecture Decisions

### Decision: Direct Repository & Service Integration Test vs UI Component End-to-End (Playwright)
**Choice**: Integration test at the Infrastructure & Domain boundary using Vitest.
**Rationale**: In Clean Architecture, testing through domain repositories and the DriveSyncService provides deterministic, instantaneous validation of persistence contracts, bytes written, timestamps, and error handling without the flakiness and overhead of browser automation.

### Decision: Inspection of Real Generated Documents
**Choice**: Unpack and assert the actual string payloads sent to `uploadFileToFolder`.
**Rationale**: Simply asserting that `uploadFileToFolder` was called with some parameters is insufficient. We must inspect the actual payload to guarantee that:
- The JSON contains `sessions` with the exact HTML notes.
- The `Historial_Clinico.doc` file contains the session dates and note content wrapped in valid HTML table/document format.

## Test Matrix

| Scenario | Given | When | Then / Assertions |
|---|---|---|---|
| Happy Path Sync | Patient with notes in Session | `performSync()` | `uploadFileToFolder` receives valid JSON and `.doc` with full notes |
| DLP Guard | Patient with `isHistoryLoaded: false` | `performSync()` | Zero uploads for this patient; logs warning |
| Offline / Sync Error | Drive API throws HTTP 500 | `performSync()` fails | Dexie still holds note intact; no data lost |
| Multi-session Ordering | 2 sessions on different dates | `performSync()` | `.doc` has both sessions in chronological order |

## File Changes

| File | Action | Description |
|---|---|---|
| `src/infrastructure/drive/clinical-notes-persistence.integration.test.ts` | Create | E2E integration test suite for clinical note persistence |
| `openspec/changes/clinical-note-sync-verification/` | Create | Full SDD change specifications |
