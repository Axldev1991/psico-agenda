import { useState, useEffect, useCallback } from 'react';
import { container } from '../../infrastructure/container';
import {
  AvailabilitySettings,
  DaySchedule,
  TimeRange,
  WeeklyAvailability,
} from '../../domain/availability.types';
import {
  getDefaultAvailabilitySettings,
  validateDayRanges,
  copySchedule as domainCopySchedule,
} from '../../domain/availability.service';

const settingsRepo = container.getSettingsRepository();

export function useAvailabilitySettings() {
  const [settings, setSettings] = useState<AvailabilitySettings>(getDefaultAvailabilitySettings());
  const [loading, setLoading] = useState(true);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Load initial settings
  useEffect(() => {
    let mounted = true;
    settingsRepo.getAvailabilitySettings().then((loaded) => {
      if (mounted) {
        setSettings(loaded);
        setLoading(false);
      }
    });
    return () => {
      mounted = false;
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
    setSaveStatus('idle');
  }, []);

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
    setSaveStatus('idle');
  }, []);

  const addRange = useCallback((day: number) => {
    setSettings((prev) => {
      const currentDay = prev.weekly[day];
      if (!currentDay) return prev;

      // Smart default for a second or subsequent shift
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
    setSaveStatus('idle');
  }, []);

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
    setSaveStatus('idle');
  }, []);

  const copyDaySchedule = useCallback((fromDay: number, toDays: number[]) => {
    setSettings((prev) => {
      const updatedWeekly = domainCopySchedule(prev.weekly, fromDay, toDays);
      return {
        ...prev,
        weekly: updatedWeekly,
      };
    });
    setErrorMessage(null);
    setSaveStatus('idle');
  }, []);

  const updateSessionDuration = useCallback((durationMinutes: number) => {
    setSettings((prev) => ({
      ...prev,
      defaultSessionDurationMinutes: durationMinutes,
    }));
    setSaveStatus('idle');
  }, []);

  const save = useCallback(async (): Promise<boolean> => {
    // Validate each enabled day
    for (let day = 0; day <= 6; day++) {
      const daySchedule = settings.weekly[day];
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
      await settingsRepo.saveAvailabilitySettings(settings);
      setSaveStatus('saved');
      setErrorMessage(null);
      setTimeout(() => setSaveStatus('idle'), 3000);
      return true;
    } catch (e) {
      console.error('Error saving availability settings:', e);
      setErrorMessage('Error al guardar la configuración.');
      setSaveStatus('error');
      return false;
    }
  }, [settings]);

  return {
    settings,
    loading,
    saveStatus,
    errorMessage,
    updateDayEnabled,
    updateRange,
    addRange,
    removeRange,
    copyDaySchedule,
    updateSessionDuration,
    save,
  };
}
