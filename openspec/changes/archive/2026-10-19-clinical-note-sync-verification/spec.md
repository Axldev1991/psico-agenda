# Specification: Clinical Notes Persistence & Drive Sync Verification

## Purpose

Specifies end-to-end integration and verification requirements ensuring clinical session notes created or updated by therapists remain durable locally and synchronize faithfully to Google Drive without data loss.

## Requirements

### Requirement: E2E Note Persistence Pipeline
The system SHALL persist session notes locally in Dexie immediately, and upon synchronization, upload both `{patientUuid}.json` and `Historial_Clinico.doc` to Google Drive with identical notes content and appropriate timestamps.

#### Scenario: Therapist writes a session note and synchronizes
- GIVEN a patient `p-1` and an active session `s-1`
- WHEN therapist saves HTML notes `<p>Paciente relata mejoría en sintomatología ansiosa.</p>`
- AND `performSync()` executes with a valid Google token
- THEN the local Dexie session has the updated notes and `updatedAt` timestamp
- AND `uploadFileToFolder` is called for `{patientUuid}.json` containing the session note
- AND `uploadFileToFolder` is called for `Historial_Clinico.doc` containing the formatted session date and HTML body

### Requirement: DLP Guard Strict Upload Blockade
The system SHALL NOT upload any patient records to Google Drive if `isHistoryLoaded === false`, preventing accidental overwriting of remote histories with blank or partial data.

#### Scenario: Patient with un-downloaded history attempts sync
- GIVEN a patient `p-2` with `isHistoryLoaded: false`
- WHEN `performSync()` executes
- THEN the system SKIPS uploading `p-2` to Google Drive
- AND no remote files for `p-2` are touched or modified

### Requirement: Offline & Network Resilience
The system SHALL NOT corrupt or lose local session notes if Google Drive synchronization fails due to network outage or API errors.

#### Scenario: Google Drive API fails during upload
- GIVEN a session `s-3` with clinical notes saved in Dexie
- WHEN `performSync()` fails due to network timeout or HTTP 500 error from Google Drive
- THEN the local Dexie database retains `s-3` with all its notes unmodified
- AND the application logs the error without dropping un-synchronized local changes
