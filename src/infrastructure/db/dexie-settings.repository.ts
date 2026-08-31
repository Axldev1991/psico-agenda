import { ISettingsRepository } from "../../repositories/settings.repository";
import { MovementConfig } from "../../domain/session.types";
import { db } from "./dexie.db";

export class DexieSettingsRepository implements ISettingsRepository {
  async getMovementConfigs(): Promise<MovementConfig[]> {
    const configs = await db.movementConfigs.toArray();

    const colorHexMap: Record<string, string> = {
      indigo: "#6366F1",
      rose: "#F43F5E",
      emerald: "#10B981",
      amber: "#F59E0B",
      sky: "#0EA5E9",
      violet: "#8B5CF6",
      teal: "#14B8A6",
      orange: "#F97316",
      slate: "#64748B",
      pink: "#EC4899",
      fuchsia: "#D946EF",
      purple: "#A855F7",
      blue: "#3B82F6",
      cyan: "#06B6D4",
      lime: "#84CC16",
      yellow: "#EAB308",
      red: "#EF4444"
    };

    if (configs.length === 0) {
      const defaultConfigs: MovementConfig[] = [
        { key: "indigo", color: "#6366F1", label: "Control" },
        { key: "rose", color: "#F43F5E", label: "Cognitivo" },
        { key: "emerald", color: "#10B981", label: "Fisiológico" },
        { key: "amber", color: "#F59E0B", label: "Otro" }
      ];
      
      // Deferir la escritura fuera de la transacción de solo lectura de useLiveQuery
      setTimeout(async () => {
        try {
          const count = await db.movementConfigs.count();
          if (count === 0) {
            await db.movementConfigs.bulkAdd(defaultConfigs);
          }
        } catch (e) {
          console.warn("Falla al sembrar configuraciones por defecto en segundo plano:", e);
        }
      }, 0);

      return defaultConfigs;
    }

    // Mapear nombres de colores viejos a código hexadecimal para compatibilidad
    let modified = false;
    const resolvedConfigs = configs.map(c => {
      if (!c.color.startsWith("#")) {
        c.color = colorHexMap[c.color] || "#6366F1";
        modified = true;
      }
      return c;
    });

    if (modified) {
      // Deferir la escritura de la migración fuera del contexto de solo lectura
      setTimeout(async () => {
        try {
          await this.saveAllMovementConfigs(resolvedConfigs);
        } catch (e) {
          console.warn("Falla al guardar la migración de colores en segundo plano:", e);
        }
      }, 0);
    }

    return resolvedConfigs;
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
