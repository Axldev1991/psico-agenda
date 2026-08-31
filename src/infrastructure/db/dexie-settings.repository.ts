import { ISettingsRepository } from "../../repositories/settings.repository";
import { MovementConfig, PunctuationConfig } from "../../domain/session.types";
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
      // Inyectar valores por defecto si no existen en IndexedDB
      const defaultConfigs: MovementConfig[] = [
        { key: "indigo", color: "#6366F1", label: "Control" },
        { key: "rose", color: "#F43F5E", label: "Cognitivo" },
        { key: "emerald", color: "#10B981", label: "Fisiológico" },
        { key: "amber", color: "#F59E0B", label: "Otro" }
      ];
      try {
        // Deferir la escritura fuera de la transacción de solo lectura de useLiveQuery
        setTimeout(async () => {
          const count = await db.movementConfigs.count();
          if (count === 0) {
            await db.movementConfigs.bulkAdd(defaultConfigs);
          }
        }, 0);
      } catch (e) {
        console.warn("Falla menor al sembrar configuraciones por defecto:", e);
      }
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

  // Métodos para PunctuationConfig (Resaltadores)
  async getPunctuationConfigs(): Promise<PunctuationConfig[]> {
    const configs = await db.punctuationConfigs.toArray();

    const colorHexMap: Record<string, string> = {
      yellow: "#FEF08A",
      green: "#BBF7D0",
      purple: "#E9D5FF",
      orange: "#FED7AA"
    };

    if (configs.length === 0) {
      const defaultConfigs: PunctuationConfig[] = [
        { key: "yellow", color: "#FEF08A", label: "Amarillo" },
        { key: "green", color: "#BBF7D0", label: "Verde" },
        { key: "purple", color: "#E9D5FF", label: "Lavanda" },
        { key: "orange", color: "#FED7AA", label: "Arena" }
      ];

      setTimeout(async () => {
        try {
          const count = await db.punctuationConfigs.count();
          if (count === 0) {
            await db.punctuationConfigs.bulkAdd(defaultConfigs);
          }
        } catch (e) {
          console.warn("Falla al sembrar puntuaciones por defecto en segundo plano:", e);
        }
      }, 0);

      return defaultConfigs;
    }

    // Asegurar compatibilidad de colores heredados sin '#'
    let modified = false;
    const resolvedConfigs = configs.map(c => {
      if (!c.color.startsWith("#")) {
        c.color = colorHexMap[c.color] || c.color;
        modified = true;
      }
      return c;
    });

    if (modified) {
      setTimeout(async () => {
        try {
          await this.saveAllPunctuationConfigs(resolvedConfigs);
        } catch (e) {
          console.warn("Falla al migrar colores de puntuaciones en segundo plano:", e);
        }
      }, 0);
    }

    return resolvedConfigs;
  }

  async savePunctuationConfig(config: PunctuationConfig): Promise<void> {
    await db.punctuationConfigs.put(config);
  }

  async saveAllPunctuationConfigs(configs: PunctuationConfig[]): Promise<void> {
    await db.transaction("rw", db.punctuationConfigs, async () => {
      await db.punctuationConfigs.clear();
      await db.punctuationConfigs.bulkAdd(configs);
    });
  }
}
