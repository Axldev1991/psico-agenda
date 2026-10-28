import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DriveSyncService } from './drive-sync.service';
import { Patient } from '../../domain/patient.types';
import { Session } from '../../domain/session.types';
import { rebuildClinicalHistory } from '../../domain/patient.utils';

// Mock dependencies with hoisted spies
const {
  mockSavePatient,
  mockSaveAllPatients,
  mockGetAllPatients,
  mockGetPatientByUuid,
  mockSaveSession,
  mockSaveAllSessions,
  mockGetAllSessions,
  mockGetSessionsByPatient,
  mockDeleteSessionsByPatient,
  mockGetRecurrenceRules,
  mockSaveAllRecurrenceRules,
  mockGetMovementConfigs,
  mockSaveAllMovementConfigs,
  mockGetPunctuationConfigs,
  mockSaveAllPunctuationConfigs,
  mockGetAvailabilitySettings,
  mockSaveAvailabilitySettings,
  mockGetOrCreateFolder,
  mockDownloadFileFromFolder,
  mockUploadFileToFolder,
  mockDownloadBackup,
  mockRenameFileOrFolder,
  mockFindFolderBySuffix,
  mockGetFileMetadata,
} = vi.hoisted(() => ({
  mockSavePatient: vi.fn(),
  mockSaveAllPatients: vi.fn(),
  mockGetAllPatients: vi.fn(),
  mockGetPatientByUuid: vi.fn(),
  mockSaveSession: vi.fn(),
  mockSaveAllSessions: vi.fn(),
  mockGetAllSessions: vi.fn(),
  mockGetSessionsByPatient: vi.fn(),
  mockDeleteSessionsByPatient: vi.fn(),
  mockGetRecurrenceRules: vi.fn(),
  mockSaveAllRecurrenceRules: vi.fn(),
  mockGetMovementConfigs: vi.fn(),
  mockSaveAllMovementConfigs: vi.fn(),
  mockGetPunctuationConfigs: vi.fn(),
  mockSaveAllPunctuationConfigs: vi.fn(),
  mockGetAvailabilitySettings: vi.fn(),
  mockSaveAvailabilitySettings: vi.fn(),
  mockGetOrCreateFolder: vi.fn(),
  mockDownloadFileFromFolder: vi.fn(),
  mockUploadFileToFolder: vi.fn(),
  mockDownloadBackup: vi.fn(),
  mockRenameFileOrFolder: vi.fn(),
  mockFindFolderBySuffix: vi.fn(),
  mockGetFileMetadata: vi.fn(),
}));

vi.mock('./google-drive.repository', () => ({
  GoogleDriveRepository: class {
    setAccessToken = vi.fn();
    getOrCreateFolder = mockGetOrCreateFolder;
    downloadFileFromFolder = mockDownloadFileFromFolder;
    uploadFileToFolder = mockUploadFileToFolder;
    downloadBackup = mockDownloadBackup;
    renameFileOrFolder = mockRenameFileOrFolder;
    findFolderBySuffix = mockFindFolderBySuffix;
    getFileMetadata = mockGetFileMetadata;
  },
}));

vi.mock('../db/dexie-patient.repository', () => ({
  DexiePatientRepository: class {
    save = mockSavePatient;
    saveAll = mockSaveAllPatients;
    getAll = mockGetAllPatients;
    getByUuid = mockGetPatientByUuid;
  },
}));

vi.mock('../db/dexie-session.repository', () => ({
  DexieSessionRepository: class {
    save = mockSaveSession;
    saveAll = mockSaveAllSessions;
    getAll = mockGetAllSessions;
    getByPatient = mockGetSessionsByPatient;
    deleteByPatient = mockDeleteSessionsByPatient;
    getRecurrenceRules = mockGetRecurrenceRules;
    saveAllRecurrenceRules = mockSaveAllRecurrenceRules;
  },
}));

vi.mock('../db/dexie-settings.repository', () => ({
  DexieSettingsRepository: class {
    getMovementConfigs = mockGetMovementConfigs;
    saveAllMovementConfigs = mockSaveAllMovementConfigs;
    getPunctuationConfigs = mockGetPunctuationConfigs;
    saveAllPunctuationConfigs = mockSaveAllPunctuationConfigs;
    getAvailabilitySettings = mockGetAvailabilitySettings;
    saveAvailabilitySettings = mockSaveAvailabilitySettings;
  },
}));

describe('Clinical Notes Persistence & Drive Sync E2E Integration', () => {
  let service: DriveSyncService;

  beforeEach(() => {
    vi.clearAllMocks();

    mockGetRecurrenceRules.mockResolvedValue([]);
    mockSaveAllRecurrenceRules.mockResolvedValue(undefined);
    mockGetMovementConfigs.mockResolvedValue([]);
    mockSaveAllMovementConfigs.mockResolvedValue(undefined);
    mockGetPunctuationConfigs.mockResolvedValue([]);
    mockSaveAllPunctuationConfigs.mockResolvedValue(undefined);
    mockGetAvailabilitySettings.mockResolvedValue({
      weekly: {},
      defaultSessionDurationMinutes: 50,
      intervalStepMinutes: 60,
      absencePeriods: [],
    });
    mockSaveAvailabilitySettings.mockResolvedValue(undefined);

    mockGetOrCreateFolder.mockImplementation(async (name: string) => `folder-${name}`);
    mockFindFolderBySuffix.mockResolvedValue(null);
    mockGetFileMetadata.mockResolvedValue(null);
    mockUploadFileToFolder.mockResolvedValue({ id: 'file-uploaded-123' });

    service = new DriveSyncService();
  });

  it('Pipeline E2E: Therapist saves clinical note -> local state -> Drive uploads JSON & Word doc intact', async () => {
    const patientUuid = 'p-maria-gonzalez-uuid-12345678';
    const sessionUuid = 'sess-clinica-uuid-98765432';
    const clinicalNoteHtml = '<p>Paciente relata notable mejoría en sintomatología ansiosa tras aplicar reestructuración cognitiva.</p>';

    const patient: Patient = {
      uuid: patientUuid,
      fullName: 'María González',
      phone: '11-4567-8901',
      sessionPrice: 15000,
      status: 'active',
      isHistoryLoaded: true,
      clinicalHistory: clinicalNoteHtml,
      createdAt: '2026-01-10T10:00:00.000Z',
      updatedAt: '2026-10-15T17:00:00.000Z',
    };

    const session: Session = {
      uuid: sessionUuid,
      patientUuid: patientUuid,
      dateTime: '2026-10-15T16:00:00.000Z',
      notes: clinicalNoteHtml,
      status: 'completed',
      priceAtSession: 15000,
      createdAt: '2026-10-15T15:00:00.000Z',
      updatedAt: '2026-10-15T17:00:00.000Z',
    };

    // Configurar estado local en repositorios Dexie
    mockGetAllPatients.mockResolvedValue([patient]);
    mockGetAllSessions.mockResolvedValue([session]);
    mockGetSessionsByPatient.mockResolvedValue([session]);

    // Estado remoto en Google Drive: paciente existe pero versión previa más vieja
    const remoteIndexData = {
      patients: [{
        ...patient,
        updatedAt: '2026-10-10T10:00:00.000Z', // Local es más nuevo (LWW: sube)
      }],
      recurrenceRules: [],
      movementConfigs: [],
      punctuationConfigs: [],
      exportedAt: '2026-10-10T10:00:00.000Z',
    };

    mockDownloadFileFromFolder.mockImplementation(async (_folderId: string, filename: string) => {
      if (filename === 'index-db.json') {
        return JSON.stringify(remoteIndexData);
      }
      return null;
    });

    // Ejecutar sincronización a Google Drive
    await service.performSync('valid-google-auth-token');

    // Esperar microtasks por llamadas asíncronas de syncVisibleFiles
    await new Promise(resolve => setTimeout(resolve, 50));

    // 1. Validar que se haya subido el archivo atómico del paciente ({uuid}.json) con las notas intactas
    const uploadedPatientFileCall = mockUploadFileToFolder.mock.calls.find(call => 
      call[1] === `${patientUuid}.json`
    );
    expect(uploadedPatientFileCall).toBeDefined();
    const uploadedPatientPayload = JSON.parse(uploadedPatientFileCall![3]);
    expect(uploadedPatientPayload.uuid).toBe(patientUuid);
    expect(uploadedPatientPayload.clinicalHistory).toBe(clinicalNoteHtml);
    expect(uploadedPatientPayload.sessions).toHaveLength(1);
    expect(uploadedPatientPayload.sessions[0].notes).toBe(clinicalNoteHtml);

    // 2. Validar que se haya generado y subido Historial_Clinico.doc para el terapeuta
    const uploadedDocCall = mockUploadFileToFolder.mock.calls.find(call => 
      call[1] === 'Historial_Clinico.doc'
    );
    expect(uploadedDocCall).toBeDefined();
    const docContent = uploadedDocCall![3] as string;
    expect(docContent).toContain('María González');
    expect(docContent).toContain('Paciente relata notable mejoría en sintomatología ansiosa');

    // 3. Validar que perfil.json se sincronizó con los metadatos clínicos
    const uploadedProfileCall = mockUploadFileToFolder.mock.calls.find(call => 
      call[1] === 'perfil.json'
    );
    expect(uploadedProfileCall).toBeDefined();
    const profilePayload = JSON.parse(uploadedProfileCall![3]);
    expect(profilePayload.fullName).toBe('María González');

    // 4. Validar que index-db.json en appDataFolder no expone notas crudas pero actualiza timestamps
    const uploadedIndexCall = mockUploadFileToFolder.mock.calls.find(call => 
      call[0] === 'appDataFolder' && call[1] === 'index-db.json'
    );
    expect(uploadedIndexCall).toBeDefined();
    const indexPayload = JSON.parse(uploadedIndexCall![3]);
    expect(indexPayload.patients[0].clinicalHistory).toBeUndefined();
    expect(indexPayload.patients[0].fullName).toBe('María González');
  });

  it('DLP Guard: Refuses to upload patient notes to Drive if isHistoryLoaded === false', async () => {
    const unhydratedPatient: Patient = {
      uuid: 'patient-unloaded-uuid-999',
      fullName: 'Carlos Desconocido',
      sessionPrice: 12000,
      status: 'active',
      isHistoryLoaded: false, // Historial NO descargado aún
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-10-18T10:00:00.000Z',
    };

    mockGetAllPatients.mockResolvedValue([unhydratedPatient]);
    mockGetAllSessions.mockResolvedValue([]);

    // En Drive, el índice remoto tiene una fecha vieja
    mockDownloadFileFromFolder.mockResolvedValue(JSON.stringify({
      patients: [{ ...unhydratedPatient, updatedAt: '2026-09-01T00:00:00.000Z' }],
      recurrenceRules: [],
      movementConfigs: [],
      punctuationConfigs: [],
    }));

    await service.performSync('valid-token');
    await new Promise(resolve => setTimeout(resolve, 50));

    // El archivo {uuid}.json NUNCA debe ser subido porque isHistoryLoaded es false
    const dangerousUpload = mockUploadFileToFolder.mock.calls.find(call => 
      call[1] === `${unhydratedPatient.uuid}.json`
    );
    expect(dangerousUpload).toBeUndefined();

    // Historial_Clinico.doc tampoco debe ser generado/pisado para pacientes sin historial local
    const dangerousDocUpload = mockUploadFileToFolder.mock.calls.find(call => 
      call[1] === 'Historial_Clinico.doc'
    );
    expect(dangerousDocUpload).toBeUndefined();
  });

  it('Offline Resilience: When Drive API fails (HTTP 500 / Network down), local Dexie notes stay completely intact', async () => {
    const localPatient: Patient = {
      uuid: 'patient-offline-safe-777',
      fullName: 'Lucía Benítez',
      sessionPrice: 16000,
      status: 'active',
      isHistoryLoaded: true,
      clinicalHistory: '<p>Apuntes clínicos de sesión presencial tomados en consultorio sin conexión.</p>',
      createdAt: '2026-10-19T09:00:00.000Z',
      updatedAt: '2026-10-19T10:00:00.000Z',
    };

    const localSession: Session = {
      uuid: 'session-offline-safe-888',
      patientUuid: localPatient.uuid,
      dateTime: '2026-10-19T09:30:00.000Z',
      notes: '<p>Apuntes clínicos de sesión presencial tomados en consultorio sin conexión.</p>',
      status: 'completed',
      priceAtSession: 16000,
      createdAt: '2026-10-19T09:00:00.000Z',
      updatedAt: '2026-10-19T10:00:00.000Z',
    };

    let localPatientsStore = [localPatient];
    let localSessionsStore = [localSession];

    mockGetAllPatients.mockImplementation(async () => [...localPatientsStore]);
    mockGetAllSessions.mockImplementation(async () => [...localSessionsStore]);

    // Simular corte total de red o falla de Google Drive al intentar leer o escribir
    mockDownloadFileFromFolder.mockRejectedValue(new Error('Fetch failed: Google Drive 503 Service Unavailable / Network Offline'));
    mockUploadFileToFolder.mockRejectedValue(new Error('Fetch failed: Network Offline'));

    // Ejecutar sincronización esperando que falle limpiamente
    await expect(service.performSync('any-token')).rejects.toThrow('Google Drive 503 Service Unavailable / Network Offline');

    // Verificar que los datos en la base local jamás fueron tocados, purgados ni corrompidos
    expect(localPatientsStore).toHaveLength(1);
    expect(localPatientsStore[0].clinicalHistory).toContain('Apuntes clínicos de sesión presencial');
    expect(localSessionsStore).toHaveLength(1);
    expect(localSessionsStore[0].notes).toContain('Apuntes clínicos de sesión presencial');
    expect(mockDeleteSessionsByPatient).not.toHaveBeenCalled();
  });

  it('Multi-session Chronological Assembly: Assembles multiple therapy sessions in order into Historial_Clinico.doc', async () => {
    const sessionSept: Session = {
      uuid: 'sess-septiembre-1',
      patientUuid: 'p-multi-session-uuid-555',
      dateTime: '2026-09-10T15:00:00.000Z',
      notes: '<p>Sesión 1: Primera entrevista clínica y establecimiento de metas terapéuticas.</p>',
      status: 'completed',
      priceAtSession: 15000,
      createdAt: '2026-09-10T15:00:00.000Z',
      updatedAt: '2026-09-10T16:00:00.000Z',
    };

    const sessionOct: Session = {
      uuid: 'sess-octubre-2',
      patientUuid: 'p-multi-session-uuid-555',
      dateTime: '2026-10-15T15:00:00.000Z',
      notes: '<p>Sesión 2: Evaluación de progresos y ejercicios conductuales.</p>',
      status: 'completed',
      priceAtSession: 18000,
      createdAt: '2026-10-15T15:00:00.000Z',
      updatedAt: '2026-10-15T16:00:00.000Z',
    };

    const sessionContents = new Map([
      [sessionSept.uuid, sessionSept.notes!],
      [sessionOct.uuid, sessionOct.notes!],
    ]);
    const clinicalHistory = rebuildClinicalHistory([sessionSept, sessionOct], sessionContents);

    const patient: Patient = {
      uuid: 'p-multi-session-uuid-555',
      fullName: 'Andrés Morales',
      sessionPrice: 15000,
      status: 'active',
      isHistoryLoaded: true,
      clinicalHistory,
      createdAt: '2026-08-01T10:00:00.000Z',
      updatedAt: '2026-10-19T12:00:00.000Z',
    };

    // Entregamos las sesiones desordenadas para verificar ordenamiento cronológico
    mockGetAllPatients.mockResolvedValue([patient]);
    mockGetAllSessions.mockResolvedValue([sessionOct, sessionSept]);
    mockGetSessionsByPatient.mockResolvedValue([sessionOct, sessionSept]);

    mockDownloadFileFromFolder.mockResolvedValue(JSON.stringify({
      patients: [{ ...patient, updatedAt: '2026-08-01T10:00:00.000Z' }],
      recurrenceRules: [],
      movementConfigs: [],
      punctuationConfigs: [],
    }));

    await service.performSync('valid-token');
    await new Promise(resolve => setTimeout(resolve, 50));

    const uploadedDocCall = mockUploadFileToFolder.mock.calls.find(call => 
      call[1] === 'Historial_Clinico.doc'
    );
    expect(uploadedDocCall).toBeDefined();
    const docHtml = uploadedDocCall![3] as string;

    // Verificar presencia de ambas sesiones en el documento final
    expect(docHtml).toContain('Sesión 1: Primera entrevista clínica');
    expect(docHtml).toContain('Sesión 2: Evaluación de progresos');

    // Comprobar orden clínico estándar (la sesión más reciente aparece al inicio del historial)
    const posNewest = docHtml.indexOf('Sesión 2: Evaluación de progresos');
    const posOlder = docHtml.indexOf('Sesión 1: Primera entrevista clínica');
    expect(posNewest).toBeLessThan(posOlder);
  });
});
