import { ExtraNote } from "../../domain/extra-note.types";
import { Session, RecurrenceRule, PunctuationConfig, MovementConfig } from "../../domain/session.types";

/**
 * Parses a timestamp string into milliseconds, falling back to 0 if invalid or absent.
 */
function parseTimestamp(dateStr?: string): number {
  if (!dateStr) return 0;
  const time = new Date(dateStr).getTime();
  return isNaN(time) ? 0 : time;
}

function getSessionKey(session: Session): string | null {
  if (session?.uuid) return session.uuid;
  if (session?.patientUuid && session?.dateTime) return `${session.patientUuid}_${session.dateTime}`;
  return null;
}

/**
 * Merges local and remote patient sessions using granular Last-Write-Wins (LWW) by UUID.
 * - If a session exists only locally: retained.
 * - If a session exists only remotely: added.
 * - If a session exists on both sides: compares updatedAt (falling back to createdAt),
 *   retaining the newer record. Ties deterministically keep the local version.
 */
export function mergeSessionsByLWW(
  localSessions: Session[] = [],
  remoteSessions: Session[] = []
): Session[] {
  const sessionMap = new Map<string, Session>();

  // 1. Initialize map with local sessions
  for (const local of localSessions) {
    const key = getSessionKey(local);
    if (key) {
      sessionMap.set(key, local);
    }
  }

  // 2. Reconcile with remote sessions
  for (const remote of remoteSessions) {
    const key = getSessionKey(remote);
    if (!key) continue;

    const local = sessionMap.get(key);
    if (!local) {
      // Remote-only session: add to merged set
      sessionMap.set(key, remote);
      continue;
    }

    const localTime = parseTimestamp(local.updatedAt || local.createdAt);
    const remoteTime = parseTimestamp(remote.updatedAt || remote.createdAt);

    if (remoteTime > localTime) {
      // Remote is strictly newer
      sessionMap.set(key, remote);
    }
    // Otherwise keep local
  }

  // 3. Return array sorted chronologically by dateTime
  return Array.from(sessionMap.values()).sort(
    (a, b) => new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime()
  );
}

/**
 * Merges local and remote extra clinical notes using granular Last-Write-Wins (LWW) by UUID.
 * Ties deterministically retain the local version.
 */
export function mergeExtraNotesByLWW(
  localNotes: ExtraNote[] = [],
  remoteNotes: ExtraNote[] = []
): ExtraNote[] {
  const noteMap = new Map<string, ExtraNote>();

  for (const local of localNotes) {
    if (local.uuid) {
      noteMap.set(local.uuid, local);
    }
  }

  for (const remote of remoteNotes) {
    if (!remote.uuid) continue;

    const local = noteMap.get(remote.uuid);
    if (!local) {
      noteMap.set(remote.uuid, remote);
      continue;
    }

    const localTime = parseTimestamp(local.updatedAt || local.createdAt);
    const remoteTime = parseTimestamp(remote.updatedAt || remote.createdAt);

    if (remoteTime > localTime) {
      noteMap.set(remote.uuid, remote);
    }
  }

  return Array.from(noteMap.values()).sort(
    (a, b) => parseTimestamp(b.createdAt) - parseTimestamp(a.createdAt)
  );
}

/**
 * Merges local and remote recurrence rules using Last-Write-Wins (LWW) keyed by patientUuid.
 * - If a rule exists only locally: retained.
 * - If a rule exists only remotely: added.
 * - If a rule exists on both sides: compares updatedAt timestamp.
 *   Remote wins only if remote.updatedAt is strictly newer than local.updatedAt.
 *   Ties or missing remote timestamps deterministically retain the local version.
 */
export function mergeRecurrenceRulesByLWW(
  localRules: RecurrenceRule[] = [],
  remoteRules: RecurrenceRule[] = []
): RecurrenceRule[] {
  const ruleMap = new Map<string, RecurrenceRule>();

  for (const local of localRules) {
    if (local.patientUuid) {
      ruleMap.set(local.patientUuid, local);
    }
  }

  for (const remote of remoteRules) {
    if (!remote.patientUuid) continue;

    const local = ruleMap.get(remote.patientUuid);
    if (!local) {
      ruleMap.set(remote.patientUuid, remote);
      continue;
    }

    const localTime = parseTimestamp(local.updatedAt);
    const remoteTime = parseTimestamp(remote.updatedAt);

    if (remoteTime > localTime) {
      ruleMap.set(remote.patientUuid, remote);
    }
  }

  return Array.from(ruleMap.values());
}

/**
 * Merges local and remote punctuation configurations using Last-Write-Wins (LWW) keyed by key.
 * - If a config exists only locally: retained.
 * - If a config exists only remotely: added.
 * - If a config exists on both sides: compares updatedAt timestamp.
 *   Remote wins only if remote.updatedAt is strictly newer than local.updatedAt.
 *   Ties or missing timestamps deterministically retain the local version (preventing remote wipe).
 */
export function mergePunctuationConfigsByLWW(
  localConfigs: PunctuationConfig[] = [],
  remoteConfigs: PunctuationConfig[] = []
): PunctuationConfig[] {
  const configMap = new Map<string, PunctuationConfig>();

  for (const local of localConfigs) {
    if (local.key) {
      configMap.set(local.key, local);
    }
  }

  for (const remote of remoteConfigs) {
    if (!remote.key) continue;

    const local = configMap.get(remote.key);
    if (!local) {
      configMap.set(remote.key, remote);
      continue;
    }

    const localTime = parseTimestamp(local.updatedAt);
    const remoteTime = parseTimestamp(remote.updatedAt);

    if (remoteTime > localTime) {
      configMap.set(remote.key, remote);
    }
  }

  return Array.from(configMap.values());
}

/**
 * Merges local and remote movement configurations using Last-Write-Wins (LWW) keyed by key.
 * Ties or missing timestamps deterministically retain the local version.
 */
export function mergeMovementConfigsByLWW(
  localConfigs: MovementConfig[] = [],
  remoteConfigs: MovementConfig[] = []
): MovementConfig[] {
  const configMap = new Map<string, MovementConfig>();

  for (const local of localConfigs) {
    if (local.key) {
      configMap.set(local.key, local);
    }
  }

  for (const remote of remoteConfigs) {
    if (!remote.key) continue;

    const local = configMap.get(remote.key);
    if (!local) {
      configMap.set(remote.key, remote);
      continue;
    }

    const localTime = parseTimestamp(local.updatedAt);
    const remoteTime = parseTimestamp(remote.updatedAt);

    if (remoteTime > localTime) {
      configMap.set(remote.key, remote);
    }
  }

  return Array.from(configMap.values());
}
