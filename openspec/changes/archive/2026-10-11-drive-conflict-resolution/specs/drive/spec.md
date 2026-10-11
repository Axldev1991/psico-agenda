# Drive Delta Specification

## ADDED Requirements

### Requirement: REQ-11: Non-destructive Session Merging During Cloud Synchronization

During synchronization cycles (`performSync`, `downloadPatientHistory`, and `preloadAllForOffline`), the synchronization service SHALL NEVER execute bulk deletion of a patient's local sessions (`deleteByPatient`). It MUST reconcile local sessions with downloaded remote sessions using `mergeSessionsByLWW` before persisting, and it MUST upload the reconciled union to Google Drive.

#### Scenario: Sync preserves offline-created sessions when downloading updated patient
- GIVEN a patient `p-1` with an offline-created local session `s-offline`
- AND remote cloud storage has an updated patient file containing session `s-remote`
- WHEN `performSync` or `downloadPatientHistory` executes
- THEN `s-offline` is NOT deleted
- AND local storage contains both `s-offline` and `s-remote`
- AND the uploaded remote file in Drive is updated to contain both sessions
