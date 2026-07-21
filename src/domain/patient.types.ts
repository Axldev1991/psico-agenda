export interface Patient {
  uuid: string;
  fullName: string;
  email?: string;
  phone?: string;
  address?: string;
  healthInsurance?: string;
  affiliateNumber?: string;
  sessionPrice: number;
  clinicalHistory?: string;  // Historial clínico unificado en HTML enriquecido
  createdAt: string;
  updatedAt: string;
  type?: 'adult' | 'underage';
  birthDate?: string; // YYYY-MM-DD
  status?: 'active' | 'inactive';
  isHistoryLoaded?: boolean;
  ceciConviveCon?: string;
  ceciFamilia?: string;
  ceciOcupacion?: string;
  ceciEstudios?: string;
  ceciTratamientosAnteriores?: string;
  ceciInicioConsulta?: string; // YYYY-MM-DD
  ceciDiaHorarioAtencion?: string;
  ceciFrecuenciaTratamiento?: string;
  ceciDatosAdicionales?: string;
}
