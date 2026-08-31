import { ISettingsRepository } from "../../repositories/settings.repository";
import { MovementConfig } from "../../domain/session.types";
import { db } from "./dexie.db";

export class DexieSettingsRepository implements ISettingsRepository {
  async getMovementConfigs(): Promise<MovementConfig[]> {
    const configs = await db.movementConfigs.toArray();
    if (configs.length === 0) {
      // Inyectar valores por defecto si no existen en IndexedDB
      const defaultConfigs: MovementConfig[] = [
        { key: "indigo", color: "indigo", label: "Control" },
        { key: "rose", color: "rose", label: "Cognitivo" },
        { key: "emerald", color: "emerald", label: "Fisiológico" },
        { key: "amber", color: "amber", label: "Otro" }
      ];
      try {
        await db.movementConfigs.bulkAdd(defaultConfigs);
      } catch (e) {
        console.warn("Falla menor al sembrar configuraciones por defecto:", e);
      }
      return defaultConfigs;
    }
    return configs;
  }

  async saveMovementConfig(config: MovementConfig): Promise<void> {
    await db.movementConfigs.put(config);
  }

  async saveAllMovementConfigs(configs: MovementConfig[]): Promise<void> {
    await db.transaction("rw", db.movementConfigs, async () => {
      await db.movementConfigs.clear();
      await db.movementConfigs.bulkAdd(configs);
    });
  }
}
