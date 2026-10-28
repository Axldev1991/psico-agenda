import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DriveSyncService } from './drive-sync.service';
import { DexiePatientRepository } from '../db/dexie-patient.repository';
import { DexieSessionRepository } from '../db/dexie-session.repository';
import { GoogleDriveRepository } from './google-drive.repository';

const { 
  mockSave, 
  mockGetAll, 
  mockDeleteByPatient, 
  mockGetByUuid, 
  mockDownloadFile,
  mockGetOrCreateFolder,
  mockSaveAllSessions,
  mockUploadFile,
  mockDownloadBackup,
  mockSaveAllPatients,
  mockGetRecurrenceRules,
  mockSaveAllRecurrenceRules,
  mockGetAllSessions,
  mockRenameFileOrFolder,
  mockFindFolderBySuffix,
  mockGetFileMetadata,
  mockGetMovementConfigs,
  mockSaveAllMovementConfigs,
  mockGetPunctuationConfigs,
  mockSaveAllPunctuationConfigs,
  mockGetByPatient,
  mockGetAvailabilitySettings,
  mockSaveAvailabilitySettings,
} = vi.hoisted(() => ({
  mockSave: vi.fn(),
  mockGetAll: vi.fn(),
  mockDeleteByPatient: vi.fn(),
  mockGetByUuid: vi.fn(),
  mockDownloadFile: vi.fn(),
  mockGetOrCreateFolder: vi.fn(),
  mockSaveAllSessions: vi.fn(),
  mockUploadFile: vi.fn(),
  mockDownloadBackup: vi.fn(),
  mockSaveAllPatients: vi.fn(),
  mockGetRecurrenceRules: vi.fn(),
  mockSaveAllRecurrenceRules: vi.fn(),
  mockGetAllSessions: vi.fn(),
  mockRenameFileOrFolder: vi.fn(),
  mockFindFolderBySuffix: vi.fn(),
  mockGetFileMetadata: vi.fn(),
  mockGetMovementConfigs: vi.fn(),
  mockSaveAllMovementConfigs: vi.fn(),
  mockGetPunctuationConfigs: vi.fn(),
  mockSaveAllPunctuationConfigs: vi.fn(),
  mockGetByPatient: vi.fn(),
  mockGetAvailabilitySettings: vi.fn(),
  mockSaveAvailabilitySettings: vi.fn(),
}));

vi.mock('./google-drive.repository', () => {
  return {
    GoogleDriveRepository: class {
      setAccessToken = vi.fn();
      getOrCreateFolder = mockGetOrCreateFolder;
      downloadFileFromFolder = mockDownloadFile;
      uploadFileToFolder = mockUploadFile;
      downloadBackup = mockDownloadBackup;
      renameFileOrFolder = mockRenameFileOrFolder;
      findFolderBySuffix = mockFindFolderBySuffix;
      getFileMetadata = mockGetFileMetadata;
    }
  };
});

vi.mock('../db/dexie-patient.repository', () => {
  return {
    DexiePatientRepository: class {
      getAll = mockGetAll;
      save = mockSave;
      getByUuid = mockGetByUuid;
      saveAll = mockSaveAllPatients;
    }
  };
});

vi.mock('../db/dexie-session.repository', () => {
  return {
    DexieSessionRepository: class {
      getAll = mockGetAllSessions;
      getByPatient = mockGetByPatient;
      deleteByPatient = mockDeleteByPatient;
      saveAll = mockSaveAllSessions;
      getRecurrenceRules = mockGetRecurrenceRules;
      saveAllRecurrenceRules = mockSaveAllRecurrenceRules;
    }
  };
});

vi.mock('../db/dexie-settings.repository', () => {
  return {
    DexieSettingsRepository: class {
      getMovementConfigs = mockGetMovementConfigs;
      saveAllMovementConfigs = mockSaveAllMovementConfigs;
      getPunctuationConfigs = mockGetPunctuationConfigs;
      saveAllPunctuationConfigs = mockSaveAllPunctuationConfigs;
      getAvailabilitySettings = mockGetAvailabilitySettings;
      saveAvailabilitySettings = mockSaveAvailabilitySettings;
    }
  };
});

describe('DriveSyncService', () => {
  let service: DriveSyncService;
  
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetAllSessions.mockResolvedValue([]);
    mockGetByPatient.mockResolvedValue([]);
    mockGetMovementConfigs.mockResolvedValue([]);
    mockGetPunctuationConfigs.mockResolvedValue([]);
    mockGetAvailabilitySettings.mockResolvedValue({
      weekly: {},
      defaultSessionDurationMinutes: 50,
      intervalStepMinutes: 60,
      absencePeriods: [],
    });
    mockSaveAvailabilitySettings.mockResolvedValue(undefined);
    service = new DriveSyncService();
  });

  it('should mark old inactive patients correctly (evictOldCache)', async () => {
    const oldDate = new Date();
    oldDate.setDate(oldDate.getDate() - 200);

    // Mock patient: inactive/old with no recent sessions
    const patient = {
      uuid: 'p1',
      fullName: 'Test Patient',
      status: 'active' as const,
      isHistoryLoaded: true,
      updatedAt: oldDate.toISOString(),
    };

    mockGetAll.mockResolvedValue([patient]);

    await service.evictOldCache();

    // Verify patient update
    expect(mockSave).toHaveBeenCalledWith(
      expect.objectContaining({
        uuid: 'p1',
        status: 'inactive',
        isHistoryLoaded: false,
      })
    );
    // Verify session deletion
    expect(mockDeleteByPatient).toHaveBeenCalledWith('p1');
  });

  it('should download and merge patient history correctly (downloadPatientHistory)', async () => {
    const patientUuid = 'p1';
    const mockPatient = { uuid: patientUuid, fullName: 'Test' };
    const remoteData = {
      clinicalHistory: 'New history',
      sessions: [{ uuid: 'sess-remote', patientUuid: patientUuid, dateTime: '2026-06-03T10:00:00Z' }]
    };

    mockGetByUuid.mockResolvedValue(mockPatient);
    mockDownloadFile.mockResolvedValue(JSON.stringify(remoteData));
    mockGetOrCreateFolder.mockResolvedValue('folder-id');

    await service.downloadPatientHistory(patientUuid, 'fake-token');

    // Verify patient update
    expect(mockSave).toHaveBeenCalledWith(
      expect.objectContaining({
        uuid: 'p1',
        clinicalHistory: 'New history',
        isHistoryLoaded: true,
        status: 'active',
      })
    );

    // Verify sessions saved via LWW (non-destructive)
    expect(mockDeleteByPatient).not.toHaveBeenCalled();
    expect(mockSaveAllSessions).toHaveBeenCalledWith(remoteData.sessions);
  });

  describe('performSync', () => {
    beforeEach(() => {
      mockGetOrCreateFolder.mockResolvedValue('folder-id');
      mockGetRecurrenceRules.mockResolvedValue([]);
      mockGetAllSessions.mockResolvedValue([]);
    });

    it('should upload local patient data if local is newer (LWW - Local newer)', async () => {
      const localPatient = {
        uuid: 'p1',
        fullName: 'New Local',
        updatedAt: '2026-07-21T10:00:00Z',
        isHistoryLoaded: true,
        clinicalHistory: 'Local content'
      };
      const remotePatient = {
        uuid: 'p1',
        fullName: 'Old Remote',
        updatedAt: '2026-07-20T10:00:00Z'
      };

      mockGetAll.mockResolvedValue([localPatient]);
      mockDownloadFile.mockImplementation(async (folder, filename) => {
        if (filename === 'index-db.json') {
          return JSON.stringify({ patients: [remotePatient], recurrenceRules: [], exportedAt: '2026-07-20T10:00:00Z' });
        }
        return null;
      });

      await service.performSync('fake-token');

      // Verify it uploaded the local patient JSON data
      expect(mockUploadFile).toHaveBeenCalledWith(
        'folder-id',
        'p1.json',
        'application/json',
        expect.stringContaining('Local content')
      );
    });

    it('should download and merge remote patient data if remote is newer (LWW - Remote newer)', async () => {
      const localPatient = {
        uuid: 'p1',
        fullName: 'Old Local',
        updatedAt: '2026-07-20T10:00:00Z',
        isHistoryLoaded: true,
        clinicalHistory: 'Old Local Content'
      };
      const remotePatient = {
        uuid: 'p1',
        fullName: 'New Remote',
        updatedAt: '2026-07-21T10:00:00Z',
        status: 'active' as const
      };
      const remoteDetail = {
        uuid: 'p1',
        clinicalHistory: 'New Remote Content',
        sessions: [{ patientUuid: 'p1', dateTime: '2026-07-21T09:00:00Z' }]
      };

      mockGetAll.mockResolvedValue([localPatient]);
      mockDownloadFile.mockImplementation(async (folder, filename) => {
        if (filename === 'index-db.json') {
          return JSON.stringify({ patients: [remotePatient], recurrenceRules: [], exportedAt: '2026-07-21T10:00:00Z' });
        }
        if (filename === 'p1.json') {
          return JSON.stringify(remoteDetail);
        }
        return null;
      });

      await service.performSync('fake-token');

      // Verify local patient was updated with downloaded remote content
      expect(mockSaveAllPatients).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            uuid: 'p1',
            clinicalHistory: 'New Remote Content',
            isHistoryLoaded: true,
            status: 'active'
          })
        ])
      );
      expect(mockSaveAllSessions).toHaveBeenCalledWith(remoteDetail.sessions);
    });

    it('should preserve offline-created local sessions when downloading remote patient during performSync (REQ-11)', async () => {
      const localPatient = {
        uuid: 'p1',
        fullName: 'Local Patient',
        updatedAt: '2026-07-20T10:00:00Z',
        isHistoryLoaded: true,
      };
      const remotePatient = {
        uuid: 'p1',
        fullName: 'Remote Patient',
        updatedAt: '2026-07-21T10:00:00Z',
        status: 'active' as const,
      };
      const offlineLocalSession = {
        uuid: 'sess-offline',
        patientUuid: 'p1',
        dateTime: '2026-07-20T11:00:00Z',
        updatedAt: '2026-07-20T11:00:00Z',
      };
      const remoteSession = {
        uuid: 'sess-remote',
        patientUuid: 'p1',
        dateTime: '2026-07-21T09:00:00Z',
        updatedAt: '2026-07-21T09:00:00Z',
      };
      const remoteDetail = {
        uuid: 'p1',
        clinicalHistory: 'Remote history',
        sessions: [remoteSession],
      };

      mockGetAll.mockResolvedValue([localPatient]);
      mockGetAllSessions.mockResolvedValue([offlineLocalSession]);
      mockDownloadFile.mockImplementation(async (folder, filename) => {
        if (filename === 'index-db.json') {
          return JSON.stringify({ patients: [remotePatient], recurrenceRules: [], exportedAt: '2026-07-21T10:00:00Z' });
        }
        if (filename === 'p1.json') {
          return JSON.stringify(remoteDetail);
        }
        return null;
      });

      await service.performSync('fake-token');

      // Crucial: both offline local session and remote session must be merged and saved!
      expect(mockSaveAllSessions).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({ uuid: 'sess-offline' }),
          expect.objectContaining({ uuid: 'sess-remote' }),
        ])
      );
    });

    it('should respect DLP Guard and not upload patient if isHistoryLoaded is false', async () => {
      const localPatient = {
        uuid: 'p1',
        fullName: 'Evicted Local',
        updatedAt: '2026-07-21T10:00:00Z',
        isHistoryLoaded: false, // Inactive/evicted cache
        clinicalHistory: undefined
      };
      const remotePatient = {
        uuid: 'p1',
        fullName: 'Remote Patient',
        updatedAt: '2026-07-20T10:00:00Z'
      };

      mockGetAll.mockResolvedValue([localPatient]);
      mockDownloadFile.mockImplementation(async (folder, filename) => {
        if (filename === 'index-db.json') {
          return JSON.stringify({ patients: [remotePatient], recurrenceRules: [] });
        }
        return null;
      });

      await service.performSync('fake-token');

      // Verify that uploadFileToFolder was NOT called for p1.json (respecting DLP guard)
      const uploadCallsForPatient = mockUploadFile.mock.calls.filter(call => call[1] === 'p1.json');
      expect(uploadCallsForPatient.length).toBe(0);
    });

    it('should migrate old backup when index-db.json is missing', async () => {
      const oldBackup = {
        patients: [
          { uuid: 'p1', fullName: 'Legacy Patient', clinicalHistory: 'Legacy History', updatedAt: '2026-05-28T10:00:00Z' }
        ],
        sessions: [
          { patientUuid: 'p1', dateTime: '2026-05-28T09:00:00Z' }
        ],
        recurrenceRules: [],
        exportedAt: '2026-05-28T10:00:00Z'
      };

      mockGetAll.mockResolvedValue([]);
      mockDownloadFile.mockResolvedValue(null); // index-db.json doesn't exist
      mockDownloadBackup.mockResolvedValue(JSON.stringify(oldBackup));

      await service.performSync('fake-token');

      // Verify patients and sessions are saved locally
      expect(mockSaveAllPatients).toHaveBeenCalled();
      expect(mockUploadFile).toHaveBeenCalledWith(
        'folder-id',
        'p1.json',
        'application/json',
        expect.stringContaining('Legacy History')
      );
    });

    it('should generate Historial_Clinico.doc with the updated clinical history', async () => {
      const localPatient = {
        uuid: 'p1',
        fullName: 'Juan Ignacio Rodríguez',
        updatedAt: '2026-07-21T10:00:00Z',
        isHistoryLoaded: true,
        clinicalHistory: '<h1>Test Clinical History Content</h1>'
      };
      
      mockGetAll.mockResolvedValue([localPatient]);
      mockDownloadFile.mockImplementation(async (folder, filename) => {
        if (filename === 'index-db.json') {
          return JSON.stringify({ patients: [], recurrenceRules: [], exportedAt: '2026-07-20T10:00:00Z' });
        }
        return null;
      });

      await service.performSync('fake-token');

      // Wait for any async calls inside performSync (like syncVisibleFiles) to complete
      await new Promise(resolve => setTimeout(resolve, 50));

      // Check if Historial_Clinico.doc was uploaded with the content
      const docUploadCall = mockUploadFile.mock.calls.find(call => call[1] === 'Historial_Clinico.doc');
      expect(docUploadCall).toBeDefined();
      expect(docUploadCall![3]).toContain('<h1>Test Clinical History Content</h1>');
    });

    it('should sync availabilitySettings and absence periods into index-db.json and save locally', async () => {
      mockGetAll.mockResolvedValue([]);
      mockGetAvailabilitySettings.mockResolvedValue({
        weekly: { 1: { enabled: true, ranges: [{ start: '09:00', end: '13:00' }] } },
        defaultSessionDurationMinutes: 50,
        intervalStepMinutes: 60,
        absencePeriods: [{ id: 'abs-1', startDate: '2026-12-20', endDate: '2026-12-31', reason: 'Vacaciones' }],
      });

      mockDownloadFile.mockImplementation(async (_folder, filename) => {
        if (filename === 'index-db.json') {
          return JSON.stringify({
            patients: [],
            recurrenceRules: [],
            availabilitySettings: {
              weekly: { 2: { enabled: true, ranges: [{ start: '14:00', end: '18:00' }] } },
              defaultSessionDurationMinutes: 45,
              intervalStepMinutes: 60,
              absencePeriods: [{ id: 'abs-2', startDate: '2027-01-10', endDate: '2027-01-20', reason: 'Congreso' }],
            },
            exportedAt: '2026-07-20T10:00:00Z',
          });
        }
        return null;
      });

      await service.performSync('fake-token');

      // Verify merged availability was saved locally
      expect(mockSaveAvailabilitySettings).toHaveBeenCalledWith(
        expect.objectContaining({
          defaultSessionDurationMinutes: 45,
          absencePeriods: expect.arrayContaining([
            expect.objectContaining({ id: 'abs-1' }),
            expect.objectContaining({ id: 'abs-2' }),
          ]),
        })
      );

      // Verify index-db.json uploaded to Drive contains merged availabilitySettings
      const indexUploadCall = mockUploadFile.mock.calls.find(call => call[1] === 'index-db.json');
      expect(indexUploadCall).toBeDefined();
      const uploadedIndex = JSON.parse(indexUploadCall![3]);
      expect(uploadedIndex.availabilitySettings).toBeDefined();
      expect(uploadedIndex.availabilitySettings.absencePeriods).toHaveLength(2);
    });
  });
});

