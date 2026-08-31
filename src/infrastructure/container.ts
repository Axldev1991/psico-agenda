import { DexiePatientRepository } from "./db/dexie-patient.repository";
import { DexieSessionRepository } from "./db/dexie-session.repository";
import { DexieSettingsRepository } from "./db/dexie-settings.repository";
import { GoogleDriveRepository } from "./drive/google-drive.repository";
import { DriveFolderSyncService } from "./drive/drive-folder-sync.service";
import { IPatientRepository } from "../repositories/patient.repository";
import { ISessionRepository } from "../repositories/session.repository";
import { ISettingsRepository } from "../repositories/settings.repository";
import { IDriveRepository } from "../repositories/drive.repository";

class ServiceContainer {
  private instances: Map<string, any> = new Map();

  constructor() {
    // Registrar implementaciones concretas por defecto
    this.register<IPatientRepository>("patientRepository", new DexiePatientRepository());
    this.register<ISessionRepository>("sessionRepository", new DexieSessionRepository());
    this.register<ISettingsRepository>("settingsRepository", new DexieSettingsRepository());
    this.register<IDriveRepository>("driveRepository", new GoogleDriveRepository());
    this.register<DriveFolderSyncService>("driveFolderSyncService", new DriveFolderSyncService());
  }

  register<T>(key: string, instance: T) {
    this.instances.set(key, instance);
  }

  get<T>(key: string): T {
    const instance = this.instances.get(key);
    if (!instance) {
      throw new Error(`Service not registered for key: ${key}`);
    }
    return instance;
  }

  getPatientRepository(): IPatientRepository {
    return this.get<IPatientRepository>("patientRepository");
  }

  getSessionRepository(): ISessionRepository {
    return this.get<ISessionRepository>("sessionRepository");
  }

  getSettingsRepository(): ISettingsRepository {
    return this.get<ISettingsRepository>("settingsRepository");
  }

  getDriveRepository(): IDriveRepository {
    return this.get<IDriveRepository>("driveRepository");
  }

  getDriveFolderSyncService(): DriveFolderSyncService {
    return this.get<DriveFolderSyncService>("driveFolderSyncService");
  }
}

export const container = new ServiceContainer();
