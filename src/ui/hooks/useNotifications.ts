import { useState, useEffect, useMemo, useCallback } from 'react';
import { CalendarSlot } from '../../domain/agenda.types';
import { AppNotification } from '../../domain/notification.types';
import { computeNotifications, dismissNotification } from '../../domain/notification.service';

const STORAGE_KEY = 'psico_dismissed_notifications';

export function useNotifications(slots: CalendarSlot[]) {
  const [now, setNow] = useState<Date>(() => new Date());
  const [dismissedIds, setDismissedIds] = useState<string[]>(() => {
    if (typeof window === 'undefined' || !window.localStorage) return [];
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  // Re-evaluate every 60 seconds so alerts trigger dynamically as clock progresses
  useEffect(() => {
    const timer = setInterval(() => {
      setNow(new Date());
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  const persistDismissed = useCallback((updated: string[]) => {
    setDismissedIds(updated);
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      } catch (e) {
        console.warn('Error saving dismissed notifications:', e);
      }
    }
  }, []);

  const dismiss = useCallback((id: string) => {
    persistDismissed(dismissNotification(dismissedIds, id));
  }, [dismissedIds, persistDismissed]);

  const dismissAll = useCallback(() => {
    const currentNotifs = computeNotifications({ now, slots, dismissedIds });
    const allIds = currentNotifs.map((n) => n.id);
    const merged = Array.from(new Set([...dismissedIds, ...allIds]));
    persistDismissed(merged);
  }, [now, slots, dismissedIds, persistDismissed]);

  const notifications = useMemo(() => {
    return computeNotifications({ now, slots, dismissedIds });
  }, [now, slots, dismissedIds]);

  return {
    notifications,
    unreadCount: notifications.length,
    dismiss,
    dismissAll,
  };
}
