import { MovementConfig } from '../domain/session.types';

export interface ISettingsRepository {
  getMovementConfigs(): Promise<MovementConfig[]>;
  saveMovementConfig(config: MovementConfig): Promise<void>;
  saveAllMovementConfigs(configs: MovementConfig[]): Promise<void>;
}
