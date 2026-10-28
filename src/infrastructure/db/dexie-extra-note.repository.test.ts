import { describe, it, expect, beforeEach, vi } from 'vitest';
import { DexieExtraNoteRepository } from './dexie-extra-note.repository';
import { ExtraNote } from '../../domain/extra-note.types';

const { mockToArray, mockGet, mockPut, mockBulkPut, mockDelete, mockWhere } = vi.hoisted(() => {
  const toArray = vi.fn();
  const deleteMock = vi.fn();
  
  return {
    mockToArray: toArray,
    mockGet: vi.fn(),
    mockPut: vi.fn(),
    mockBulkPut: vi.fn(),
    mockDelete: vi.fn(),
    mockWhere: vi.fn().mockReturnValue({
      equals: vi.fn().mockReturnValue({
        toArray,
        delete: deleteMock
      })
    }),
  };
});

vi.mock('./dexie.db', () => ({
  db: {
    extraNotes: {
      toArray: mockToArray,
      get: mockGet,
      put: mockPut,
      bulkPut: mockBulkPut,
      delete: mockDelete,
      where: mockWhere,
    }
  }
}));

describe('DexieExtraNoteRepository', () => {
  let repository: DexieExtraNoteRepository;

  beforeEach(() => {
    vi.clearAllMocks();
    repository = new DexieExtraNoteRepository();
  });

  const mockNote: ExtraNote = {
    uuid: 'note-1',
    patientUuid: 'patient-1',
    content: 'Test content',
    tags: ['urgente'],
    isPinned: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  it('should get all notes', async () => {
    const notes = [mockNote];
    mockToArray.mockResolvedValue(notes);

    const result = await repository.getAll();

    expect(mockToArray).toHaveBeenCalled();
    expect(result).toEqual(notes);
  });

  it('should get note by uuid', async () => {
    mockGet.mockResolvedValue(mockNote);

    const result = await repository.getByUuid('note-1');

    expect(mockGet).toHaveBeenCalledWith('note-1');
    expect(result).toEqual(mockNote);
  });

  it('should get note by patient', async () => {
    const notes = [mockNote];
    mockToArray.mockResolvedValue(notes);

    const result = await repository.getByPatient('patient-1');

    expect(mockWhere).toHaveBeenCalledWith('patientUuid');
    expect(result).toEqual(notes);
  });

  it('should save note', async () => {
    await repository.save(mockNote);

    expect(mockPut).toHaveBeenCalledWith(mockNote);
  });

  it('should save all notes', async () => {
    const notes = [mockNote, { ...mockNote, uuid: 'note-2' }];
    await repository.saveAll(notes);

    expect(mockBulkPut).toHaveBeenCalledWith(notes);
  });

  it('should not bulk put if array is empty', async () => {
    await repository.saveAll([]);

    expect(mockBulkPut).not.toHaveBeenCalled();
  });

  it('should delete note by uuid', async () => {
    await repository.delete('note-1');

    expect(mockDelete).toHaveBeenCalledWith('note-1');
  });

  it('should delete notes by patient uuid', async () => {
    await repository.deleteByPatient('patient-1');

    expect(mockWhere).toHaveBeenCalledWith('patientUuid');
  });
});
