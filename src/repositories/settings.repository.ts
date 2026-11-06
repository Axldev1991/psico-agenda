import { MovementConfig, PunctuationConfig, ClinicalFeaturesSettings } from '../domain/session.types';
import { AvailabilitySettings } from '../domain/availability.types';

export interface ISettingsRepository {
  getMovementConfigs(): Promise<MovementConfig[]>;
  saveMovementConfig(config: MovementConfig): Promise<void>;
  saveAllMovementConfigs(configs: MovementConfig[]): Promise<void>;

  getPunctuationConfigs(): Promise<PunctuationConfig[]>;
  savePunctuationConfig(config: PunctuationConfig): Promise<void>;
  saveAllPunctuationConfigs(configs: PunctuationConfig[]): Promise<void>;

  getAvailabilitySettings(): Promise<AvailabilitySettings>;
  saveAvailabilitySettings(settings: AvailabilitySettings): Promise<void>;

  getClinicalFeatures(): Promise<ClinicalFeaturesSettings>;
  saveClinicalFeatures(features: ClinicalFeaturesSettings): Promise<void>;
}
