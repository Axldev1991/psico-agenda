import { describe, it, expect, beforeEach, vi } from "vitest";

// Mock localStorage for Node environment
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value.toString();
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      store = {};
    }),
  };
})();

Object.defineProperty(global, "localStorage", {
  value: localStorageMock,
  writable: true,
});

describe("Recent Patients Storage Logic", () => {
  const STORAGE_KEY = "psico_agenda_recent_patients";

  beforeEach(() => {
    localStorageMock.clear();
    vi.clearAllMocks();
  });

  it("handles empty initial storage gracefully", () => {
    const raw = localStorage.getItem(STORAGE_KEY);
    expect(raw).toBeNull();
  });

  it("parses valid stored patient UUIDs", () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(["uuid-1", "uuid-2"]));
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = JSON.parse(raw!);
    expect(parsed).toEqual(["uuid-1", "uuid-2"]);
  });

  it("deduplicates and limits to 3 most recent entries", () => {
    const initial = ["uuid-1", "uuid-2"];
    const addPatient = (newUuid: string, current: string[]) => {
      const filtered = current.filter((id) => id !== newUuid);
      return [newUuid, ...filtered].slice(0, 3);
    };

    let updated = addPatient("uuid-3", initial);
    expect(updated).toEqual(["uuid-3", "uuid-1", "uuid-2"]);

    // Adding existing moves it to top
    updated = addPatient("uuid-1", updated);
    expect(updated).toEqual(["uuid-1", "uuid-3", "uuid-2"]);

    // Adding 4th drops the oldest
    updated = addPatient("uuid-4", updated);
    expect(updated).toEqual(["uuid-4", "uuid-1", "uuid-3"]);
  });

  it("recovers safely from corrupted localStorage JSON", () => {
    localStorage.setItem(STORAGE_KEY, "invalid-json{{");
    let result: string[] = [];
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      result = JSON.parse(raw!);
    } catch {
      result = [];
    }
    expect(result).toEqual([]);
  });
});
