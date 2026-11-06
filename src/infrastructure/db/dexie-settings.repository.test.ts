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

  it('saves and retrieves updated availability settings with updatedAt preserved', async () => {
    const timestamp = '2026-11-06T10:00:00.000Z';
    const custom: AvailabilitySettings = {
      weekly: {
        ...getDefaultAvailabilitySettings().weekly,
        1: { enabled: true, ranges: [{ start: '14:00', end: '20:00' }] },
      },
      defaultSessionDurationMinutes: 45,
      intervalStepMinutes: 60,
      updatedAt: timestamp,
    };

    await repo.saveAvailabilitySettings(custom);
    const retrieved = await repo.getAvailabilitySettings();

    expect(retrieved.defaultSessionDurationMinutes).toBe(45);
    expect(retrieved.weekly[1].ranges).toEqual([{ start: '14:00', end: '20:00' }]);
    expect(retrieved.updatedAt).toBe(timestamp);
  });

  it('gracefully falls back to defaults if corrupted JSON is in localStorage', async () => {
    mockStorage['psico_availability_settings'] = 'invalid-json{{';
    const settings = await repo.getAvailabilitySettings();
    expect(settings.defaultSessionDurationMinutes).toBe(50);
  });

  it('preserves updatedAt when migrating existing settings from localStorage', async () => {
    const timestamp = '2026-11-05T12:30:00.000Z';
    mockStorage['psico_availability_settings'] = JSON.stringify({
      weekly: {
        1: { enabled: true, ranges: [{ start: '10:00', end: '16:00' }] },
      },
      defaultSessionDurationMinutes: 45,
      intervalStepMinutes: 60,
      updatedAt: timestamp,
    });

    const settings = await repo.getAvailabilitySettings();
    expect(settings.defaultSessionDurationMinutes).toBe(45);
    expect(settings.weekly[1].ranges).toEqual([{ start: '10:00', end: '16:00' }]);
    expect(settings.updatedAt).toBe(timestamp);
  });

  describe('ClinicalFeaturesSettings (Movements & Punctuations Toggles)', () => {
    it('returns defaults with movements and punctuations enabled when empty', async () => {
      const features = await repo.getClinicalFeatures();
      expect(features.enableMovements).toBe(true);
      expect(features.enablePunctuations).toBe(true);
    });

    it('saves and retrieves disabled flags with updatedAt', async () => {
      const timestamp = '2026-11-06T15:00:00.000Z';
      await repo.saveClinicalFeatures({
        enableMovements: false,
        enablePunctuations: false,
        updatedAt: timestamp,
      });

      const retrieved = await repo.getClinicalFeatures();
      expect(retrieved.enableMovements).toBe(false);
      expect(retrieved.enablePunctuations).toBe(false);
      expect(retrieved.updatedAt).toBe(timestamp);
    });

    it('falls back to localStorage when Dexie is not ready', async () => {
      mockStorage['psico_clinical_features'] = JSON.stringify({
        enableMovements: true,
        enablePunctuations: false,
        updatedAt: '2026-11-06T16:00:00.000Z',
      });

      const retrieved = await repo.getClinicalFeatures();
      expect(retrieved.enableMovements).toBe(true);
      expect(retrieved.enablePunctuations).toBe(false);
      expect(retrieved.updatedAt).toBe('2026-11-06T16:00:00.000Z');
    });
  });
});
