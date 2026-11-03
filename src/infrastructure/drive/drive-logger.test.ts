import { describe, it, expect, vi, beforeEach } from "vitest";
import { driveLogger } from "./drive-logger";

describe("driveLogger - Safe DLP Telemetry", () => {
  let mockFetch: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    driveLogger.clear();
    mockFetch = vi.fn().mockResolvedValue({ ok: true });
    (global as any).fetch = mockFetch;
    (global as any).window = {
      location: { hostname: "psico-agenda.vercel.app" }, // production hostname
    };
  });

  it("does not send non-error logs (info, request, response) to /api/logs on production", () => {
    driveLogger.log("info", "Sync regular ejecutada con éxito");
    driveLogger.log("request", "GET /drive/v3/files");
    driveLogger.log("response", "200 OK");

    expect(mockFetch).not.toHaveBeenCalled();
    expect(driveLogger.getLogs()).toHaveLength(3);
  });

  it("scrubs and dispatches error logs to /api/logs on production", async () => {
    driveLogger.log("error", "Falla al conectar con doctor.terapia@gmail.com para paciente 123e4567-e89b-12d3-a456-426614174000", {
      fullName: "Florencia González",
      status: 403,
      message: "Forbidden",
    });

    expect(mockFetch).toHaveBeenCalledTimes(1);
    const [url, options] = mockFetch.mock.calls[0];
    expect(url).toBe("/api/logs");
    expect(options.method).toBe("POST");

    const payload = JSON.parse(options.body);
    expect(payload.type).toBe("error");
    // Ensure email and full UUID are scrubbed
    expect(payload.message).toContain("[EMAIL_REDACTED]");
    expect(payload.message).toContain("123e4567...");
    expect(payload.message).not.toContain("doctor.terapia@gmail.com");
    // Ensure sensitive details are stripped
    expect(payload.details.fullName).toBeUndefined();
    expect(payload.details.status).toBe(403);
  });
});
