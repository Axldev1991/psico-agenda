import { useLiveQuery } from "dexie-react-hooks";
import { container } from "../../infrastructure/container";
import { MovementConfig } from "../../domain/session.types";

const settingsRepo = container.getSettingsRepository();

export function useSettings() {
  const movementConfigs = useLiveQuery(
    async () => {
      return await settingsRepo.getMovementConfigs();
    },
    []
  ) || [];

  const updateMovementConfig = async (config: MovementConfig) => {
    await settingsRepo.saveMovementConfig(config);
  };

  const updateAllMovementConfigs = async (configs: MovementConfig[]) => {
    await settingsRepo.saveAllMovementConfigs(configs);
  };

  return {
    movementConfigs,
    updateMovementConfig,
    updateAllMovementConfigs,
  };
}
