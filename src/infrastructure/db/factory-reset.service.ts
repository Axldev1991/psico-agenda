import { db } from './dexie.db';
import { getDefaultAvailabilitySettings } from '../../domain/availability.service';
import { container } from '../container';

export interface FactoryResetOptions {
  clearCloudDrive?: boolean;
}

export async function executeFactoryReset(options: FactoryResetOptions = {}): Promise<void> {
  // 1. Vaciar todas las tablas de IndexedDB (Dexie)
  try {
    await db.transaction(
      'rw',
      [
        db.patients,
        db.sessions,
        db.recurrenceRules,
        db.extraNotes,
        db.movementConfigs,
        db.punctuationConfigs,
        db.appSettings,
      ],
      async () => {
        await db.patients.clear();
        await db.sessions.clear();
        await db.recurrenceRules.clear();
        await db.extraNotes.clear();
        await db.movementConfigs.clear();
        await db.punctuationConfigs.clear();
        await db.appSettings.clear();
      }
    );
  } catch (dbErr) {
    console.error('Error al vaciar tablas de Dexie:', dbErr);
  }

  // 2. Limpiar claves de caché y sesión en localStorage
  if (typeof window !== 'undefined' && window.localStorage) {
    const keysToRemove = [
      'psico_availability_settings',
      'psico_recent_patients',
      'psico_offline_error_queue',
      'gd-last-synced',
      'gd-access-token',
      'gd-token-expires-at',
    ];
    keysToRemove.forEach((key) => {
      try {
        window.localStorage.removeItem(key);
      } catch {
        // Ignorar fallas silenciosas de almacenamiento
      }
    });
  }

  // 3. Vaciar backup remoto en Google Drive si fue solicitado
  if (options.clearCloudDrive) {
    try {
      const driveRepo = container.getDriveRepository();
      const emptyIndex = {
        patients: [],
        recurrenceRules: [],
        extraNotes: [],
        movementConfigs: [],
        punctuationConfigs: [],
        availabilitySettings: getDefaultAvailabilitySettings(),
        exportedAt: new Date().toISOString(),
      };

      await driveRepo.uploadFileToFolder(
        'appDataFolder',
        'index-db.json',
        'application/json',
        JSON.stringify(emptyIndex)
      );

      driveRepo.logout();
    } catch (err) {
      console.warn('Falla opcional al resetear índice remoto de Google Drive:', err);
    }
  }
}
