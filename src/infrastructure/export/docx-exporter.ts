import { Patient } from '../../domain/patient.types';
import { Session } from '../../domain/session.types';

const INK = '#1E2A32';       // texto principal
const INK_2 = '#566670';     // texto secundario
const RULE = '#B8C4C8';      // líneas finas de separación
const PRIMARY = '#2C5F6B';   // acento petróleo
const SERIF = "Georgia, 'Times New Roman', serif";
const SANS = "Calibri, 'Segoe UI', Arial, sans-serif";

function esc(s: unknown): string {
  if (s == null) return '';
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function parseNotesToHtml(notes?: string): string {
  if (!notes) return '<p style="margin: 0; color: #566670; font-style: italic;">Sin anotaciones clínicas.</p>';
  if (notes.trim().startsWith('<') || /<[a-z][\s\S]*>/i.test(notes)) {
    return notes;
  }
  return notes
    .replace(/\n/g, '<br/>')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/## (.*?)(<br\/>|$)/g, `<h2 style="font-family: ${SERIF}; font-size: 13pt; color: ${PRIMARY}; margin-top: 14pt; margin-bottom: 4pt; border-bottom: 1pt solid ${RULE}; padding-bottom: 2pt;">$1</h2>`)
    .replace(/# (.*?)(<br\/>|$)/g, `<h1 style="font-family: ${SERIF}; font-size: 15pt; color: ${INK}; margin-top: 18pt; margin-bottom: 6pt;">$1</h1>`);
}

function formatSessionStatus(status: Session['status']): string {
  switch (status) {
    case 'completed': return 'Atendido / Realizado';
    case 'cancelled': return 'Cancelado';
    case 'missed': return 'Ausente / No asistió';
    case 'scheduled': return 'Programado';
    default: return status;
  }
}

function coverageText(patient: Patient): string {
  const os = patient.healthInsurance?.trim();
  const num = patient.affiliateNumber?.trim();
  if (os && num) return `${os} · N° ${num}`;
  if (os) return os;
  return 'Particular';
}

function contactText(patient: Patient): string {
  const parts = [patient.phone?.trim(), patient.email?.trim()].filter(Boolean);
  return parts.length ? parts.join(' · ') : '—';
}

export function generateSessionWordHtml(patient: Patient, session: Session): string {
  const dateFormatted = new Date(session.dateTime).toLocaleDateString('es-AR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const notesHtml = parseNotesToHtml(session.notes);
  const statusStr = formatSessionStatus(session.status);
  const priceStr = `$${(session.priceAtSession ?? 0).toLocaleString('es-AR')} ARS`;

  return `
    <html xmlns:o="urn:schemas-microsoft-com:office:office" 
          xmlns:w="urn:schemas-microsoft-com:office:word" 
          xmlns="http://www.w3.org/TR/REC-html40">
    <head>
      <meta charset="utf-8">
      <title>Evolución Clínica - ${esc(patient.fullName)}</title>
      <!--[if gte mso 9]>
      <xml>
        <w:WordDocument>
          <w:View>Print</w:View>
          <w:Zoom>100</w:Zoom>
          <w:DoNotOptimizeForBrowser/>
        </w:WordDocument>
      </xml>
      <![endif]-->
      <style>
        @page {
          size: 21cm 29.7cm;
          margin: 2.2cm 2.3cm 2.4cm 2.3cm;
          mso-header-margin: 1.2cm;
          mso-footer-margin: 1.2cm;
        }
        body {
          font-family: ${SANS};
          font-size: 11pt;
          line-height: 1.5;
          color: ${INK};
          background-color: #ffffff;
        }
        h1, h2, h3 { font-family: ${SERIF}; }
      </style>
    </head>
    <body style="font-family: ${SANS}; font-size: 11pt; line-height: 1.5; color: ${INK};">

      <!-- CABECERA -->
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 18pt;">
        <tr>
          <td style="vertical-align: bottom; padding: 0 0 6pt 0; border-bottom: 2pt solid ${PRIMARY};">
            <span style="font-family: ${SERIF}; font-size: 15pt; font-weight: bold; color: ${INK}; letter-spacing: 0.2pt;">PSICO-AGENDA</span>
            <span style="font-family: ${SANS}; font-size: 9pt; color: ${INK_2}; margin-left: 8pt; text-transform: uppercase; letter-spacing: 0.8pt;">Registro de Evolución Clínica</span>
          </td>
          <td style="vertical-align: bottom; text-align: right; padding: 0 0 6pt 0; border-bottom: 2pt solid ${PRIMARY}; font-family: ${SANS}; font-size: 9pt; color: ${INK_2};">
            Documento de uso profesional
          </td>
        </tr>
      </table>

      <!-- FICHA DEL PACIENTE Y SESIÓN -->
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 22pt; font-family: ${SANS}; font-size: 10pt; line-height: 1.45;">
        <tr>
          <td style="width: 54%; vertical-align: top; padding: 0 16pt 0 0;">
            <div style="font-size: 8pt; text-transform: uppercase; letter-spacing: 0.6pt; color: ${INK_2}; font-weight: bold; margin-bottom: 3pt;">Paciente</div>
            <div style="font-family: ${SERIF}; font-size: 14pt; font-weight: bold; color: ${INK}; margin-bottom: 4pt;">${esc(patient.fullName)}</div>
            <div style="font-size: 9pt; color: ${INK_2};">ID: <span style="font-family: Consolas, monospace; font-size: 8.5pt;">${esc(patient.uuid)}</span></div>
            <div style="font-size: 9.5pt; color: ${INK}; margin-top: 3pt;"><strong>Cobertura:</strong> ${esc(coverageText(patient))}</div>
          </td>
          <td style="width: 46%; vertical-align: top; padding: 0 0 0 16pt; border-left: 1pt solid ${RULE}; font-size: 9.5pt; color: ${INK};">
            <div style="font-size: 8pt; text-transform: uppercase; letter-spacing: 0.6pt; color: ${INK_2}; font-weight: bold; margin-bottom: 3pt;">Detalle de la Sesión</div>
            <div style="margin-bottom: 2pt;"><strong>Fecha:</strong> ${esc(dateFormatted)}</div>
            <div style="margin-bottom: 2pt;"><strong>Honorarios:</strong> ${priceStr}</div>
            <div><strong>Estado:</strong> ${esc(statusStr)}</div>
          </td>
        </tr>
      </table>

      <!-- TÍTULO DE EVOLUCIÓN -->
      <p style="margin: 20pt 0 6pt 0; padding-bottom: 4pt; border-bottom: 1.5pt solid ${PRIMARY}; font-family: ${SERIF}; font-size: 13pt; font-weight: bold; color: ${INK};">
        Evolución Clínica
      </p>

      <!-- CUERPO DE LA NOTA -->
      <div style="margin-top: 10pt; font-family: ${SANS}; font-size: 11pt; line-height: 1.55; color: ${INK};">
        ${notesHtml}
      </div>

      <!-- PIE DE PÁGINA MSO -->
      <table style="width: 100%; border-collapse: collapse; margin-top: 40pt;">
        <tr>
          <td style="border-top: 0.75pt solid ${RULE}; padding-top: 8pt; font-family: ${SANS}; font-size: 8.5pt; color: ${INK_2};">
            PSICO-AGENDA · Documento clínico confidencial · Exportado el ${new Date().toLocaleString('es-AR')}
          </td>
          <td style="border-top: 0.75pt solid ${RULE}; padding-top: 8pt; font-family: ${SANS}; font-size: 8.5pt; color: ${INK_2}; text-align: right;">
            <!--[if supportFields]>Página <span style='mso-element:field-begin'></span> PAGE <span style='mso-element:field-separator'></span>1<span style='mso-element:field-end'></span> de <span style='mso-element:field-begin'></span> NUMPAGES <span style='mso-element:field-separator'></span>1<span style='mso-element:field-end'></span><![endif]-->
          </td>
        </tr>
      </table>

    </body>
    </html>
  `;
}

export function exportSessionToWord(patient: Patient, session: Session) {
  const htmlContent = generateSessionWordHtml(patient, session);

  const blob = new Blob(['\ufeff' + htmlContent], {
    type: 'application/msword;charset=utf-8',
  });

  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  
  const safeName = patient.fullName.toLowerCase().replace(/[^a-z0-9]/g, '_');
  const sessionDateStr = session.dateTime.split('T')[0];
  
  a.href = url;
  a.download = `evolucion_${safeName}_${sessionDateStr}.doc`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function generateFullHistoryWordHtml(patient: Patient): string {
  const clinicalHistoryContent = patient.clinicalHistory?.trim()
    ? patient.clinicalHistory
    : `<p style="margin: 0; color: ${INK_2}; font-style: italic;">Sin anotaciones registradas aún.</p>`;

  return `
    <html xmlns:o="urn:schemas-microsoft-com:office:office" 
          xmlns:w="urn:schemas-microsoft-com:office:word" 
          xmlns="http://www.w3.org/TR/REC-html40">
    <head>
      <meta charset="utf-8">
      <title>Historial Clínico Completo - ${esc(patient.fullName)}</title>
      <!--[if gte mso 9]>
      <xml>
        <w:WordDocument>
          <w:View>Print</w:View>
          <w:Zoom>100</w:Zoom>
          <w:DoNotOptimizeForBrowser/>
        </w:WordDocument>
      </xml>
      <![endif]-->
      <style>
        @page {
          size: 21cm 29.7cm;
          margin: 2.2cm 2.3cm 2.4cm 2.3cm;
          mso-header-margin: 1.2cm;
          mso-footer-margin: 1.2cm;
        }
        body {
          font-family: ${SANS};
          font-size: 11pt;
          line-height: 1.5;
          color: ${INK};
          background-color: #ffffff;
        }
        h1, h2, h3 { font-family: ${SERIF}; }
      </style>
    </head>
    <body style="font-family: ${SANS}; font-size: 11pt; line-height: 1.5; color: ${INK};">

      <!-- CABECERA -->
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 18pt;">
        <tr>
          <td style="vertical-align: bottom; padding: 0 0 6pt 0; border-bottom: 2pt solid ${PRIMARY};">
            <span style="font-family: ${SERIF}; font-size: 16pt; font-weight: bold; color: ${INK}; letter-spacing: 0.2pt;">PSICO-AGENDA</span>
            <span style="font-family: ${SANS}; font-size: 9pt; color: ${INK_2}; margin-left: 8pt; text-transform: uppercase; letter-spacing: 0.8pt;">Historial Clínico Consolidado</span>
          </td>
          <td style="vertical-align: bottom; text-align: right; padding: 0 0 6pt 0; border-bottom: 2pt solid ${PRIMARY}; font-family: ${SANS}; font-size: 9pt; color: ${INK_2};">
            Documento de uso profesional
          </td>
        </tr>
      </table>

      <!-- FICHA DEL PACIENTE -->
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 24pt; font-family: ${SANS}; font-size: 10pt; line-height: 1.45;">
        <tr>
          <td style="width: 54%; vertical-align: top; padding: 0 16pt 0 0;">
            <div style="font-size: 8pt; text-transform: uppercase; letter-spacing: 0.6pt; color: ${INK_2}; font-weight: bold; margin-bottom: 3pt;">Paciente</div>
            <div style="font-family: ${SERIF}; font-size: 15pt; font-weight: bold; color: ${INK}; margin-bottom: 4pt;">${esc(patient.fullName)}</div>
            <div style="font-size: 9pt; color: ${INK_2};">ID: <span style="font-family: Consolas, monospace; font-size: 8.5pt;">${esc(patient.uuid)}</span></div>
          </td>
          <td style="width: 46%; vertical-align: top; padding: 0 0 0 16pt; border-left: 1pt solid ${RULE}; font-size: 9.5pt; color: ${INK};">
            <div style="font-size: 8pt; text-transform: uppercase; letter-spacing: 0.6pt; color: ${INK_2}; font-weight: bold; margin-bottom: 3pt;">Ficha Clínica</div>
            <div style="margin-bottom: 2pt;"><strong>Cobertura:</strong> ${esc(coverageText(patient))}</div>
            <div><strong>Contacto:</strong> ${esc(contactText(patient))}</div>
          </td>
        </tr>
      </table>

      <!-- HISTORIAL CLÍNICO -->
      <div style="margin-top: 10pt; font-family: ${SANS}; font-size: 11pt; line-height: 1.55; color: ${INK};">
        ${clinicalHistoryContent}
      </div>

      <!-- PIE DE PÁGINA MSO -->
      <table style="width: 100%; border-collapse: collapse; margin-top: 40pt;">
        <tr>
          <td style="border-top: 0.75pt solid ${RULE}; padding-top: 8pt; font-family: ${SANS}; font-size: 8.5pt; color: ${INK_2};">
            PSICO-AGENDA · Documento clínico confidencial · Exportado el ${new Date().toLocaleString('es-AR')}
          </td>
          <td style="border-top: 0.75pt solid ${RULE}; padding-top: 8pt; font-family: ${SANS}; font-size: 8.5pt; color: ${INK_2}; text-align: right;">
            <!--[if supportFields]>Página <span style='mso-element:field-begin'></span> PAGE <span style='mso-element:field-separator'></span>1<span style='mso-element:field-end'></span> de <span style='mso-element:field-begin'></span> NUMPAGES <span style='mso-element:field-separator'></span>1<span style='mso-element:field-end'></span><![endif]-->
          </td>
        </tr>
      </table>

    </body>
    </html>
  `;
}

export function exportFullHistoryToWord(patient: Patient) {
  const htmlContent = generateFullHistoryWordHtml(patient);

  const blob = new Blob(['\ufeff' + htmlContent], {
    type: 'application/msword;charset=utf-8',
  });

  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  
  const safeName = patient.fullName.toLowerCase().replace(/[^a-z0-9]/g, '_');
  
  a.href = url;
  a.download = `historial_completo_${safeName}.doc`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
