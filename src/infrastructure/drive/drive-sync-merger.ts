import { Session } from "../../domain/session.types";

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
