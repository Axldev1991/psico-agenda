import { useMemo, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { container } from '../../infrastructure/container';
import { ExtraNote, ExtraNoteFilterOptions, ExtraNoteTag } from '../../domain/extra-note.types';
import {
  createExtraNote,
  updateExtraNote,
  togglePinExtraNote,
  filterExtraNotes,
  validateExtraNote,
} from '../../domain/extra-note.service';

const repository = container.getExtraNoteRepository();

export function useExtraNotes(initialFilters?: ExtraNoteFilterOptions) {
  const [filters, setFilters] = useState<ExtraNoteFilterOptions>(initialFilters || {});

  // useLiveQuery subscribes directly to IndexedDB tables (Dexie)
  // Re-runs whenever db.extraNotes changes locally or via Drive sync.
  const rawNotes = useLiveQuery(
    () => (filters.patientUuid ? repository.getByPatient(filters.patientUuid) : repository.getAll()),
    [filters.patientUuid]
  );

  const loading = rawNotes === undefined;

  // Apply in-memory filtering (tags, pinned, searchTerm) using pure domain service
  const notes = useMemo(() => {
    if (!rawNotes) return [];
    return filterExtraNotes(rawNotes, filters);
  }, [rawNotes, filters]);

  const addNote = async (
    content: string,
    options?: { patientUuid?: string; tags?: ExtraNoteTag[]; isPinned?: boolean; uuid?: string }
  ): Promise<ExtraNote> => {
    const uuid = options?.uuid || crypto.randomUUID();
    const newNote = createExtraNote(uuid, content, {
      patientUuid: options?.patientUuid ?? filters.patientUuid,
      tags: options?.tags,
      isPinned: options?.isPinned,
    });

    if (!validateExtraNote(newNote)) {
      throw new Error('Invalid extra note data.');
    }

    await repository.save(newNote);
    return newNote;
  };

  const editNote = async (
    uuid: string,
    updates: Partial<Pick<ExtraNote, 'content' | 'patientUuid' | 'tags' | 'isPinned'>>
  ): Promise<ExtraNote> => {
    const existing = await repository.getByUuid(uuid);
    if (!existing) {
      throw new Error(`Extra note with uuid "${uuid}" not found.`);
    }

    const updated = updateExtraNote(existing, updates);
    if (!validateExtraNote(updated)) {
      throw new Error('Invalid extra note data after update.');
    }

    await repository.save(updated);
    return updated;
  };

  const togglePin = async (uuid: string): Promise<void> => {
    const existing = await repository.getByUuid(uuid);
    if (!existing) return;
    const updated = togglePinExtraNote(existing);
    await repository.save(updated);
  };

  const removeNote = async (uuid: string): Promise<void> => {
    await repository.delete(uuid);
  };

  return {
    notes,
    allNotes: rawNotes || [],
    loading,
    filters,
    setFilters,
    addNote,
    editNote,
    togglePin,
    removeNote,
  };
}
