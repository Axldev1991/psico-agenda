import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  driveLogger,
  getOfflineErrorQueue,
  clearOfflineErrorQueue,
  enqueueOfflineLog,
  flushOfflineErrorQueue,
} from "./drive-logger";

describe("driveLogger - Safe DLP Telemetry & Offline Queue", () => {
  let mockFetch: ReturnType<typeof vi.fn>;
  let mockLocalStorage: Record<string, string>;

  beforeEach(() => {
    driveLogger.clear();
    mockLocalStorage = {};

    const localStorageMock = {
      getItem: vi.fn((key: string) => mockLocalStorage[key] || null),
      setItem: vi.fn((key: string, val: string) => {
        mockLocalStorage[key] = val;
      }),
      removeItem: vi.fn((key: string) => {
        delete mockLocalStorage[key];
      }),
      clear: vi.fn(() => {
        mockLocalStorage = {};
      }),
    };

    mockFetch = vi.fn().mockResolvedValue({ ok: true });
    (global as any).fetch = mockFetch;
    (global as any).window = {
      location: { hostname: "psico-agenda.vercel.app" },
      localStorage: localStorageMock,
      addEventListener: vi.fn(),
    };
    Object.defineProperty(global, "navigator", {
      value: { onLine: true },
      configurable: true,
      writable: true,
    });
  });

  it("does not send non-error logs (info, request, response) to /api/logs on production", () => {
    driveLogger.log("info", "Sync regular ejecutada con éxito");
    driveLogger.log("request", "GET /drive/v3/files");
    driveLogger.log("response", "200 OK");

    expect(mockFetch).not.toHaveBeenCalled();
    expect(driveLogger.getLogs()).toHaveLength(3);
    expect(getOfflineErrorQueue()).toHaveLength(0);
  });

  it("scrubs and dispatches error logs to /api/logs on production when online", async () => {
    driveLogger.log(
      "error",
      "Falla al conectar con doctor.terapia@gmail.com para paciente 123e4567-e89b-12d3-a456-426614174000",
      {
        fullName: "Florencia González",
        status: 403,
        message: "Forbidden",
      }
    );

    expect(mockFetch).toHaveBeenCalledTimes(1);
    const [url, options] = mockFetch.mock.calls[0];
    expect(url).toBe("/api/logs");
    expect(options.method).toBe("POST");

    const payload = JSON.parse(options.body);
    expect(payload.type).toBe("error");
    expect(payload.message).toContain("[EMAIL_REDACTED]");
    expect(payload.message).toContain("123e4567...");
    expect(payload.message).not.toContain("doctor.terapia@gmail.com");
    expect(payload.details.fullName).toBeUndefined();
    expect(payload.details.status).toBe(403);
    expect(getOfflineErrorQueue()).toHaveLength(0);
  });

  it("enqueues sanitized error in localStorage when navigator is offline", () => {
    Object.defineProperty(global, "navigator", {
      value: { onLine: false },
      configurable: true,
      writable: true,
    });

    driveLogger.log("error", "Error crítico sin conexión para paciente@gmail.com");

    expect(mockFetch).not.toHaveBeenCalled();
    const queue = getOfflineErrorQueue();
    expect(queue).toHaveLength(1);
    expect(queue[0].message).toContain("[EMAIL_REDACTED]");
    expect(queue[0].message).not.toContain("paciente@gmail.com");
  });

  it("enqueues sanitized error in localStorage when fetch fails", async () => {
    mockFetch.mockRejectedValueOnce(new Error("Network connection lost"));

    driveLogger.log("error", "Error de red con servidor");

    // Wait for promise tick
    await new Promise((resolve) => setTimeout(resolve, 10));

    const queue = getOfflineErrorQueue();
    expect(queue).toHaveLength(1);
    expect(queue[0].message).toBe("Error de red con servidor");
  });

  it("caps offline queue at maximum 10 items (ring-buffer FIFO)", () => {
    clearOfflineErrorQueue();
    for (let i = 1; i <= 15; i++) {
      enqueueOfflineLog({
        timestamp: "12:00:00",
        type: "error",
        message: `Error número ${i}`,
      });
    }

    const queue = getOfflineErrorQueue();
    expect(queue).toHaveLength(10);
    // Oldest 1-5 dropped, 6-15 preserved
    expect(queue[0].message).toBe("Error número 6");
    expect(queue[9].message).toBe("Error número 15");
  });

  it("flushes offline queue to /api/logs when back online", async () => {
    enqueueOfflineLog({ timestamp: "10:00:00", type: "error", message: "Error pendiente 1" });
    enqueueOfflineLog({ timestamp: "10:01:00", type: "error", message: "Error pendiente 2" });
    expect(getOfflineErrorQueue()).toHaveLength(2);

    mockFetch.mockResolvedValue({ ok: true });
    await flushOfflineErrorQueue();

    expect(mockFetch).toHaveBeenCalledTimes(2);
    expect(getOfflineErrorQueue()).toHaveLength(0);
  });
});
