import { describe, it, expect } from 'vitest';
import {
  generateSessionWordHtml,
  generateFullHistoryWordHtml
} from './docx-exporter';
import { Patient } from '../../domain/patient.types';
import { Session } from '../../domain/session.types';

describe('docx-exporter', () => {
  const dummyPatient: Patient = {
    uuid: 'p-123',
    fullName: 'Juan Perez',
    email: 'juan@example.com',
    phone: '1122334455',
    address: 'Calle Falsa 123',
    healthInsurance: 'OSDE',
    affiliateNumber: '123456',
    sessionPrice: 5000,
    clinicalHistory: '<p>Historial previo</p>',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const dummySession: Session = {
    uuid: 's-123',
    patientUuid: 'p-123',
    dateTime: '2023-10-15T15:30:00Z',
    status: 'completed',
    priceAtSession: 5000,
    notes: 'Nota normal',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  describe('generateSessionWordHtml & parseNotesToHtml', () => {
    it('should generate valid HTML containing patient and session info', () => {
      const html = generateSessionWordHtml(dummyPatient, dummySession);
      expect(html).toContain('Juan Perez');
      expect(html).toContain('p-123');
      expect(html).toContain('Atendido / Realizado'); // completed status
      expect(html).toContain('5.000'); // 5000 ARS formatted
    });

    it('should handle undefined priceAtSession', () => {
      const sessionWithoutPrice = { ...dummySession, priceAtSession: undefined } as any as Session;
      const html = generateSessionWordHtml(dummyPatient, sessionWithoutPrice);
      expect(html).toContain('0 ARS'); // fallback to 0
    });

    it('should map session statuses correctly', () => {
      const statuses: Array<{ status: Session['status']; expected: string }> = [
        { status: 'scheduled', expected: 'Programado' },
        { status: 'cancelled', expected: 'Cancelado' },
        { status: 'missed', expected: 'Ausente / No asistió' },
      ];

      statuses.forEach(({ status, expected }) => {
        const session = { ...dummySession, status };
        const html = generateSessionWordHtml(dummyPatient, session);
        expect(html).toContain(expected);
      });
    });

    it('should parse markdown to HTML', () => {
      const session = {
        ...dummySession,
        notes: '# Title\n## Subtitle\n**Bold** and *Italic*\nNormal line',
      };
      const html = generateSessionWordHtml(dummyPatient, session);
      expect(html).toContain('font-family: Georgia, \'Times New Roman\', serif;');
      expect(html).toContain('Title</h1>');
      expect(html).toContain('Subtitle</h2>');
      expect(html).toContain('<strong>Bold</strong>');
      expect(html).toContain('<em>Italic</em>');
      expect(html).toContain('<br/>Normal line');
    });

    it('should pass through raw HTML', () => {
      const htmlNotes = '<p>This is <strong>raw</strong> HTML</p>';
      const session = { ...dummySession, notes: htmlNotes };
      const html = generateSessionWordHtml(dummyPatient, session);
      expect(html).toContain(htmlNotes);
    });

    it('should handle undefined notes with a fallback', () => {
      const session = { ...dummySession, notes: undefined };
      const html = generateSessionWordHtml(dummyPatient, session);
      expect(html).toContain('Sin anotaciones clínicas.');
    });

    it('should strip mark tags when enablePunctuations is false', () => {
      const htmlNotes = '<p>Test <mark data-color="yellow">highlight</mark></p>';
      const session = { ...dummySession, notes: htmlNotes };
      const html = generateSessionWordHtml(dummyPatient, session, {
        clinicalFeatures: { enablePunctuations: false, enableMovements: true }
      });
      expect(html).toContain('<p>Test highlight</p>');
      expect(html).not.toContain('<mark');
    });

    it('should include mark tags when enablePunctuations is true or undefined', () => {
      const htmlNotes = '<p>Test <mark data-color="yellow">highlight</mark></p>';
      const session = { ...dummySession, notes: htmlNotes };
      
      const html1 = generateSessionWordHtml(dummyPatient, session);
      expect(html1).toContain('<mark data-color="yellow">highlight</mark>');

      const html2 = generateSessionWordHtml(dummyPatient, session, {
        clinicalFeatures: { enablePunctuations: true, enableMovements: true }
      });
      expect(html2).toContain('<mark data-color="yellow">highlight</mark>');
    });

    it('should include movement label when enableMovements is true or undefined and colorTag is present', () => {
      const session = { ...dummySession, colorTag: 'indigo' };
      
      const html1 = generateSessionWordHtml(dummyPatient, session);
      expect(html1).toContain('<strong>Movimiento:</strong> Control');

      const html2 = generateSessionWordHtml(dummyPatient, session, {
        clinicalFeatures: { enablePunctuations: true, enableMovements: true }
      });
      expect(html2).toContain('<strong>Movimiento:</strong> Control');
    });

    it('should omit movement label when enableMovements is false', () => {
      const session = { ...dummySession, colorTag: 'indigo' };
      const html = generateSessionWordHtml(dummyPatient, session, {
        clinicalFeatures: { enablePunctuations: true, enableMovements: false }
      });
      expect(html).not.toContain('<strong>Movimiento:</strong> Control');
    });
  });

  describe('generateFullHistoryWordHtml', () => {
    it('should generate valid HTML containing patient history', () => {
      const html = generateFullHistoryWordHtml(dummyPatient);
      expect(html).toContain('Juan Perez');
      expect(html).toContain('p-123');
      expect(html).toContain('OSDE · N° 123456');
      expect(html).toContain('1122334455 · juan@example.com');
      expect(html).toContain('<p>Historial previo</p>');
    });

    it('should handle fallback for health insurance and contact', () => {
      const patientWithoutInfo = {
        ...dummyPatient,
        healthInsurance: undefined,
        affiliateNumber: undefined,
        phone: undefined,
        email: undefined,
      };
      const html = generateFullHistoryWordHtml(patientWithoutInfo);
      expect(html).toContain('Particular'); // health insurance
      expect(html).toContain('—'); // contact
    });

    it('should handle missing affiliate number but existing health insurance', () => {
      const patientWithoutAffiliate = {
        ...dummyPatient,
        affiliateNumber: undefined,
      };
      const html = generateFullHistoryWordHtml(patientWithoutAffiliate);
      expect(html).toContain('OSDE');
      expect(html).not.toContain('OSDE (N° Particular)');
    });

    it('should handle fallback for empty clinical history', () => {
      const patientWithoutHistory = { ...dummyPatient, clinicalHistory: undefined };
      const html = generateFullHistoryWordHtml(patientWithoutHistory);
      expect(html).toContain('Sin anotaciones registradas aún.');
    });

    it('should strip mark tags from clinical history when enablePunctuations is false', () => {
      const patientWithMark = { ...dummyPatient, clinicalHistory: '<p>History with <mark>highlight</mark></p>' };
      const html = generateFullHistoryWordHtml(patientWithMark, {
        clinicalFeatures: { enablePunctuations: false, enableMovements: true }
      });
      expect(html).toContain('<p>History with highlight</p>');
      expect(html).not.toContain('<mark');
    });

    it('should keep mark tags in clinical history when enablePunctuations is true or undefined', () => {
      const patientWithMark = { ...dummyPatient, clinicalHistory: '<p>History with <mark>highlight</mark></p>' };
      
      const html1 = generateFullHistoryWordHtml(patientWithMark);
      expect(html1).toContain('<p>History with <mark>highlight</mark></p>');

      const html2 = generateFullHistoryWordHtml(patientWithMark, {
        clinicalFeatures: { enablePunctuations: true, enableMovements: true }
      });
      expect(html2).toContain('<p>History with <mark>highlight</mark></p>');
    });
  });
});
