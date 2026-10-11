import { useState, useEffect, useCallback } from "react";

const STORAGE_KEY = "psico_agenda_recent_patients";
const MAX_RECENT = 3;

export function useRecentPatients() {
  const [recentPatientUuids, setRecentPatientUuids] = useState<string[]>([]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          setRecentPatientUuids(parsed);
        }
      }
    } catch (e) {
      console.error("Error reading recent patients from localStorage:", e);
    }
  }, []);

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
