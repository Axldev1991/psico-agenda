import { describe, it, expect, vi, beforeEach } from 'vitest';
import { purgeAxelModelPatients, MODEL_PATIENT_UUIDS } from './cleanup.service';
import { db } from './dexie.db';

describe('purgeAxelModelPatients', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('deletes model patients, their sessions, recurrence rules, and extra notes from Dexie', async () => {
    const deletePatientSpy = vi.spyOn(db.patients, 'delete').mockResolvedValue(undefined as any);
    const getPatientSpy = vi.spyOn(db.patients, 'get').mockResolvedValue({ uuid: 'patient-axel-pasado' } as any);
    
    const mockWhereClause = {
      equals: vi.fn().mockReturnValue({
        count: vi.fn().mockResolvedValue(2),
        delete: vi.fn().mockResolvedValue(2),
      }),
    };

    vi.spyOn(db.sessions, 'where').mockReturnValue(mockWhereClause as any);
    vi.spyOn(db.extraNotes, 'where').mockReturnValue(mockWhereClause as any);
    const getRecurrenceSpy = vi.spyOn(db.recurrenceRules, 'get').mockResolvedValue({ patientUuid: 'patient-axel-pasado' } as any);
    const deleteRecurrenceSpy = vi.spyOn(db.recurrenceRules, 'delete').mockResolvedValue(undefined as any);

    (vi.spyOn(db, 'transaction') as any).mockImplementation(async (...args: any[]) => {
      const callback = args[args.length - 1];
      return callback();
    });

    const purged = await purgeAxelModelPatients();

    expect(purged).toBe(true);
    expect(deletePatientSpy).toHaveBeenCalledWith('patient-axel-pasado');
    expect(deletePatientSpy).toHaveBeenCalledWith('patient-axel-futuro');
    expect(deleteRecurrenceSpy).toHaveBeenCalledWith('patient-axel-pasado');
    expect(deleteRecurrenceSpy).toHaveBeenCalledWith('patient-axel-futuro');
  });

  it('returns false when no model patients or artifacts exist', async () => {
    vi.spyOn(db.patients, 'get').mockResolvedValue(undefined);
    const mockEmptyWhereClause = {
      equals: vi.fn().mockReturnValue({
        count: vi.fn().mockResolvedValue(0),
        delete: vi.fn().mockResolvedValue(0),
      }),
    };
    vi.spyOn(db.sessions, 'where').mockReturnValue(mockEmptyWhereClause as any);
    vi.spyOn(db.extraNotes, 'where').mockReturnValue(mockEmptyWhereClause as any);
    vi.spyOn(db.recurrenceRules, 'get').mockResolvedValue(undefined);

    (vi.spyOn(db, 'transaction') as any).mockImplementation(async (...args: any[]) => {
      const callback = args[args.length - 1];
      return callback();
    });

    const purged = await purgeAxelModelPatients();
    expect(purged).toBe(false);
  });
});

