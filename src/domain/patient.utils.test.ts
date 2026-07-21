import { describe, it, expect } from "vitest";
import { calculateAge, sortPatientsAlphabetically, parseClinicalHistory, rebuildClinicalHistory } from "./patient.utils";
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
});
