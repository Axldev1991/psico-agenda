import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  createExtraNote,
  validateExtraNote,
  updateExtraNote,
  togglePinExtraNote,
  filterExtraNotes,
} from './extra-note.service';
import { ExtraNote } from './extra-note.types';

describe('ExtraNote Service', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-01-01T10:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('createExtraNote', () => {
    it('creates a basic note with defaults', () => {
      const note = createExtraNote('uuid-1', 'My note');
      expect(note).toEqual({
        uuid: 'uuid-1',
        patientUuid: undefined,
        content: 'My note',
        tags: [],
        isPinned: false,
        createdAt: '2024-01-01T10:00:00.000Z',
        updatedAt: '2024-01-01T10:00:00.000Z',
      });
    });

    it('creates a note with options', () => {
      const note = createExtraNote('uuid-2', '  Important note  ', {
        patientUuid: 'patient-1',
        tags: ['urgente'],
        isPinned: true,
        createdAt: '2023-12-31T10:00:00.000Z',
      });
      expect(note).toEqual({
        uuid: 'uuid-2',
        patientUuid: 'patient-1',
        content: 'Important note',
        tags: ['urgente'],
        isPinned: true,
        createdAt: '2023-12-31T10:00:00.000Z',
        updatedAt: '2023-12-31T10:00:00.000Z',
      });
    });

    it('throws error if content is empty', () => {
      expect(() => createExtraNote('uuid-3', '   ')).toThrowError('Note content cannot be empty.');
    });
  });

  describe('validateExtraNote', () => {
    it('returns true for a valid note', () => {
      const note = createExtraNote('uuid-1', 'Valid note');
      expect(validateExtraNote(note)).toBe(true);
    });

    it('returns false if uuid is missing or empty', () => {
      const note = createExtraNote('uuid-1', 'Valid note');
      expect(validateExtraNote({ ...note, uuid: '' })).toBe(false);
      expect(validateExtraNote({ ...note, uuid: '   ' })).toBe(false);
    });

    it('returns false if content is missing or empty', () => {
      const note = createExtraNote('uuid-1', 'Valid note');
      expect(validateExtraNote({ ...note, content: '' })).toBe(false);
      expect(validateExtraNote({ ...note, content: '   ' })).toBe(false);
    });

    it('returns false if dates are invalid', () => {
      const note = createExtraNote('uuid-1', 'Valid note');
      expect(validateExtraNote({ ...note, createdAt: 'invalid-date' })).toBe(false);
      expect(validateExtraNote({ ...note, updatedAt: 'invalid-date' })).toBe(false);
    });
  });

  describe('updateExtraNote', () => {
    it('updates note properties and sets new updatedAt', () => {
      const note = createExtraNote('uuid-1', 'Old content', { createdAt: '2023-01-01T00:00:00Z' });
      vi.setSystemTime(new Date('2024-01-02T12:00:00Z'));
      
      const updatedNote = updateExtraNote(note, {
        content: '  New content  ',
        tags: ['supervisión'],
      });

      expect(updatedNote.content).toBe('New content');
      expect(updatedNote.tags).toEqual(['supervisión']);
      expect(updatedNote.createdAt).toBe('2023-01-01T00:00:00Z');
      expect(updatedNote.updatedAt).toBe('2024-01-02T12:00:00.000Z');
    });

    it('throws error if new content is empty', () => {
      const note = createExtraNote('uuid-1', 'Old content');
      expect(() => updateExtraNote(note, { content: '   ' })).toThrowError('Note content cannot be empty.');
    });
  });

  describe('togglePinExtraNote', () => {
    it('toggles isPinned status', () => {
      const note = createExtraNote('uuid-1', 'Content');
      expect(note.isPinned).toBe(false);
      
      const pinnedNote = togglePinExtraNote(note);
      expect(pinnedNote.isPinned).toBe(true);
      
      const unpinnedNote = togglePinExtraNote(pinnedNote);
      expect(unpinnedNote.isPinned).toBe(false);
    });
  });

  describe('filterExtraNotes', () => {
    const notes: ExtraNote[] = [
      createExtraNote('1', 'General note', { tags: ['supervisión'] }),
      createExtraNote('2', 'Patient 1 note', { patientUuid: 'p-1', isPinned: true }),
      createExtraNote('3', 'Important patient 1 note', { patientUuid: 'p-1', tags: ['urgente'] }),
      createExtraNote('4', 'Another patient note', { patientUuid: 'p-2', tags: ['supervisión', 'interconsulta'] }),
    ];

    it('returns all notes when no filters applied', () => {
      expect(filterExtraNotes(notes, {})).toHaveLength(4);
    });

    it('filters by patientUuid', () => {
      const filtered = filterExtraNotes(notes, { patientUuid: 'p-1' });
      expect(filtered).toHaveLength(2);
      expect(filtered.map(n => n.uuid)).toEqual(['2', '3']);
    });

    it('filters by isPinned', () => {
      const filtered = filterExtraNotes(notes, { isPinned: true });
      expect(filtered).toHaveLength(1);
      expect(filtered[0].uuid).toBe('2');
    });

    it('filters by tags (must have all specified)', () => {
      const filtered = filterExtraNotes(notes, { tags: ['supervisión'] });
      expect(filtered).toHaveLength(2);
      expect(filtered.map(n => n.uuid)).toEqual(['1', '4']);

      const filteredMultiple = filterExtraNotes(notes, { tags: ['supervisión', 'interconsulta'] });
      expect(filteredMultiple).toHaveLength(1);
      expect(filteredMultiple[0].uuid).toBe('4');
    });

    it('filters by searchTerm (case insensitive)', () => {
      const filtered = filterExtraNotes(notes, { searchTerm: 'important' });
      expect(filtered).toHaveLength(1);
      expect(filtered[0].uuid).toBe('3');

      const filtered2 = filterExtraNotes(notes, { searchTerm: '  PATIENT ' });
      expect(filtered2).toHaveLength(3);
    });

    it('combines filters', () => {
      const filtered = filterExtraNotes(notes, { 
        patientUuid: 'p-1',
        isPinned: true,
      });
      expect(filtered).toHaveLength(1);
      expect(filtered[0].uuid).toBe('2');
    });
  });
});
