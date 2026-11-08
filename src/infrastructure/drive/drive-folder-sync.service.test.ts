import { describe, it, expect } from "vitest";
import { extractFolderUuidSuffix } from "./drive-folder-sync.service";

describe("extractFolderUuidSuffix", () => {
  it("extracts unique trailing segment for 'patient-' prefixed test/seed UUIDs", () => {
    const axelUuid = "patient-prueba-local-axel";
    const camilaUuid = "patient-test-nuevo-1793390599274";

    const axelSuffix = extractFolderUuidSuffix(axelUuid);
    const camilaSuffix = extractFolderUuidSuffix(camilaUuid);

    expect(axelSuffix).toBe("cal-axel");
    expect(camilaSuffix).toBe("90599274");
    expect(axelSuffix).not.toBe(camilaSuffix);
    expect(axelSuffix).not.toBe("patient-");
    expect(camilaSuffix).not.toBe("patient-");
  });

  it("extracts first 8 characters for standard UUIDv4 without 'patient-' prefix", () => {
    const standardUuid = "8f4b238e-9d2a-4a25-9d32-6997d98341e3";
    const suffix = extractFolderUuidSuffix(standardUuid);

    expect(suffix).toBe("8f4b238e");
  });

  it("preserves full uuid if it contains '-demo-'", () => {
    const demoUuid = "patient-demo-juan-perez";
    const suffix = extractFolderUuidSuffix(demoUuid);

    expect(suffix).toBe("patient-demo-juan-perez");
  });
});
