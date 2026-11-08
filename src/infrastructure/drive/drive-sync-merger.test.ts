import { describe, it, expect } from "vitest";
import {
  mergeSessionsByLWW,
  mergeExtraNotesByLWW,
  mergeRecurrenceRulesByLWW,
  mergePunctuationConfigsByLWW,
  mergeMovementConfigsByLWW,
} from "./drive-sync-merger";
import { Session, RecurrenceRule, PunctuationConfig, MovementConfig } from "../../domain/session.types";
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

  it("preserves soft-deleted session tombstone when local deletion is newer than remote active session", () => {
    const remoteSession: Session = {
      uuid: "s-1",
      patientUuid: "p-1",
      dateTime: "2026-10-15T15:00:00Z",
      status: "scheduled",
      priceAtSession: 20000,
      createdAt: "2026-10-01T00:00:00Z",
      updatedAt: "2026-10-01T00:00:00Z",
    };

    const localDeletedSession: Session = {
      uuid: "s-1",
      patientUuid: "p-1",
      dateTime: "2026-10-15T15:00:00Z",
      status: "scheduled",
      priceAtSession: 20000,
      createdAt: "2026-10-01T00:00:00Z",
      updatedAt: "2026-10-06T12:00:00Z",
      deletedAt: "2026-10-06T12:00:00Z",
    };

    const merged = mergeSessionsByLWW([localDeletedSession], [remoteSession]);

    expect(merged).toHaveLength(1);
    expect(merged[0].deletedAt).toBe("2026-10-06T12:00:00Z");
  });

  it("accepts remote soft-deleted session tombstone when remote deletion is newer than local active session", () => {
    const localSession: Session = {
      uuid: "s-1",
      patientUuid: "p-1",
      dateTime: "2026-10-15T15:00:00Z",
      status: "scheduled",
      priceAtSession: 20000,
      createdAt: "2026-10-01T00:00:00Z",
      updatedAt: "2026-10-01T00:00:00Z",
    };

    const remoteDeletedSession: Session = {
      uuid: "s-1",
      patientUuid: "p-1",
      dateTime: "2026-10-15T15:00:00Z",
      status: "scheduled",
      priceAtSession: 20000,
      createdAt: "2026-10-01T00:00:00Z",
      updatedAt: "2026-10-06T12:00:00Z",
      deletedAt: "2026-10-06T12:00:00Z",
    };

    const merged = mergeSessionsByLWW([localSession], [remoteDeletedSession]);

    expect(merged).toHaveLength(1);
    expect(merged[0].deletedAt).toBe("2026-10-06T12:00:00Z");
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

  it("preserves soft-deleted extra note tombstone when local deletion is newer than remote active note", () => {
    const localDeletedNote: ExtraNote = {
      uuid: "n-deleted",
      content: "Deleted note",
      tags: [],
      isPinned: false,
      createdAt: "2026-10-01T00:00:00Z",
      updatedAt: "2026-10-11T12:00:00Z",
      deletedAt: "2026-10-11T12:00:00Z",
    };

    const remoteActiveNote: ExtraNote = {
      uuid: "n-deleted",
      content: "Active note from before",
      tags: [],
      isPinned: false,
      createdAt: "2026-10-01T00:00:00Z",
      updatedAt: "2026-10-05T10:00:00Z",
    };

    const merged = mergeExtraNotesByLWW([localDeletedNote], [remoteActiveNote]);
    expect(merged).toHaveLength(1);
    expect(merged[0].deletedAt).toBe("2026-10-11T12:00:00Z");
  });

  it("accepts remote soft-deleted extra note tombstone when remote deletion is newer than local active note", () => {
    const localActiveNote: ExtraNote = {
      uuid: "n-deleted",
      content: "Local active note",
      tags: [],
      isPinned: false,
      createdAt: "2026-10-01T00:00:00Z",
      updatedAt: "2026-10-05T10:00:00Z",
    };

    const remoteDeletedNote: ExtraNote = {
      uuid: "n-deleted",
      content: "Deleted note",
      tags: [],
      isPinned: false,
      createdAt: "2026-10-01T00:00:00Z",
      updatedAt: "2026-10-11T12:00:00Z",
      deletedAt: "2026-10-11T12:00:00Z",
    };

    const merged = mergeExtraNotesByLWW([localActiveNote], [remoteDeletedNote]);
    expect(merged).toHaveLength(1);
    expect(merged[0].deletedAt).toBe("2026-10-11T12:00:00Z");
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

describe("mergeRecurrenceRulesByLWW", () => {
  it("retains newer local recurrence rule (e.g. modality changed to online) when local.updatedAt > remote.updatedAt", () => {
    const localRule: RecurrenceRule = {
      patientUuid: "p-1",
      rruleString: "FREQ=WEEKLY;BYDAY=TU",
      startDate: "2026-10-01",
      startTime: "16:00",
      durationMinutes: 50,
      modality: "online",
      updatedAt: "2026-11-03T18:00:00Z",
    };

    const remoteRule: RecurrenceRule = {
      patientUuid: "p-1",
      rruleString: "FREQ=WEEKLY;BYDAY=TU",
      startDate: "2026-10-01",
      startTime: "16:00",
      durationMinutes: 50,
      modality: "in_person",
      updatedAt: "2026-10-20T10:00:00Z",
    };

    const merged = mergeRecurrenceRulesByLWW([localRule], [remoteRule]);
    expect(merged).toHaveLength(1);
    expect(merged[0].modality).toBe("online");
    expect(merged[0].updatedAt).toBe("2026-11-03T18:00:00Z");
  });

  it("updates with newer remote recurrence rule when remote.updatedAt > local.updatedAt", () => {
    const localRule: RecurrenceRule = {
      patientUuid: "p-1",
      rruleString: "FREQ=WEEKLY;BYDAY=TU",
      startDate: "2026-10-01",
      startTime: "16:00",
      durationMinutes: 50,
      modality: "in_person",
      updatedAt: "2026-10-20T10:00:00Z",
    };

    const remoteRule: RecurrenceRule = {
      patientUuid: "p-1",
      rruleString: "FREQ=WEEKLY;BYDAY=TH",
      startDate: "2026-10-01",
      startTime: "17:00",
      durationMinutes: 50,
      modality: "online",
      updatedAt: "2026-11-03T18:00:00Z",
    };

    const merged = mergeRecurrenceRulesByLWW([localRule], [remoteRule]);
    expect(merged).toHaveLength(1);
    expect(merged[0].startTime).toBe("17:00");
    expect(merged[0].modality).toBe("online");
  });

  it("unions disjoint recurrence rules from both sides", () => {
    const localRule: RecurrenceRule = {
      patientUuid: "p-1",
      rruleString: "FREQ=WEEKLY;BYDAY=TU",
      startDate: "2026-10-01",
      startTime: "16:00",
      durationMinutes: 50,
      modality: "in_person",
      updatedAt: "2026-11-01T10:00:00Z",
    };

    const remoteRule: RecurrenceRule = {
      patientUuid: "p-2",
      rruleString: "FREQ=WEEKLY;BYDAY=WE",
      startDate: "2026-10-01",
      startTime: "10:00",
      durationMinutes: 50,
      modality: "online",
      updatedAt: "2026-11-02T10:00:00Z",
    };

    const merged = mergeRecurrenceRulesByLWW([localRule], [remoteRule]);
    expect(merged).toHaveLength(2);
    expect(merged.map((r) => r.patientUuid)).toEqual(["p-1", "p-2"]);
  });

  it("retains local version when timestamps tie or when remote lacks updatedAt", () => {
    const localRule: RecurrenceRule = {
      patientUuid: "p-1",
      rruleString: "FREQ=WEEKLY;BYDAY=TU",
      startDate: "2026-10-01",
      startTime: "16:00",
      durationMinutes: 50,
      modality: "online",
      updatedAt: "2026-11-03T10:00:00Z",
    };

    const remoteRule: RecurrenceRule = {
      patientUuid: "p-1",
      rruleString: "FREQ=WEEKLY;BYDAY=TU",
      startDate: "2026-10-01",
      startTime: "16:00",
      durationMinutes: 50,
      modality: "in_person",
    };

    const merged = mergeRecurrenceRulesByLWW([localRule], [remoteRule]);
    expect(merged).toHaveLength(1);
    expect(merged[0].modality).toBe("online");
  });
});

describe("mergePunctuationConfigsByLWW", () => {
  it("retains newer local punctuation config when local.updatedAt > remote.updatedAt", () => {
    const localPunc: PunctuationConfig = {
      key: "yellow",
      color: "#FFD700",
      label: "Mi Amarillo Personalizado",
      updatedAt: "2026-11-08T12:00:00Z",
    };
    const remotePunc: PunctuationConfig = {
      key: "yellow",
      color: "#FEF08A",
      label: "Amarillo",
      updatedAt: "2026-11-05T10:00:00Z",
    };

    const merged = mergePunctuationConfigsByLWW([localPunc], [remotePunc]);
    expect(merged).toHaveLength(1);
    expect(merged[0].color).toBe("#FFD700");
    expect(merged[0].label).toBe("Mi Amarillo Personalizado");
  });

  it("updates with newer remote punctuation config when remote.updatedAt > local.updatedAt", () => {
    const localPunc: PunctuationConfig = {
      key: "green",
      color: "#BBF7D0",
      label: "Verde Viejo",
      updatedAt: "2026-11-01T10:00:00Z",
    };
    const remotePunc: PunctuationConfig = {
      key: "green",
      color: "#10B981",
      label: "Verde Esmeralda",
      updatedAt: "2026-11-08T15:00:00Z",
    };

    const merged = mergePunctuationConfigsByLWW([localPunc], [remotePunc]);
    expect(merged).toHaveLength(1);
    expect(merged[0].color).toBe("#10B981");
    expect(merged[0].label).toBe("Verde Esmeralda");
  });

  it("retains local version when timestamps tie or when remote lacks updatedAt", () => {
    const localPunc: PunctuationConfig = {
      key: "purple",
      color: "#A855F7",
      label: "Violeta Clínico",
      updatedAt: "2026-11-08T12:00:00Z",
    };
    const remotePunc: PunctuationConfig = {
      key: "purple",
      color: "#E9D5FF",
      label: "Lavanda Default",
    };

    const merged = mergePunctuationConfigsByLWW([localPunc], [remotePunc]);
    expect(merged).toHaveLength(1);
    expect(merged[0].color).toBe("#A855F7");
    expect(merged[0].label).toBe("Violeta Clínico");
  });

  it("unions disjoint local and remote punctuation keys", () => {
    const localPunc: PunctuationConfig = {
      key: "yellow",
      color: "#FFD700",
      label: "Amarillo",
      updatedAt: "2026-11-08T12:00:00Z",
    };
    const remotePunc: PunctuationConfig = {
      key: "custom_blue",
      color: "#3B82F6",
      label: "Azul Remoto",
      updatedAt: "2026-11-08T11:00:00Z",
    };

    const merged = mergePunctuationConfigsByLWW([localPunc], [remotePunc]);
    expect(merged).toHaveLength(2);
    expect(merged.map((p) => p.key)).toEqual(["yellow", "custom_blue"]);
  });
});

describe("mergeMovementConfigsByLWW", () => {
  it("retains newer local movement config when local.updatedAt > remote.updatedAt", () => {
    const localMv: MovementConfig = {
      key: "indigo",
      color: "#1E3A8A",
      label: "Control Local",
      updatedAt: "2026-11-08T12:00:00Z",
    };
    const remoteMv: MovementConfig = {
      key: "indigo",
      color: "#2D4C85",
      label: "Control Default",
      updatedAt: "2026-11-05T10:00:00Z",
    };

    const merged = mergeMovementConfigsByLWW([localMv], [remoteMv]);
    expect(merged).toHaveLength(1);
    expect(merged[0].color).toBe("#1E3A8A");
    expect(merged[0].label).toBe("Control Local");
  });

  it("retains local version when timestamps tie or when remote lacks updatedAt", () => {
    const localMv: MovementConfig = {
      key: "rose",
      color: "#BE123C",
      label: "Cognitivo Local",
      updatedAt: "2026-11-08T12:00:00Z",
    };
    const remoteMv: MovementConfig = {
      key: "rose",
      color: "#86315F",
      label: "Cognitivo Viejo",
    };

    const merged = mergeMovementConfigsByLWW([localMv], [remoteMv]);
    expect(merged).toHaveLength(1);
    expect(merged[0].color).toBe("#BE123C");
  });
});

