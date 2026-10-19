import { describe, it, expect } from 'vitest';
import { generateClinicalHistoryDocument } from './export.service';
import { Patient } from './patient.types';
import { Session } from './session.types';

describe('export.service', () => {
  const mockPatient: Patient = {
    uuid: '123',
    fullName: 'Juan Pérez & Cía',
    healthInsurance: 'OSDE < 210',
    affiliateNumber: '12345-6',
    birthDate: '1990-01-01',
    sessionPrice: 1000,
    createdAt: '2023-01-01T00:00:00.000Z',
    updatedAt: '2023-01-01T00:00:00.000Z',
    ceciOcupacion: 'Software Engineer "Senior"',
  };

  const mockSessions: Session[] = [
    {
      uuid: 'session-2',
      patientUuid: '123',
      dateTime: '2023-02-01T10:00:00.000Z',
      status: 'completed',
      priceAtSession: 1000,
      notes: 'Segunda sesión. Paciente refiere "mejoría".',
      createdAt: '2023-02-01T00:00:00.000Z',
      updatedAt: '2023-02-01T00:00:00.000Z',
    },
    {
      uuid: 'session-1',
      patientUuid: '123',
      dateTime: '2023-01-15T10:00:00.000Z',
      status: 'scheduled',
      priceAtSession: 1000,
      notes: '<p>Primera sesión de <strong>evaluación</strong>.</p>',
      createdAt: '2023-01-15T00:00:00.000Z',
      updatedAt: '2023-01-15T00:00:00.000Z',
    },
  ];

  it('escapes patient metadata correctly', () => {
    const html = generateClinicalHistoryDocument(mockPatient, []);
    expect(html).toContain('Juan Pérez &amp; Cía');
    expect(html).toContain('OSDE &lt; 210');
    expect(html).toContain('Software Engineer &quot;Senior&quot;');
  });

  it('includes CECI section if data is present', () => {
    const html = generateClinicalHistoryDocument(mockPatient, []);
    expect(html).toContain('Ficha CECI');
    expect(html).toContain('Ocupación');
    expect(html).toContain('Software Engineer &quot;Senior&quot;');
  });

  it('omits CECI section if no data is present', () => {
    const patientWithoutCeci = { ...mockPatient, ceciOcupacion: undefined };
    const html = generateClinicalHistoryDocument(patientWithoutCeci, []);
    expect(html).not.toContain('Ficha CECI');
  });

  it('formats and sorts sessions chronologically', () => {
    const html = generateClinicalHistoryDocument(mockPatient, mockSessions);
    const session1Index = html.indexOf('Primera sesión');
    const session2Index = html.indexOf('Segunda sesión');

    expect(session1Index).toBeGreaterThan(-1);
    expect(session2Index).toBeGreaterThan(-1);
    // Session 1 (Jan 15) should appear before Session 2 (Feb 1)
    expect(session1Index).toBeLessThan(session2Index);
  });

  it('parses notes HTML correctly', () => {
    const html = generateClinicalHistoryDocument(mockPatient, mockSessions);
    // Should preserve existing HTML
    expect(html).toContain('<p>Primera sesión de <strong>evaluación</strong>.</p>');
    // Should escape non-HTML notes
    expect(html).toContain('Paciente refiere &quot;mejoría&quot;.');
  });
});
