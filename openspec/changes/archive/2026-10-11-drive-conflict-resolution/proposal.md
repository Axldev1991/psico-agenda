# Proposal: Granular Conflict Resolution for Drive Sync

## Intent

Currently, `DriveSyncService` executes destructive bulk overwrites for patient sessions during Google Drive synchronization:
1. `deleteByPatient(uuid)` followed by `saveAll(remoteData.sessions)` unconditionally deletes all local sessions for a patient whenever remote patient data is downloaded. Any session created or updated locally offline is erased.
2. Conversely, when local patient metadata is newer (`localTime > remoteTime`), the service uploads only `localSessions`, overwriting remote files and discarding any sessions created on other devices.
3. Patient clinical history can be overwritten if remote demographic attributes (such as email or phone) were edited on another device.

The goal is to implement **Granular Entity Merging with Timestamp-based Conflict Resolution (Last-Write-Wins)** for sessions, ensuring that offline changes and multi-device additions are never lost.

## Scope

### In Scope
- Create a pure domain/infrastructure session merger function `mergeSessionsByLWW(localSessions: Session[], remoteSessions: Session[]): Session[]`.
- Update `DriveSyncService.performSync`, `downloadPatientHistory`, and `preloadAllForOffline` to merge sessions using granular LWW rather than executing destructive `deleteByPatient`.
- Ensure bidirectional reconciliation: merged session sets are both persisted locally and uploaded to Google Drive.
- Unit tests covering:
  - Local session newer than remote: retains local version.
  - Remote session newer than local: applies remote version.
  - Non-overlapping sessions on both sides: unions both sets without loss.
  - Same timestamps: deterministic tie-breaking.

### Out of Scope
- CRDT (Conflict-free Replicated Data Types) or Operational Transformation for rich text clinical notes (YAGNI for single-practitioner setups).
- Changes to Google Drive OAuth authentication flow.

## Capabilities

### New Capabilities
- `session-conflict-resolution`: Deterministic Last-Write-Wins session merger preserving multi-device and offline modifications.

### Modified Capabilities
- `drive`: Update sync specification to mandate non-destructive session merging.

## Approach

1. **Pure Session Merge Utility**: Implement `mergeSessionsByLWW(local: Session[], remote: Session[]): Session[]` comparing `new Date(s.updatedAt).getTime()`.
2. **DriveSyncService Integration**:
   - In `performSync`, when processing a patient download, fetch existing local sessions, merge with `patientData.sessions`, and save the combined set.
   - When uploading a patient, ensure the uploaded payload includes merged sessions so neither side loses appointments.
3. **Unit Tests (TDD)**: Test merge cases exhaustively in `drive-sync.service.test.ts`.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `src/infrastructure/drive/drive-sync-merger.ts` | New | Pure helper for per-session LWW reconciliation |
| `src/infrastructure/drive/drive-sync-merger.test.ts` | New | Comprehensive unit tests for session merging |
| `src/infrastructure/drive/drive-sync.service.ts` | Modified | Replace `deleteByPatient` wipes with granular session merging |
| `src/infrastructure/drive/drive-sync.service.test.ts` | Modified | Add integration test for non-destructive session sync |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Missing `updatedAt` on legacy sessions | Low | Fallback to `createdAt` or ISO epoch (`1970-01-01`) if `updatedAt` is undefined |

## Rollback Plan

Revert changes to `src/infrastructure/drive/drive-sync.service.ts` and remove `drive-sync-merger.ts`.

## Dependencies

- None (uses existing TypeScript date utilities).

## Success Criteria

- [ ] Zero local sessions deleted when syncing with remote data.
- [ ] Offline-created local sessions merged safely with remote sessions.
- [ ] 100% unit and integration tests passing in Vitest.
