import { useState, useCallback } from "react";

const STORAGE_KEY = "psico_agenda_recent_patients";
const MAX_RECENT = 3;

function getInitialRecentPatients(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    }
  } catch (e) {
    console.error("Error reading recent patients from localStorage:", e);
  }
  return [];
}

export function useRecentPatients() {
  const [recentPatientUuids, setRecentPatientUuids] = useState<string[]>(getInitialRecentPatients);

  const addRecentPatient = useCallback((uuid: string) => {
    if (!uuid) return;
    setRecentPatientUuids((prev) => {
      const filtered = prev.filter((id) => id !== uuid);
      const next = [uuid, ...filtered].slice(0, MAX_RECENT);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch (e) {
        console.error("Error saving recent patients to localStorage:", e);
      }
      return next;
    });
  }, []);

  const clearRecentPatients = useCallback(() => {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (e) {
      console.error("Error removing recent patients from localStorage:", e);
    }
    setRecentPatientUuids([]);
  }, []);

  return {
    recentPatientUuids,
    addRecentPatient,
    clearRecentPatients,
  };
}
