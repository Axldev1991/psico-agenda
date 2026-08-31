import { MovementConfig, PunctuationConfig } from '../domain/session.types';

export interface ISettingsRepository {
  getMovementConfigs(): Promise<MovementConfig[]>;
  saveMovementConfig(config: MovementConfig): Promise<void>;
  saveAllMovementConfigs(configs: MovementConfig[]): Promise<void>;

  getPunctuationConfigs(): Promise<PunctuationConfig[]>;
  savePunctuationConfig(config: PunctuationConfig): Promise<void>;
  saveAllPunctuationConfigs(configs: PunctuationConfig[]): Promise<void>;
}
