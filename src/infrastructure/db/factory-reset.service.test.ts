import { describe, it, expect, vi, beforeEach } from 'vitest';
import { executeFactoryReset } from './factory-reset.service';
import { db } from './dexie.db';
import { container } from '../container';

describe('executeFactoryReset', () => {
  let mockStorage: Record<string, string>;

  beforeEach(() => {
    mockStorage = {
      psico_availability_settings: '{"some":"data"}',
      'gd-access-token': 'fake-token-123',
      'gd-last-synced': '2026-11-06T10:00:00Z',
      psico_recent_patients: '["p-1"]',
    };

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
  });

  it('clears all local storage keys and dexie tables', async () => {
    const clearPatientsSpy = vi.spyOn(db.patients, 'clear').mockResolvedValue(undefined as any);
    const clearSessionsSpy = vi.spyOn(db.sessions, 'clear').mockResolvedValue(undefined as any);
    const clearRecurrenceSpy = vi.spyOn(db.recurrenceRules, 'clear').mockResolvedValue(undefined as any);
    const clearExtraNotesSpy = vi.spyOn(db.extraNotes, 'clear').mockResolvedValue(undefined as any);
    const clearMovementSpy = vi.spyOn(db.movementConfigs, 'clear').mockResolvedValue(undefined as any);
    const clearPunctuationSpy = vi.spyOn(db.punctuationConfigs, 'clear').mockResolvedValue(undefined as any);
    const clearSettingsSpy = vi.spyOn(db.appSettings, 'clear').mockResolvedValue(undefined as any);

    // Mock transaction execution
    (vi.spyOn(db, 'transaction') as any).mockImplementation(async (...args: any[]) => {
      const callback = args[args.length - 1];
      return callback();
    });

    await executeFactoryReset({ clearCloudDrive: false });

    expect(clearPatientsSpy).toHaveBeenCalled();
    expect(clearSessionsSpy).toHaveBeenCalled();
    expect(clearRecurrenceSpy).toHaveBeenCalled();
    expect(clearExtraNotesSpy).toHaveBeenCalled();
    expect(clearMovementSpy).toHaveBeenCalled();
    expect(clearPunctuationSpy).toHaveBeenCalled();
    expect(clearSettingsSpy).toHaveBeenCalled();

    expect(mockStorage['psico_availability_settings']).toBeUndefined();
    expect(mockStorage['gd-access-token']).toBeUndefined();
    expect(mockStorage['gd-last-synced']).toBeUndefined();
    expect(mockStorage['psico_recent_patients']).toBeUndefined();
  });

  it('uploads empty index to Google Drive when clearCloudDrive is true', async () => {
    (vi.spyOn(db, 'transaction') as any).mockImplementation(async (...args: any[]) => {
      const callback = args[args.length - 1];
      return callback();
    });

    const mockUpload = vi.fn().mockResolvedValue({ id: 'new-index' });
    const mockLogout = vi.fn();
    const mockDriveRepo = {
      uploadFileToFolder: mockUpload,
      logout: mockLogout,
    };

    vi.spyOn(container, 'getDriveRepository').mockReturnValue(mockDriveRepo as any);

    await executeFactoryReset({ clearCloudDrive: true });

    expect(mockUpload).toHaveBeenCalledWith(
      'appDataFolder',
      'index-db.json',
      'application/json',
      expect.stringContaining('"patients":[]')
    );
    expect(mockLogout).toHaveBeenCalled();
  });
});
