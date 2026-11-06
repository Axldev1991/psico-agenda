import { useState, useEffect, useCallback, useRef } from 'react';
import { container } from '../../infrastructure/container';
import {
  AvailabilitySettings,
  DaySchedule,
  TimeRange,
  WeeklyAvailability,
  AbsencePeriod,
} from '../../domain/availability.types';
import {
  getDefaultAvailabilitySettings,
  validateDayRanges,
  copySchedule as domainCopySchedule,
} from '../../domain/availability.service';
import { useGoogleDrive } from './useGoogleDrive';

const settingsRepo = container.getSettingsRepository();

export function useAvailabilitySettings() {
  const [settings, setSettings] = useState<AvailabilitySettings>(getDefaultAvailabilitySettings());
  const [loading, setLoading] = useState(true);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isDirty, setIsDirty] = useState(false);

  const { performSync, googleToken } = useGoogleDrive();
  const settingsRef = useRef(settings);
  const isDirtyRef = useRef(false);
  const debounceTimerRef = useRef<any>(null);

  useEffect(() => {
    settingsRef.current = settings;
  }, [settings]);

  const reload = useCallback(async () => {
    try {
      const loaded = await settingsRepo.getAvailabilitySettings();
      setSettings(loaded);
      settingsRef.current = loaded;
      isDirtyRef.current = false;
      setIsDirty(false);
      setLoading(false);
    } catch (e) {
      console.error('Error reloading availability settings:', e);
    }
  }, []);

  // Load initial settings and listen to updates across components
  useEffect(() => {
    let mounted = true;
    settingsRepo.getAvailabilitySettings().then((loaded) => {
      if (mounted) {
        setSettings(loaded);
        settingsRef.current = loaded;
        setLoading(false);
      }
    });

    const handleUpdate = (e: Event) => {
      const customEvent = e as CustomEvent<AvailabilitySettings>;
      if (customEvent.detail) {
        setSettings(customEvent.detail);
        settingsRef.current = customEvent.detail;
      } else {
        reload();
      }
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('availability-settings-updated', handleUpdate);
    }

    return () => {
      mounted = false;
      if (typeof window !== 'undefined') {
        window.removeEventListener('availability-settings-updated', handleUpdate);
      }
    };
  }, [reload]);

  const save = useCallback(async (): Promise<boolean> => {
    const current = settingsRef.current;
    // Validate each enabled day
    for (let day = 0; day <= 6; day++) {
      const daySchedule = current.weekly[day];
      if (daySchedule && daySchedule.enabled) {
        const validation = validateDayRanges(daySchedule.ranges);
        if (!validation.valid) {
          const dayNames = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
          setErrorMessage(`${dayNames[day]}: ${validation.error}`);
          setSaveStatus('error');
          return false;
        }
      }
    }

    setSaveStatus('saving');
    try {
      const settingsToSave: AvailabilitySettings = {
        ...current,
        updatedAt: new Date().toISOString(),
      };
      await settingsRepo.saveAvailabilitySettings(settingsToSave);
      setSettings(settingsToSave);
      settingsRef.current = settingsToSave;
      isDirtyRef.current = false;
      setIsDirty(false);
      setSaveStatus('saved');
      setErrorMessage(null);

      if (typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent('availability-settings-updated', { detail: settingsToSave })
        );
      }

      if (googleToken) {
        performSync().catch((err) => {
          console.warn('Auto-sync tras guardar disponibilidad:', err);
        });
      }

      setTimeout(() => setSaveStatus('idle'), 3000);
      return true;
    } catch (e) {
      console.error('Error saving availability settings:', e);
      setErrorMessage('Error al guardar la configuración.');
      setSaveStatus('error');
      return false;
    }
  }, [googleToken, performSync]);

  const triggerDebouncedSave = useCallback(() => {
    isDirtyRef.current = true;
    setIsDirty(true);
    setSaveStatus('idle');
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    debounceTimerRef.current = setTimeout(() => {
      save();
    }, 1200);
  }, [save]);

  // Auto-save on unmount if there were pending changes
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
      if (isDirtyRef.current) {
        const toSave: AvailabilitySettings = {
          ...settingsRef.current,
          updatedAt: new Date().toISOString(),
        };
        settingsRepo.saveAvailabilitySettings(toSave).catch((err) => {
          console.error('Error forzando guardado de disponibilidad al desmontar:', err);
        });
      }
    };
  }, []);

  const updateDayEnabled = useCallback((day: number, enabled: boolean) => {
    setSettings((prev) => {
      const currentDay = prev.weekly[day] || { enabled: false, ranges: [] };
      const updatedRanges =
        enabled && currentDay.ranges.length === 0
          ? [{ start: '09:00', end: '13:00' }]
          : currentDay.ranges;

      return {
        ...prev,
        weekly: {
          ...prev.weekly,
          [day]: {
            ...currentDay,
            enabled,
            ranges: updatedRanges,
          },
        },
      };
    });
    setErrorMessage(null);
    triggerDebouncedSave();
  }, [triggerDebouncedSave]);

  const updateRange = useCallback((day: number, index: number, field: 'start' | 'end', value: string) => {
    setSettings((prev) => {
      const currentDay = prev.weekly[day];
      if (!currentDay) return prev;

      const newRanges = currentDay.ranges.map((r, i) =>
        i === index ? { ...r, [field]: value } : r
      );

      return {
        ...prev,
        weekly: {
          ...prev.weekly,
          [day]: {
            ...currentDay,
            ranges: newRanges,
          },
        },
      };
    });
    setErrorMessage(null);
    triggerDebouncedSave();
  }, [triggerDebouncedSave]);

  const addRange = useCallback((day: number) => {
    setSettings((prev) => {
      const currentDay = prev.weekly[day];
      if (!currentDay) return prev;

      const lastRange = currentDay.ranges[currentDay.ranges.length - 1];
      const newStart = lastRange ? '15:00' : '09:00';
      const newEnd = lastRange ? '19:00' : '13:00';

      return {
        ...prev,
        weekly: {
          ...prev.weekly,
          [day]: {
            ...currentDay,
            ranges: [...currentDay.ranges, { start: newStart, end: newEnd }],
          },
        },
      };
    });
    setErrorMessage(null);
    triggerDebouncedSave();
  }, [triggerDebouncedSave]);

  const removeRange = useCallback((day: number, index: number) => {
    setSettings((prev) => {
      const currentDay = prev.weekly[day];
      if (!currentDay) return prev;

      const newRanges = currentDay.ranges.filter((_, i) => i !== index);

      return {
        ...prev,
        weekly: {
          ...prev.weekly,
          [day]: {
            ...currentDay,
            ranges: newRanges,
          },
        },
      };
    });
    setErrorMessage(null);
    triggerDebouncedSave();
  }, [triggerDebouncedSave]);

  const copyDaySchedule = useCallback((fromDay: number, toDays: number[]) => {
    setSettings((prev) => {
      const updatedWeekly = domainCopySchedule(prev.weekly, fromDay, toDays);
      return {
        ...prev,
        weekly: updatedWeekly,
      };
    });
    setErrorMessage(null);
    triggerDebouncedSave();
  }, [triggerDebouncedSave]);

  const updateSessionDuration = useCallback((durationMinutes: number) => {
    setSettings((prev) => ({
      ...prev,
      defaultSessionDurationMinutes: durationMinutes,
    }));
    triggerDebouncedSave();
  }, [triggerDebouncedSave]);

  const addAbsencePeriod = useCallback((period: Omit<AbsencePeriod, 'id'>) => {
    const newPeriod: AbsencePeriod = {
      ...period,
      id: crypto.randomUUID(),
    };
    setSettings((prev) => ({
      ...prev,
      absencePeriods: [...(prev.absencePeriods || []), newPeriod],
    }));
    triggerDebouncedSave();
  }, [triggerDebouncedSave]);

  const removeAbsencePeriod = useCallback((id: string) => {
    setSettings((prev) => ({
      ...prev,
      absencePeriods: (prev.absencePeriods || []).filter((p) => p.id !== id),
    }));
    triggerDebouncedSave();
  }, [triggerDebouncedSave]);

  return {
    settings,
    loading,
    saveStatus,
    errorMessage,
    isDirty,
    updateDayEnabled,
    updateRange,
    addRange,
    removeRange,
    copyDaySchedule,
    updateSessionDuration,
    addAbsencePeriod,
    removeAbsencePeriod,
    reload,
    save,
  };
}
