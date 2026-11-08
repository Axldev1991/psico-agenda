export type ExtraNoteTag = 'supervisión' | 'interconsulta' | 'urgente' | string;

export interface ExtraNote {
  uuid: string;
  patientUuid?: string; // Optional: If absent, it's a general note
  content: string;
  tags: ExtraNoteTag[];
  isPinned: boolean;
  createdAt: string; // ISO string
  updatedAt: string; // ISO string
  deletedAt?: string; // ISO timestamp for soft deletion (tombstone for LWW sync)
}

export interface ExtraNoteFilterOptions {
  patientUuid?: string;
  tags?: ExtraNoteTag[];
  isPinned?: boolean;
  searchTerm?: string;
}
