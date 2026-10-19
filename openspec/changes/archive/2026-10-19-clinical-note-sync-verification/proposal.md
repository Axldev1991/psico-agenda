# Proposal: End-to-End Clinical Notes Persistence & Drive Sync Verification

## Intent

Therapists rely on Psico-Agenda for irreplaceable patient session evolutions and clinical history. Losing even a partial paragraph of therapy notes due to sync failures, offline race conditions, or unhandled exceptions is unacceptable in a clinical application.

While individual units (LWW merge, repository HTTP calls, and Dexie adapters) are tested in isolation, the project lacks an **End-to-End Persistence Integration Test Suite** verifying the complete pipeline from note authoring to local persistence, DLP Guard gating, and Google Drive upload payload generation (both structured JSON and formatted `Historial_Clinico.doc`).

The goal of this change is to implement a robust integration test suite validating that:
1. Notes saved to local repositories immediately persist with updated timestamps and are not dropped.
2. `performSync` correctly identifies pending patient changes and packages both `{patientUuid}.json` and `Historial_Clinico.doc` with exact formatted content.
3. The DLP Guard actively forbids uploading any patient records when `isHistoryLoaded === false`, preventing destructive cloud overwrites.
4. If Drive uploads fail (network failure, token expiration, HTTP 500), local notes in IndexedDB remain pristine and retriable.

## Scope

### In Scope
- Create integration test suite `src/infrastructure/drive/clinical-notes-persistence.integration.test.ts` testing:
  - Complete flow: session note authoring -> Dexie local save -> `performSync` -> Google Drive upload verification (JSON + Word document).
  - Multi-session compilation: verifying that sequential therapy sessions are compiled in chronological order into `Historial_Clinico.doc`.
  - DLP Guard enforcement: verifying that un-downloaded patients cannot overwrite cloud notes.
  - Offline / Network Failure Resilience: verifying that API rejection never corrupts or deletes local session notes in Dexie.
- Persist SDD artifacts in OpenSpec (`proposal.md`, `spec.md`, `design.md`, `tasks.md`) and Engram memory.
- Verify 100% Vitest pass rate and clean TypeScript build.

### Out of Scope
- Modifying UI editor styling or layout components.
- Changing Google OAuth scopes or API endpoints.

## Capabilities

### New Capabilities
- `clinical-notes-sync-verification`: Automated end-to-end verification suite guaranteeing clinical note persistence across local storage and Google Drive.

### Modified Capabilities
- `drive`: Clarify integration guarantees for clinical note payloads and DLP Guard.

## Approach

1. Implement `src/infrastructure/drive/clinical-notes-persistence.integration.test.ts` using Vitest, integrating real instances of `DexiePatientRepository`, `DexieSessionRepository`, and `DriveSyncService` with a controlled `GoogleDriveRepository` mock.
2. Test scenarios:
   - **Scenario 1: Happy Path E2E Sync**: Create patient, add session with rich-text HTML notes, trigger sync, verify `uploadFileToFolder` receives `{patientUuid}.json` with full notes and `Historial_Clinico.doc` containing formatted date, title, and HTML body.
   - **Scenario 2: DLP Guard Protection**: Patient with `isHistoryLoaded: false` attempting sync must not trigger uploads to Drive.
   - **Scenario 3: Offline Resilience on Sync Failure**: When Drive throws network error, local Dexie data remains completely untouched and retrievable.
   - **Scenario 4: Multi-session Chronological Assembly**: Multiple sessions created on different dates are assembled sequentially into `Historial_Clinico.doc`.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `src/infrastructure/drive/clinical-notes-persistence.integration.test.ts` | New | Comprehensive integration test suite for clinical notes and Drive sync |
| `openspec/changes/clinical-note-sync-verification/` | New | SDD lifecycle artifacts (proposal, spec, design, tasks) |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| In-memory Dexie mock incompatibility in Vitest | Low | Use fake-indexeddb or in-memory Dexie repository patterns already established in existing tests |

## Success Criteria

- [ ] Complete E2E integration test suite implemented and passing in Vitest.
- [ ] DLP Guard verified to block unsafe uploads.
- [ ] `Historial_Clinico.doc` generation verified with realistic clinical notes.
- [ ] All 38+ existing tests continue to pass without regression.
- [ ] TypeScript (`tsc --noEmit`) passes with 0 errors.
