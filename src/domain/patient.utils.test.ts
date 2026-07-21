import { describe, it, expect } from "vitest";
import { calculateAge, sortPatientsAlphabetically } from "./patient.utils";
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
});
