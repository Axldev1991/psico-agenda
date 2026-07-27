import { DexiePatientRepository } from "./db/dexie-patient.repository";
import { DexieSessionRepository } from "./db/dexie-session.repository";
import { GoogleDriveRepository } from "./drive/google-drive.repository";
import { IPatientRepository } from "../repositories/patient.repository";
import { ISessionRepository } from "../repositories/session.repository";
import { IDriveRepository } from "../repositories/drive.repository";

class ServiceContainer {
  private instances: Map<string, any> = new Map();

  constructor() {
    // Registrar implementaciones concretas por defecto
    this.register<IPatientRepository>("patientRepository", new DexiePatientRepository());
    this.register<ISessionRepository>("sessionRepository", new DexieSessionRepository());
    this.register<IDriveRepository>("driveRepository", new GoogleDriveRepository());
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

  getDriveRepository(): IDriveRepository {
    return this.get<IDriveRepository>("driveRepository");
  }
}

export const container = new ServiceContainer();
