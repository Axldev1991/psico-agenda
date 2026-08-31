import { useLiveQuery } from "dexie-react-hooks";
import { container } from "../../infrastructure/container";
import { MovementConfig, PunctuationConfig } from "../../domain/session.types";

const settingsRepo = container.getSettingsRepository();

export function useSettings() {
  const movementConfigs = useLiveQuery(
    async () => {
      return await settingsRepo.getMovementConfigs();
    },
    []
  ) || [];

  const punctuationConfigs = useLiveQuery(
    async () => {
      return await settingsRepo.getPunctuationConfigs();
    },
    []
  ) || [];

  const updateMovementConfig = async (config: MovementConfig) => {
    await settingsRepo.saveMovementConfig(config);
  };

  const updateAllMovementConfigs = async (configs: MovementConfig[]) => {
    await settingsRepo.saveAllMovementConfigs(configs);
  };

  const updatePunctuationConfig = async (config: PunctuationConfig) => {
    await settingsRepo.savePunctuationConfig(config);
  };

  const updateAllPunctuationConfigs = async (configs: PunctuationConfig[]) => {
    await settingsRepo.saveAllPunctuationConfigs(configs);
  };

  return {
    movementConfigs,
    punctuationConfigs,
    updateMovementConfig,
    updateAllMovementConfigs,
    updatePunctuationConfig,
    updateAllPunctuationConfigs,
  };
}
