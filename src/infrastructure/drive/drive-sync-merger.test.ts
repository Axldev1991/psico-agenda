import { describe, it, expect } from "vitest";
import { mergeSessionsByLWW, mergeExtraNotesByLWW } from "./drive-sync-merger";
import { Session } from "../../domain/session.types";
import { ExtraNote } from "../../domain/extra-note.types";

describe("mergeSessionsByLWW", () => {
  it("retains newer local session when local.updatedAt > remote.updatedAt", () => {
    const localSession: Session = {
      uuid: "s-1",
      patientUuid: "p-1",
      dateTime: "2026-10-15T15:00:00Z",
      status: "completed",
      priceAtSession: 25000,
      notes: "Local updated note",
      createdAt: "2026-10-01T00:00:00Z",
      updatedAt: "2026-10-11T12:00:00Z",
    };

    const remoteSession: Session = {
      uuid: "s-1",
      patientUuid: "p-1",
      dateTime: "2026-10-15T15:00:00Z",
      status: "scheduled",
      priceAtSession: 20000,
      notes: "Old remote note",
      createdAt: "2026-10-01T00:00:00Z",
      updatedAt: "2026-10-10T10:00:00Z",
    };

    const merged = mergeSessionsByLWW([localSession], [remoteSession]);

    expect(merged).toHaveLength(1);
    expect(merged[0].status).toBe("completed");
    expect(merged[0].notes).toBe("Local updated note");
    expect(merged[0].priceAtSession).toBe(25000);
  });

  it("updates with newer remote session when remote.updatedAt > local.updatedAt", () => {
    const localSession: Session = {
      uuid: "s-1",
      patientUuid: "p-1",
      dateTime: "2026-10-15T15:00:00Z",
      status: "scheduled",
      priceAtSession: 20000,
      createdAt: "2026-10-01T00:00:00Z",
      updatedAt: "2026-10-09T08:00:00Z",
    };

    const remoteSession: Session = {
      uuid: "s-1",
      patientUuid: "p-1",
      dateTime: "2026-10-15T15:00:00Z",
      status: "cancelled",
      priceAtSession: 20000,
      notes: "Cancelado en teléfono",
      createdAt: "2026-10-01T00:00:00Z",
      updatedAt: "2026-10-11T15:30:00Z",
    };

    const merged = mergeSessionsByLWW([localSession], [remoteSession]);

    expect(merged).toHaveLength(1);
    expect(merged[0].status).toBe("cancelled");
    expect(merged[0].notes).toBe("Cancelado en teléfono");
  });

  it("unions disjoint sessions from both sides without data loss", () => {
    const offlineLocalSession: Session = {
      uuid: "s-offline",
      patientUuid: "p-1",
      dateTime: "2026-10-13T10:00:00Z",
      status: "scheduled",
      priceAtSession: 22000,
      createdAt: "2026-10-11T09:00:00Z",
      updatedAt: "2026-10-11T09:00:00Z",
    };

    const remoteDeviceSession: Session = {
      uuid: "s-remote-device",
      patientUuid: "p-1",
      dateTime: "2026-10-14T11:00:00Z",
      status: "scheduled",
      priceAtSession: 22000,
      createdAt: "2026-10-10T12:00:00Z",
      updatedAt: "2026-10-10T12:00:00Z",
    };

    const merged = mergeSessionsByLWW([offlineLocalSession], [remoteDeviceSession]);

    expect(merged).toHaveLength(2);
    expect(merged.map((s) => s.uuid)).toEqual(["s-offline", "s-remote-device"]);
  });

  it("falls back to createdAt when updatedAt is missing", () => {
    const localSession = {
      uuid: "s-legacy",
      patientUuid: "p-1",
      dateTime: "2026-10-12T14:00:00Z",
      status: "scheduled",
      priceAtSession: 18000,
      createdAt: "2026-10-11T12:00:00Z",
    } as Session;

    const remoteSession = {
      uuid: "s-legacy",
      patientUuid: "p-1",
      dateTime: "2026-10-12T14:00:00Z",
      status: "completed",
      priceAtSession: 18000,
      createdAt: "2026-10-10T08:00:00Z",
    } as Session;

    const merged = mergeSessionsByLWW([localSession], [remoteSession]);

    expect(merged).toHaveLength(1);
    expect(merged[0].status).toBe("scheduled"); // Local was created later
  });

  it("deterministically retains local session when timestamps are identical", () => {
    const localSession: Session = {
      uuid: "s-tie",
      patientUuid: "p-1",
      dateTime: "2026-10-12T14:00:00Z",
      status: "completed",
      priceAtSession: 25000,
      notes: "Local tie",
      createdAt: "2026-10-11T10:00:00Z",
      updatedAt: "2026-10-11T10:00:00Z",
    };

    const remoteSession: Session = {
      uuid: "s-tie",
      patientUuid: "p-1",
      dateTime: "2026-10-12T14:00:00Z",
      status: "scheduled",
      priceAtSession: 20000,
      notes: "Remote tie",
      createdAt: "2026-10-11T10:00:00Z",
      updatedAt: "2026-10-11T10:00:00Z",
    };

    const merged = mergeSessionsByLWW([localSession], [remoteSession]);

    expect(merged).toHaveLength(1);
    expect(merged[0].notes).toBe("Local tie");
  });
});

describe("mergeExtraNotesByLWW", () => {
  it("retains newer local note when local.updatedAt > remote.updatedAt", () => {
    const localNote: ExtraNote = {
      uuid: "n-1",
      content: "Local updated content",
      tags: [],
      isPinned: false,
      createdAt: "2026-10-01T00:00:00Z",
      updatedAt: "2026-10-11T12:00:00Z",
    };

    const remoteNote: ExtraNote = {
      uuid: "n-1",
      content: "Remote old content",
      tags: [],
      isPinned: false,
      createdAt: "2026-10-01T00:00:00Z",
      updatedAt: "2026-10-10T10:00:00Z",
    };

    const merged = mergeExtraNotesByLWW([localNote], [remoteNote]);
    expect(merged).toHaveLength(1);
    expect(merged[0].content).toBe("Local updated content");
  });

  it("updates with newer remote note when remote.updatedAt > local.updatedAt", () => {
    const localNote: ExtraNote = {
      uuid: "n-1",
      content: "Local old content",
      tags: [],
      isPinned: false,
      createdAt: "2026-10-01T00:00:00Z",
      updatedAt: "2026-10-09T08:00:00Z",
    };

    const remoteNote: ExtraNote = {
      uuid: "n-1",
      content: "Remote updated content",
      tags: [],
      isPinned: false,
      createdAt: "2026-10-01T00:00:00Z",
      updatedAt: "2026-10-11T15:30:00Z",
    };

    const merged = mergeExtraNotesByLWW([localNote], [remoteNote]);
    expect(merged).toHaveLength(1);
    expect(merged[0].content).toBe("Remote updated content");
  });

  it("unions disjoint notes from both sides", () => {
    const offlineLocalNote: ExtraNote = {
      uuid: "n-offline",
      content: "Offline note",
      tags: [],
      isPinned: false,
      createdAt: "2026-10-11T09:00:00Z",
      updatedAt: "2026-10-11T09:00:00Z",
    };

    const remoteNote: ExtraNote = {
      uuid: "n-remote",
      content: "Remote note",
      tags: [],
      isPinned: false,
      createdAt: "2026-10-10T12:00:00Z",
      updatedAt: "2026-10-10T12:00:00Z",
    };

    const merged = mergeExtraNotesByLWW([offlineLocalNote], [remoteNote]);
    expect(merged).toHaveLength(2);
    expect(merged.map(n => n.uuid)).toContain("n-offline");
    expect(merged.map(n => n.uuid)).toContain("n-remote");
  });

  it("resolves ties in favor of local version deterministically", () => {
    const localNote: ExtraNote = {
      uuid: "n-tie",
      content: "Local tie content",
      tags: [],
      isPinned: false,
      createdAt: "2026-10-11T10:00:00Z",
      updatedAt: "2026-10-11T10:00:00Z",
    };

    const remoteNote: ExtraNote = {
      uuid: "n-tie",
      content: "Remote tie content",
      tags: [],
      isPinned: false,
      createdAt: "2026-10-11T10:00:00Z",
      updatedAt: "2026-10-11T10:00:00Z",
    };

    const merged = mergeExtraNotesByLWW([localNote], [remoteNote]);
    expect(merged).toHaveLength(1);
    expect(merged[0].content).toBe("Local tie content");
  });
});

