import { describe, it, expect } from "vitest";
import {
  sanitizeLogMessage,
  sanitizeLogDetails,
  sanitizeLogEntry,
} from "./dlp-sanitizer";

describe("DLP Sanitizer (Data Loss Prevention)", () => {
  describe("sanitizeLogMessage", () => {
    it("redacts email addresses from log message", () => {
      const raw = "Error enviando notificación a paciente.gonzalez@gmail.com en el servicio";
      const sanitized = sanitizeLogMessage(raw);
      expect(sanitized).not.toContain("paciente.gonzalez@gmail.com");
      expect(sanitized).toContain("[EMAIL_REDACTED]");
    });

    it("redacts phone numbers from log message", () => {
      const raw = "Fallo de conexión al enviar recordatorio a +54 11 5829-1022";
      const sanitized = sanitizeLogMessage(raw);
      expect(sanitized).not.toContain("5829-1022");
      expect(sanitized).toContain("[PHONE_REDACTED]");
    });

    it("redacts national IDs (DNI / Cédulas)", () => {
      const raw = "Error validando afiliado con DNI 36582910 en obra social";
      const sanitized = sanitizeLogMessage(raw);
      expect(sanitized).not.toContain("36582910");
      expect(sanitized).toContain("[ID_REDACTED]");
    });

    it("redacts HTML tags and clinical notes fragments", () => {
      const raw = "Error serializando historia: <h3>Sesión N° 1</h3><p>La paciente refiere angustia profunda</p>";
      const sanitized = sanitizeLogMessage(raw);
      expect(sanitized).not.toContain("<h3>");
      expect(sanitized).not.toContain("<p>");
      expect(sanitized).not.toContain("angustia profunda");
      expect(sanitized).toContain("[HTML_REDACTED]");
    });

    it("truncates full UUIDs to 8 characters to prevent tracking while preserving debugging", () => {
      const raw = "Fallo en paciente 123e4567-e89b-12d3-a456-426614174000";
      const sanitized = sanitizeLogMessage(raw);
      expect(sanitized).not.toContain("123e4567-e89b-12d3-a456-426614174000");
      expect(sanitized).toContain("123e4567...");
    });
  });

  describe("sanitizeLogDetails", () => {
    it("strips sensitive blacklisted clinical fields completely", () => {
      const details = {
        status: 500,
        component: "DriveSyncService",
        fullName: "María Florencia González",
        notes: "La paciente refiere crisis de pánico",
        clinicalHistory: "<p>Contenido sumamente confidencial</p>",
        email: "paciente@example.com",
        phone: "11-4455-6677",
      };

      const sanitized = sanitizeLogDetails(details);

      expect(sanitized.status).toBe(500);
      expect(sanitized.component).toBe("DriveSyncService");
      expect(sanitized.fullName).toBeUndefined();
      expect(sanitized.notes).toBeUndefined();
      expect(sanitized.clinicalHistory).toBeUndefined();
      expect(sanitized.email).toBeUndefined();
      expect(sanitized.phone).toBeUndefined();
    });

    it("recursively sanitizes nested objects and permitted string fields", () => {
      const details = {
        operation: "uploadFile",
        error: {
          code: "HTTP_500",
          message: "Error de conexión hacia paciente.privado@gmail.com",
        },
      };

      const sanitized = sanitizeLogDetails(details);

      expect(sanitized.operation).toBe("uploadFile");
      expect(sanitized.error.code).toBe("HTTP_500");
      expect(sanitized.error.message).toContain("[EMAIL_REDACTED]");
      expect(sanitized.error.message).not.toContain("paciente.privado@gmail.com");
    });
  });

  describe("sanitizeLogEntry", () => {
    it("creates a completely scrubbed log entry safe for remote transport", () => {
      const entry = {
        timestamp: "20:25:00",
        type: "error" as const,
        message: "Excepción no controlada en paciente 34797943-5295-6913-1960-000000000000 al sincronizar con doctor@terapia.com",
        details: {
          action: "sync",
          fullName: "Juan Pérez",
          stack: "Error at performSync (src/sync.ts:42)",
        },
      };

      const sanitized = sanitizeLogEntry(entry);

      expect(sanitized.type).toBe("error");
      expect(sanitized.message).not.toContain("doctor@terapia.com");
      expect(sanitized.message).toContain("[EMAIL_REDACTED]");
      expect(sanitized.message).toContain("34797943...");
      expect(sanitized.details?.fullName).toBeUndefined();
      expect(sanitized.details?.stack).toBe("Error at performSync (src/sync.ts:42)");
    });
  });
});

