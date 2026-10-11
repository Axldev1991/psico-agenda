# Specification: Drive Sync Conflict Resolution

## Purpose

Specifies non-destructive Last-Write-Wins (LWW) reconciliation for patient sessions during Google Drive synchronization cycles.

## Requirements

### Requirement: Granular Session Last-Write-Wins Reconciliation

The system SHALL reconcile local and remote session lists on a per-session UUID basis using the `updatedAt` timestamp, without deleting unconflicted records.

#### Scenario: Local session is newer than remote session
- GIVEN a local session with UUID `s-1` and `updatedAt: "2026-10-11T12:00:00Z"`
- AND a remote session with UUID `s-1` and `updatedAt: "2026-10-10T12:00:00Z"`
- WHEN `mergeSessionsByLWW` reconciles the lists
- THEN the resulting list contains the local version of `s-1`

#### Scenario: Remote session is newer than local session
- GIVEN a local session with UUID `s-2` and `updatedAt: "2026-10-09T10:00:00Z"`
- AND a remote session with UUID `s-2` and `updatedAt: "2026-10-11T10:00:00Z"`
- WHEN `mergeSessionsByLWW` reconciles the lists
- THEN the resulting list contains the remote version of `s-2`

#### Scenario: Session exists only on one side (disjoint sets)
- GIVEN a local session `s-local` created offline
- AND a remote session `s-remote` created on another device
- WHEN `mergeSessionsByLWW` reconciles the lists
- THEN the resulting list contains BOTH `s-local` and `s-remote` without data loss

---

### Requirement: REQ-11: Non-destructive Session Merging During Cloud Synchronization

During synchronization cycles (`performSync`, `downloadPatientHistory`, and `preloadAllForOffline`), the synchronization service SHALL NEVER execute bulk deletion of a patient's local sessions (`deleteByPatient`). It MUST reconcile local sessions with downloaded remote sessions using `mergeSessionsByLWW` before persisting, and it MUST upload the reconciled union to Google Drive.

#### Scenario: Sync preserves offline-created sessions when downloading updated patient
- GIVEN a patient `p-1` with an offline-created local session `s-offline`
- AND remote cloud storage has an updated patient file containing session `s-remote`
- WHEN `performSync` or `downloadPatientHistory` executes
- THEN `s-offline` is NOT deleted
- AND local storage contains both `s-offline` and `s-remote`
- AND the uploaded remote file in Drive is updated to contain both sessions
