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
}
