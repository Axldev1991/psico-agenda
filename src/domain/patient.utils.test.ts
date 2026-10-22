import { describe, it, expect } from "vitest";
import { calculateAge, sortPatientsAlphabetically, filterPatients, parseClinicalHistory, rebuildClinicalHistory, extractHighlights } from "./patient.utils";
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
