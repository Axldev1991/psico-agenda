import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { fetchArgentinaHolidays, getHoliday, ARGENTINA_HOLIDAYS_2026, Holiday } from './holidays';

describe('holidays.ts', () => {
  // Mock localStorage
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

  // Setup window and global for localStorage if it doesn't exist
  if (typeof window === 'undefined') {
    (global as any).window = { localStorage: localStorageMock };
  } else {
    Object.defineProperty(window, 'localStorage', { value: localStorageMock });
  }

  Object.defineProperty(global, 'localStorage', { value: localStorageMock });

  // Mock fetch
  const fetchMock = vi.fn();
  global.fetch = fetchMock;

  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.clear();
    // Prevent console.error and console.warn from cluttering the test output
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('fetchArgentinaHolidays', () => {
    it('returns holidays from localStorage if cached', async () => {
      const mockHolidays: Holiday[] = [{ date: '2026-01-01', name: 'New Year' }];
      localStorageMock.setItem('ar-holidays-2026', JSON.stringify(mockHolidays));

      const result = await fetchArgentinaHolidays(2026);

      expect(localStorageMock.getItem).toHaveBeenCalledWith('ar-holidays-2026');
      expect(result).toEqual(mockHolidays);
      expect(fetchMock).not.toHaveBeenCalled();
    });

    it('fetches from API if localStorage has invalid JSON', async () => {
      localStorageMock.setItem('ar-holidays-2026', 'invalid-json');

      const apiResponse = [
        { motivo: 'Día de Prueba', dia: 15, mes: 3, tipo: 'inamovible' }
      ];

      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => apiResponse
      } as any);

      const result = await fetchArgentinaHolidays(2026);

      expect(localStorageMock.getItem).toHaveBeenCalledWith('ar-holidays-2026');
      expect(console.error).toHaveBeenCalled(); // Since invalid JSON logs an error
      expect(fetchMock).toHaveBeenCalled();
      expect(result).toEqual([{ date: '2026-03-15', name: 'Día de Prueba' }]);
    });

    it('fetches from API and populates cache if no cache exists', async () => {
      const apiResponse = [
        { motivo: 'Feriado Nuevo', dia: 10, mes: 5, tipo: 'trasladable' }
      ];

      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => apiResponse
      } as any);

      const result = await fetchArgentinaHolidays(2027);

      expect(fetchMock).toHaveBeenCalledWith('https://nolaborables.com.ar/api/v1/feriados/2027?incluir=opcional');
      expect(result).toEqual([{ date: '2027-05-10', name: 'Feriado Nuevo' }]);
      expect(localStorageMock.setItem).toHaveBeenCalledWith('ar-holidays-2027', JSON.stringify([{ date: '2027-05-10', name: 'Feriado Nuevo' }]));
    });

    it('falls back to static ARGENTINA_HOLIDAYS_2026 if API fails for 2026', async () => {
      fetchMock.mockRejectedValueOnce(new Error('Network error'));

      const result = await fetchArgentinaHolidays(2026);

      expect(console.warn).toHaveBeenCalled(); // Warning is logged on failure
      expect(fetchMock).toHaveBeenCalled();
      expect(result).toEqual(ARGENTINA_HOLIDAYS_2026);
    });

    it('returns empty array if API fails for a year other than 2026', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: false
      } as any);

      const result = await fetchArgentinaHolidays(2027);

      expect(console.warn).toHaveBeenCalled(); // Warning is logged on failure
      expect(fetchMock).toHaveBeenCalled();
      expect(result).toEqual([]);
    });
  });

  describe('getHoliday', () => {
    it('returns the holiday if the date matches a holiday in the default static list', () => {
      // 2026-05-01 is 'Día del Trabajador'
      const date = new Date(2026, 4, 1); // Month is 0-indexed in Date constructor (4 = May)
      const holiday = getHoliday(date);

      expect(holiday).toBeDefined();
      expect(holiday?.name).toBe('Día del Trabajador');
      expect(holiday?.date).toBe('2026-05-01');
    });

    it('returns the holiday if the date matches a holiday in a custom list', () => {
      const customHolidays: Holiday[] = [
        { date: '2027-10-31', name: 'Halloween' }
      ];
      const date = new Date(2027, 9, 31); // 9 = Oct
      const holiday = getHoliday(date, customHolidays);

      expect(holiday).toBeDefined();
      expect(holiday?.name).toBe('Halloween');
    });

    it('returns undefined if the date is not a holiday', () => {
      const date = new Date(2026, 4, 2); // 2026-05-02
      const holiday = getHoliday(date);

      expect(holiday).toBeUndefined();
    });

    it('ignores the time component of the date', () => {
      // 2026-12-25 is 'Navidad'
      // Try different times of the day to ensure format() extracts just the date properly
      // Local dates to format() will be interpreted locally, but standard Date objects
      // constructor uses local time.

      const dateMorning = new Date(2026, 11, 25, 8, 30, 0); // 8:30 AM
      const holidayMorning = getHoliday(dateMorning);
      expect(holidayMorning?.name).toBe('Navidad');

      const dateEvening = new Date(2026, 11, 25, 23, 59, 59); // 11:59:59 PM
      const holidayEvening = getHoliday(dateEvening);
      expect(holidayEvening?.name).toBe('Navidad');
    });
  });
});
