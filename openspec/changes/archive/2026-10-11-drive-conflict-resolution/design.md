# Design: Drive Sync Conflict Resolution

## Technical Approach

Introduce a pure reconciliation module `src/infrastructure/drive/drive-sync-merger.ts` that implements per-session Last-Write-Wins (LWW) resolution based on ISO timestamps (`updatedAt`, falling back to `createdAt`).

Integrate this reconciliation into `DriveSyncService` across:
1. `performSync`: Reconciles local and remote sessions for each patient before saving and uploading.
2. `downloadPatientHistory`: Merges downloaded remote sessions with existing offline-created sessions rather than deleting them.
3. `preloadAllForOffline`: Applies the same non-destructive reconciliation across all preloaded dossiers.

## Architecture Decisions

### Decision: Per-Entity LWW on Sessions vs Coarse-Grained Patient Dossier LWW

**Choice**: Granular per-session reconciliation.
**Alternatives considered**: Overwriting the entire patient and session history whenever patient `updatedAt` is newer.
**Rationale**: In a psychology practice, session notes and appointments are frequently created or edited on mobile or offline laptops. If patient demographic details (such as phone number) are updated on one device while an offline session is recorded on another, coarse-grained syncing overwrites and destroys the session. Granular reconciliation by UUID guarantees that individual appointments are never clobbered by unrelated patient metadata changes.

### Decision: Pure Functional Merger

**Choice**: Pure helper function `mergeSessionsByLWW(local: Session[], remote: Session[]): Session[]`.
**Alternatives considered**: Inlining merge loops inside `DriveSyncService` methods.
**Rationale**: Isolating reconciliation logic in a pure function allows 100% test coverage for complex edge cases (disjoint sets, equal timestamps, malformed dates) without mocking Google Drive HTTP requests or Dexie transactions.

## Data Flow

```text
 ┌────────────────────────┐         ┌────────────────────────┐
 │ Local Sessions (Dexie) │         │ Remote Sessions (JSON) │
 └───────────┬────────────┘         └───────────┬────────────┘
             │                                  │
             └──────────────────┬───────────────┘
                                │
                                ▼
                 ┌─────────────────────────────┐
                 │    mergeSessionsByLWW(...)  │
                 │   - Map by session.uuid     │
                 │   - Compare updatedAt time  │
                 │   - Union disjoint entries  │
                 └──────────────┬──────────────┘
                                │
                 ┌──────────────┴──────────────┐
                 ▼                             ▼
        Saved to Local Dexie         Uploaded to Google Drive
     (No deleteByPatient wipe)         ({patient_uuid}.json)
```

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `src/infrastructure/drive/drive-sync-merger.ts` | Create | Pure session reconciliation functions |
| `src/infrastructure/drive/drive-sync-merger.test.ts` | Create | TDD unit test suite for LWW session merging |
| `src/infrastructure/drive/drive-sync.service.ts` | Modify | Replace destructive `deleteByPatient` wipes with `mergeSessionsByLWW` |
| `src/infrastructure/drive/drive-sync.service.test.ts` | Modify | Add test verifying preservation of offline-created sessions |

## Interfaces / Contracts

```typescript
export function mergeSessionsByLWW(
  localSessions: Session[],
  remoteSessions: Session[]
): Session[];
```

## Testing Strategy

| Layer | What to Test | Approach |
|-------|-------------|----------|
| Unit (TDD) | Newer local session preserved | Unit test with local `updatedAt > remote updatedAt` |
| Unit (TDD) | Newer remote session applied | Unit test with remote `updatedAt > local updatedAt` |
| Unit (TDD) | Disjoint sessions merged into union | Unit test with unique sessions on both sides |
| Unit (TDD) | Missing `updatedAt` resilience | Unit test verifying fallback to `createdAt` or epoch |
| Integration | `DriveSyncService.performSync` | Integration test verifying local offline sessions survive remote sync |

## Threat Matrix

N/A — no routing, shell, subprocess, VCS/PR automation, executable-file classification, or process-integration boundary.

## Migration / Rollout

No migration required. Schema remains fully compatible with existing Dexie and Google Drive files.

## Open Questions

- None.
