# Session Conflict Resolution Specification

## Purpose

Defines requirements and behaviors for deterministic, non-destructive merging of patient session records across offline clients and remote cloud storage using Last-Write-Wins (LWW) based on timestamps.

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

#### Scenario: Timestamp tie-break
- GIVEN a local session and a remote session with identical UUID and identical `updatedAt` timestamps
- WHEN `mergeSessionsByLWW` reconciles the lists
- THEN the local session is retained deterministically
