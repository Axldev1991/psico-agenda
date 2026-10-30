import { describe, it, expect } from "vitest";
import { calculateAge, birthDateFromAge, sortPatientsAlphabetically, filterPatients, parseClinicalHistory, rebuildClinicalHistory, extractHighlights, findInitialSession } from "./patient.utils";
import { Patient } from "./patient.types";

describe("Patient Utilities", () => {
  describe("calculateAge", () => {
    it("should calculate correct age for a standard date", () => {
      const birthDate = "2000-05-15";
      const today = new Date("2026-07-05");
      expect(calculateAge(birthDate, today)).toBe(26);
    });

    it("should calculate correct age if birthday has not occurred yet this year", () => {
      const birthDate = "2000-08-20";
      const today = new Date("2026-07-05");
      expect(calculateAge(birthDate, today)).toBe(25);
    });

    it("should calculate correct age if birthday is today", () => {
      const birthDate = "2000-07-05";
      const today = new Date("2026-07-05");
      expect(calculateAge(birthDate, today)).toBe(26);
    });

    it("should handle leap years correctly", () => {
      const birthDate = "2000-02-29";
      const today = new Date("2026-02-28");
      expect(calculateAge(birthDate, today)).toBe(25);
    });
  });

  describe("birthDateFromAge", () => {
    it("should generate a birthdate that evaluates back to the exact requested age", () => {
      const reference = new Date("2026-10-30");
      const agesToTest = [0, 5, 17, 18, 32, 65, 80];

      for (const age of agesToTest) {
        const calculatedBirthDate = birthDateFromAge(age, reference);
        expect(calculateAge(calculatedBirthDate, reference)).toBe(age);
      }
    });

    it("should generate correct YYYY-MM-DD format for reference date", () => {
      const reference = new Date(2026, 4, 15);
      expect(birthDateFromAge(30, reference)).toBe("1996-05-15");
    });

    it("should handle non-leap target year when reference is Feb 29", () => {
      const leapReference = new Date(2024, 1, 29);
      // 2024 - 1 = 2023 (not leap)
      expect(birthDateFromAge(1, leapReference)).toBe("2023-02-28");
    });

    it("should guard against negative values by clamping to 0", () => {
      const reference = new Date(2026, 4, 15);
      expect(birthDateFromAge(-5, reference)).toBe("2026-05-15");
    });
  });

  describe("sortPatientsAlphabetically", () => {
    it("should sort patients alphabetically by their full name", () => {
      const patients = [
        { fullName: "Zulma" },
        { fullName: "Alberto" },
        { fullName: "Carlos" }
      ] as Patient[];
      
      const sorted = sortPatientsAlphabetically(patients);
      expect(sorted[0].fullName).toBe("Alberto");
      expect(sorted[1].fullName).toBe("Carlos");
      expect(sorted[2].fullName).toBe("Zulma");
    });
  });

  describe("filterPatients", () => {
    const testPatients: Patient[] = [
      { uuid: "1", fullName: "Zulma Gómez", status: "active", type: "adult", sessionPrice: 100, createdAt: "", updatedAt: "" },
      { uuid: "2", fullName: "Alberto Fernandez", status: "active", type: "underage", sessionPrice: 100, createdAt: "", updatedAt: "" },
      { uuid: "3", fullName: "Carlos Pérez", status: "inactive", type: "adult", sessionPrice: 100, createdAt: "", updatedAt: "" },
      { uuid: "4", fullName: "Bautista Díaz", status: "inactive", type: "underage", sessionPrice: 100, createdAt: "", updatedAt: "" },
    ];

    it("should filter by status (active only)", () => {
      const result = filterPatients(testPatients, { status: "active" });
      expect(result).toHaveLength(2);
      expect(result.map((p) => p.fullName)).toEqual(["Alberto Fernandez", "Zulma Gómez"]);
    });

    it("should filter by population type (underage only)", () => {
      const result = filterPatients(testPatients, { type: "underage" });
      expect(result).toHaveLength(2);
      expect(result.map((p) => p.fullName)).toEqual(["Alberto Fernandez", "Bautista Díaz"]);
    });

    it("should combine status and type filters", () => {
      const result = filterPatients(testPatients, { status: "active", type: "adult" });
      expect(result).toHaveLength(1);
      expect(result[0].fullName).toBe("Zulma Gómez");
    });

    it("should filter by search term ignoring accents and case", () => {
      const result = filterPatients(testPatients, { searchTerm: "gomez" });
      expect(result).toHaveLength(1);
      expect(result[0].fullName).toBe("Zulma Gómez");
    });

    it("should return empty array when no matches found", () => {
      const result = filterPatients(testPatients, { searchTerm: "inexistente" });
      expect(result).toHaveLength(0);
    });
  });

  describe("Clinical History HTML Parser & Rebuilder", () => {
    it("should parse and rebuild history HTML correctly", () => {
      const htmlInput = `
        <div id="session-anchor-uuid1" contenteditable="false" style="color: blue;">
          <h3>📅 Sesión N° 1</h3>
        </div>
        <p>Evolución de sesión 1</p>
        <div id="session-anchor-uuid2" style="color: red;">
          <h3>📅 Sesión N° 2</h3>
        </div>
        <p>Evolución de sesión 2</p>
      `;

      const parsed = parseClinicalHistory(htmlInput);
      expect(parsed.size).toBe(2);
      expect(parsed.get("uuid1")).toBe("<p>Evolución de sesión 1</p>");
      expect(parsed.get("uuid2")).toBe("<p>Evolución de sesión 2</p>");

      const sessions = [
        { uuid: "uuid1", dateTime: "2026-05-10T10:00:00.000Z", status: "completed" },
        { uuid: "uuid2", dateTime: "2026-05-17T10:00:00.000Z", status: "scheduled" }
      ];

      const rebuilt = rebuildClinicalHistory(sessions, parsed);
      expect(rebuilt).toContain('id="session-anchor-uuid1"');
      expect(rebuilt).toContain('id="session-anchor-uuid2"');
      expect(rebuilt).toContain("<p>Evolución de sesión 1</p>");
      expect(rebuilt).toContain("<p>Evolución de sesión 2</p>");
    });

    it("should not introduce stray closing div or leading blank lines when parsing rebuilt history", () => {
      const sessions = [
        { uuid: "uuid1", dateTime: "2026-05-10T10:00:00.000Z", status: "completed" },
      ];
      const initialMap = new Map([["uuid1", "<p>Notas de la sesión</p>"]]);
      const rebuilt = rebuildClinicalHistory(sessions, initialMap);
      const parsed = parseClinicalHistory(rebuilt);

      expect(parsed.get("uuid1")).toBe("<p>Notas de la sesión</p>");
      expect(parsed.get("uuid1")).not.toMatch(/^(\s*<\/div>\s*)+/);
    });

    it("should exclude future scheduled sessions that have no clinical notes from rebuilt history", () => {
      const refDate = new Date("2026-10-28T12:00:00.000Z");
      const sessions = [
        { uuid: "past1", dateTime: "2026-10-21T14:00:00.000Z", status: "completed" },
        { uuid: "today1", dateTime: "2026-10-28T14:00:00.000Z", status: "scheduled" },
        { uuid: "futureEmpty", dateTime: "2026-12-31T14:00:00.000Z", status: "scheduled" },
        { uuid: "futureWithNotes", dateTime: "2026-11-15T14:00:00.000Z", status: "scheduled" },
      ];

      const sessionContents = new Map([
        ["past1", "<p>Evolución previa</p>"],
        ["today1", "<p>Evolución de hoy</p>"],
        ["futureEmpty", "<div style=\"...\">Escribí la evolución clínica aquí...</div>"],
        ["futureWithNotes", "<p>Plan terapéutico futuro preparado</p>"],
      ]);

      const rebuilt = rebuildClinicalHistory(sessions, sessionContents, refDate);
      expect(rebuilt).toContain("id=\"session-anchor-past1\"");
      expect(rebuilt).toContain("id=\"session-anchor-today1\"");
      expect(rebuilt).toContain("id=\"session-anchor-futureWithNotes\"");
      expect(rebuilt).not.toContain("id=\"session-anchor-futureEmpty\"");
    });
  });

  describe("findInitialSession", () => {
    const refDate = new Date("2026-10-28T12:00:00.000Z");
    const sessions = [
      { uuid: "s-past", dateTime: "2026-10-21T14:00:00.000Z", status: "completed" },
      { uuid: "s-today", dateTime: "2026-10-28T14:00:00.000Z", status: "scheduled" },
      { uuid: "s-future-near", dateTime: "2026-11-04T14:00:00.000Z", status: "scheduled" },
      { uuid: "s-future-far", dateTime: "2026-12-31T14:00:00.000Z", status: "scheduled" },
    ];

    it("should prioritize targetSessionUuid when provided", () => {
      const result = findInitialSession(sessions, "s-future-far", refDate);
      expect(result?.uuid).toBe("s-future-far");
    });

    it("should select today's session if one is scheduled for today", () => {
      const result = findInitialSession(sessions, null, refDate);
      expect(result?.uuid).toBe("s-today");
    });

    it("should select the most recent past session if there is no session today", () => {
      const withoutToday = sessions.filter(s => s.uuid !== "s-today");
      const result = findInitialSession(withoutToday, null, refDate);
      expect(result?.uuid).toBe("s-past");
    });

    it("should select the closest upcoming future session if only future sessions exist", () => {
      const onlyFuture = [
        { uuid: "s-future-near", dateTime: "2026-11-04T14:00:00.000Z", status: "scheduled" },
        { uuid: "s-future-far", dateTime: "2026-12-31T14:00:00.000Z", status: "scheduled" },
      ];
      const result = findInitialSession(onlyFuture, null, refDate);
      expect(result?.uuid).toBe("s-future-near");
    });
  });

  describe("extractHighlights", () => {
    it("should extract highlighted snippets from history HTML correctly", () => {
      const htmlInput = `
        <div id="session-anchor-uuid1" contenteditable="false">
          <h3>📅 Sesión N° 1</h3>
        </div>
          Normal text here. <span style="background-color: rgb(254, 240, 138);">Highlight Amarillo</span>.
        <div id="session-anchor-uuid2">
          <h3>📅 Sesión N° 2</h3>
        </div>
          Other text. <span style="background-color: #bbf7d0;">Highlight Verde</span>.
      `;
      const sessions = [
        { uuid: "uuid1", dateTime: "2026-05-10T10:00:00.000Z", status: "completed" },
        { uuid: "uuid2", dateTime: "2026-05-17T10:00:00.000Z", status: "completed" }
      ];

      const highlights = extractHighlights(htmlInput, sessions);
      expect(highlights.length).toBe(2);
      expect(highlights[0].sessionUuid).toBe("uuid2");
      expect(highlights[0].text).toBe("Highlight Verde");
      expect(highlights[0].color).toBe("#bbf7d0");
      expect(highlights[0].sessionNumber).toBe(2);

      expect(highlights[1].sessionUuid).toBe("uuid1");
      expect(highlights[1].text).toBe("Highlight Amarillo");
      expect(highlights[1].color).toBe("rgb(254, 240, 138)");
      expect(highlights[1].sessionNumber).toBe(1);
    });
  });
});
