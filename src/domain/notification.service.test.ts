import { describe, it, expect } from 'vitest';
import { computeNotifications, dismissNotification } from './notification.service';
import { CalendarSlot } from './agenda.types';

describe('notification.service (TDD)', () => {
  const baseNow = new Date('2026-10-28T14:45:00.000Z');

  const createMockSlot = (partial: Partial<CalendarSlot>): CalendarSlot => ({
    uuid: 'slot-1',
    patientUuid: 'pat-1',
    patientName: 'Lucía Gómez',
    dateTime: new Date('2026-10-28T15:00:00.000Z'),
    durationMinutes: 50,
    status: 'scheduled',
    price: 1000,
    isRecurrent: false,
    ...partial,
  });

  describe('computeNotifications', () => {
    it('returns empty array when slots are empty or now is invalid', () => {
      expect(computeNotifications({ now: baseNow, slots: [] })).toEqual([]);
      expect(computeNotifications({ now: new Date('invalid'), slots: [createMockSlot({})] })).toEqual([]);
    });

    it('generates a daily_summary notification for active appointments today', () => {
      const slots = [
        createMockSlot({
          uuid: 'slot-1',
          dateTime: new Date('2026-10-28T16:00:00.000Z'),
          patientName: 'Carlos Rossi',
        }),
        createMockSlot({
          uuid: 'slot-2',
          dateTime: new Date('2026-10-28T17:00:00.000Z'),
          patientName: 'Ana Belén',
        }),
      ];

      const notifs = computeNotifications({ now: baseNow, slots });
      const summary = notifs.find((n) => n.type === 'daily_summary');

      expect(summary).toBeDefined();
      expect(summary?.severity).toBe('info');
      expect(summary?.title).toContain('2 consultas');
      expect(summary?.message).toContain('Carlos Rossi');
    });

    it('generates an imminent_session alert when a session is within 15 minutes', () => {
      // baseNow is 14:45, session is at 15:00 (15 minutes away)
      const slots = [
        createMockSlot({
          uuid: 'slot-imminent',
          patientName: 'Esteban Quito',
          dateTime: new Date('2026-10-28T14:55:00.000Z'), // 10 min away
        }),
      ];

      const notifs = computeNotifications({ now: baseNow, slots });
      const imminent = notifs.find((n) => n.type === 'imminent_session');

      expect(imminent).toBeDefined();
      expect(imminent?.severity).toBe('urgent');
      expect(imminent?.title).toContain('10 min');
      expect(imminent?.patientName).toBe('Esteban Quito');
    });

    it('does NOT trigger imminent alert if session is more than 15 min away or in the past', () => {
      const slots = [
        createMockSlot({
          uuid: 'slot-future',
          dateTime: new Date('2026-10-28T16:30:00.000Z'), // 1h 45m away
        }),
        createMockSlot({
          uuid: 'slot-past',
          dateTime: new Date('2026-10-28T14:00:00.000Z'), // passed
        }),
      ];

      const notifs = computeNotifications({ now: baseNow, slots });
      const imminent = notifs.filter((n) => n.type === 'imminent_session');

      expect(imminent).toHaveLength(0);
    });

    it('generates a recess_warning when a scheduled session falls on an absence period', () => {
      const slots = [
        createMockSlot({
          uuid: 'slot-recess',
          patientName: 'Martina Soto',
          dateTime: new Date('2026-10-28T16:00:00.000Z'),
          isSuspended: true,
          absence: {
            id: 'abs-1',
            startDate: '2026-10-25',
            endDate: '2026-10-31',
            reason: 'Vacaciones de Primavera',
          },
        }),
      ];

      const notifs = computeNotifications({ now: baseNow, slots });
      const recessNotif = notifs.find((n) => n.type === 'recess_warning');

      expect(recessNotif).toBeDefined();
      expect(recessNotif?.severity).toBe('warning');
      expect(recessNotif?.message).toContain('Vacaciones de Primavera');
    });

    it('filters out notifications that are present in dismissedIds', () => {
      const slots = [
        createMockSlot({
          uuid: 'slot-1',
          dateTime: new Date('2026-10-28T14:55:00.000Z'),
          patientName: 'Lucía Gómez',
        }),
      ];

      const initialNotifs = computeNotifications({ now: baseNow, slots });
      expect(initialNotifs.length).toBeGreaterThan(0);

      const dismissedId = initialNotifs[0].id;
      const filtered = computeNotifications({ now: baseNow, slots, dismissedIds: [dismissedId] });

      expect(filtered.some((n) => n.id === dismissedId)).toBe(false);
    });

    it('orders notifications by severity: urgent first, then warning, then info', () => {
      const slots = [
        // info: daily summary will be triggered
        // urgent: imminent session in 5 min
        createMockSlot({
          uuid: 'slot-urgent',
          dateTime: new Date('2026-10-28T14:50:00.000Z'),
          patientName: 'Urgente',
        }),
        // warning: session during recess later today
        createMockSlot({
          uuid: 'slot-warning',
          dateTime: new Date('2026-10-28T18:00:00.000Z'),
          patientName: 'Receso',
          isSuspended: true,
          absence: { id: 'a', startDate: '2026-10-28', endDate: '2026-10-29', reason: 'Congreso' },
        }),
      ];

      const notifs = computeNotifications({ now: baseNow, slots });
      expect(notifs.length).toBe(3);
      expect(notifs[0].severity).toBe('urgent');
      expect(notifs[1].severity).toBe('warning');
      expect(notifs[2].severity).toBe('info');
    });
  });

  describe('dismissNotification', () => {
    it('appends idToDismiss immutably', () => {
      const initial = ['id-1'];
      const updated = dismissNotification(initial, 'id-2');

      expect(updated).toEqual(['id-1', 'id-2']);
      expect(initial).toEqual(['id-1']); // immutability check
    });

    it('does not duplicate existing dismissed IDs', () => {
      const initial = ['id-1', 'id-2'];
      const updated = dismissNotification(initial, 'id-1');

      expect(updated).toEqual(['id-1', 'id-2']);
    });
  });
});
