import { ExtraNote, ExtraNoteFilterOptions, ExtraNoteTag } from './extra-note.types';

export function createExtraNote(
  uuid: string,
  content: string,
  options?: {
    patientUuid?: string;
    tags?: ExtraNoteTag[];
    isPinned?: boolean;
    createdAt?: string;
  }
): ExtraNote {
  const trimmedContent = content.trim();
  if (!trimmedContent) {
    throw new Error('Note content cannot be empty.');
  }

  const now = new Date().toISOString();
  return {
    uuid,
    patientUuid: options?.patientUuid,
    content: trimmedContent,
    tags: options?.tags || [],
    isPinned: options?.isPinned ?? false,
    createdAt: options?.createdAt || now,
    updatedAt: options?.createdAt || now,
  };
}

export function validateExtraNote(note: ExtraNote): boolean {
  if (!note.uuid || note.uuid.trim() === '') return false;
  if (!note.content || note.content.trim() === '') return false;
  if (!note.createdAt || isNaN(Date.parse(note.createdAt))) return false;
  if (!note.updatedAt || isNaN(Date.parse(note.updatedAt))) return false;
  return true;
}

export function updateExtraNote(
  note: ExtraNote,
  updates: Partial<Pick<ExtraNote, 'content' | 'patientUuid' | 'tags' | 'isPinned'>>
): ExtraNote {
  if (updates.content !== undefined && updates.content.trim() === '') {
    throw new Error('Note content cannot be empty.');
  }

  return {
    ...note,
    ...updates,
    content: updates.content !== undefined ? updates.content.trim() : note.content,
    updatedAt: new Date().toISOString(),
  };
}

export function togglePinExtraNote(note: ExtraNote): ExtraNote {
  return updateExtraNote(note, { isPinned: !note.isPinned });
}

export function filterExtraNotes(
  notes: ExtraNote[],
  filters: ExtraNoteFilterOptions
): ExtraNote[] {
  return notes.filter((note) => {
    // 1. Filter by patient
    if (filters.patientUuid !== undefined) {
      if (note.patientUuid !== filters.patientUuid) {
        return false;
      }
    }

    // 2. Filter by tags (note must have ALL specified filter tags)
    if (filters.tags && filters.tags.length > 0) {
      const hasAllTags = filters.tags.every((tag) => note.tags.includes(tag));
      if (!hasAllTags) return false;
    }

    // 3. Filter by pinned status
    if (filters.isPinned !== undefined) {
      if (note.isPinned !== filters.isPinned) {
        return false;
      }
    }

    // 4. Filter by search term (case insensitive in content)
    if (filters.searchTerm && filters.searchTerm.trim() !== '') {
      const term = filters.searchTerm.trim().toLowerCase();
      if (!note.content.toLowerCase().includes(term)) {
        return false;
      }
    }

    return true;
  });
}
