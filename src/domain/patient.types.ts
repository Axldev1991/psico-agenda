export interface Patient {
  uuid: string;
  fullName: string;
  email?: string;
  phone?: string;
  address?: string;
  healthInsurance?: string;
  affiliateNumber?: string;
  sessionPrice: number;
  createdAt: string;
  updatedAt: string;
}
