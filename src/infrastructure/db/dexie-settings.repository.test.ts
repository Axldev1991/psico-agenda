import { describe, it, expect, beforeEach, vi } from 'vitest';
import { DexieSettingsRepository } from './dexie-settings.repository';
import { AvailabilitySettings } from '../../domain/availability.types';
import { getDefaultAvailabilitySettings } from '../../domain/availability.service';

describe('DexieSettingsRepository - AvailabilitySettings', () => {
  let repo: DexieSettingsRepository;
  let mockStorage: Record<string, string>;

  beforeEach(() => {
    mockStorage = {};
    const localStorageMock = {
      getItem: vi.fn((key: string) => mockStorage[key] || null),
      setItem: vi.fn((key: string, value: string) => {
        mockStorage[key] = value;
      }),
      removeItem: vi.fn((key: string) => {
        delete mockStorage[key];
      }),
      clear: vi.fn(() => {
        mockStorage = {};
      }),
    };

    Object.defineProperty(global, 'window', {
      value: { localStorage: localStorageMock },
      writable: true,
    });

    repo = new DexieSettingsRepository();
  });

  it('returns default availability settings when localStorage is empty', async () => {
    const settings = await repo.getAvailabilitySettings();
    const defaults = getDefaultAvailabilitySettings();
    expect(settings.defaultSessionDurationMinutes).toBe(defaults.defaultSessionDurationMinutes);
    expect(settings.weekly[1].enabled).toBe(true);
    expect(settings.weekly[0].enabled).toBe(false);
  });

  it('saves and retrieves updated availability settings', async () => {
    const custom: AvailabilitySettings = {
      weekly: {
        ...getDefaultAvailabilitySettings().weekly,
        1: { enabled: true, ranges: [{ start: '14:00', end: '20:00' }] },
      },
      defaultSessionDurationMinutes: 45,
      intervalStepMinutes: 60,
    };

    await repo.saveAvailabilitySettings(custom);
    const retrieved = await repo.getAvailabilitySettings();

    expect(retrieved.defaultSessionDurationMinutes).toBe(45);
    expect(retrieved.weekly[1].ranges).toEqual([{ start: '14:00', end: '20:00' }]);
  });

  it('gracefully falls back to defaults if corrupted JSON is in localStorage', async () => {
    mockStorage['psico_availability_settings'] = 'invalid-json{{';
    const settings = await repo.getAvailabilitySettings();
    expect(settings.defaultSessionDurationMinutes).toBe(50);
  });
});
